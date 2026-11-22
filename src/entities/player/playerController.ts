import Input from '../../systems/input.ts';
import PlayerModel from './playerModel.ts';
import type kv from 'konva';
import { BoundingBox, resolveHorizontalMovement, resolveVerticalMovement, checkAABBCollision } from '../../systems/collision.ts';
import { GRAVITY, applyGravity } from '../../systems/physics.ts';
import Slope from '../slope/slope.ts';

/**
 * Moves the player in response to keyboard input.
 *
 * Each frame, {@link update} polls {@link Input} and moves the model's sprite
 * horizontally: `A` / `ArrowLeft` moves left, `D` / `ArrowRight` moves right.
 * Holding both directions at once (or neither) decelerates to a stop.
 * Movement is tracked using xSpeed, which is updated per frame depending on
 * time elapsed from last frame, denoted dt, within the moveX(dt) function.
 *
 * Vertically, the player always falls under gravity (see moveY(dt)) and lands
 * on solid obstacles. While standing on one, `Space` / `ArrowUp` / `W` jumps.
 * Jumps are forgiving: they still work shortly after walking off a ledge
 * (coyote time) or when pressed shortly before landing (jump buffering), and
 * releasing jump while rising cuts the jump short (variable jump height).
 */
export default class PlayerController {
	private input: Input;
	private model: PlayerModel;

	private spawnX: number;
	private spawnY: number;

	/** Signed horizontal velocity, in pixels per second (negative is left). */
	private xSpeed: number = 0;
	/** Signed vertical velocity, in pixels per second (negative is up). */
	private ySpeed: number = 0;

	/** Whether the player is standing on a solid obstacle (set each frame). */
	private grounded: boolean = false;
	/** Seconds left in which a jump is allowed after leaving the ground. */
	private coyoteTimer: number = 0;
	/** Seconds left in which a recent jump press still counts. */
	private jumpBufferTimer: number = 0;
	/** Whether the current jump can still be cut short by releasing jump. */
	private jumpCuttable: boolean = false;

	/** Whether the player has just respawned and not let go of the respawn button. */
	private respawned: boolean = false;

	/** Bounding box that indnicates the player hitbox */
	//public AABB: BoundingBox;
	/** Static readonlys as constants */
	public static readonly MAX_X_SPEED: number = 450;

	/** Acceleration / deceleration for horizontal movement.
	 * (Note: Should be relatively large to ensure snappy movement.)
	*/
	public static readonly X_ACCELERATION: number = 1600;
	public static readonly X_DECELERATION: number = 4500;

	/** Peak height of a jump, in pixels. */
	public static readonly JUMP_HEIGHT = 150;
	/** Initial upward speed needed to reach JUMP_HEIGHT under gravity. */
	public static readonly JUMP_SPEED = Math.sqrt(
		2 * GRAVITY * PlayerController.JUMP_HEIGHT
	);

	/** Seconds after leaving the ground during which the player can still jump. */
	public static readonly COYOTE_TIME = 0.1;
	/** Seconds before landing during which a jump press is remembered. */
	public static readonly JUMP_BUFFER_TIME = 0.1;
	/**
	 * Multiplier applied to upward speed when jump is released mid-rise.
	 * Height scales with speed squared, so 0.5 gives at most a quarter of the
	 * remaining rise.
	 */
	public static readonly JUMP_CUT = 0.5;

	private static readonly COLLISION_OFFSET = 1e-6;

	/**
	 * @param input - Shared input manager to poll key frame.
	 * @param model - The player model whose sprite this controller moves.
	 */
	constructor(input: Input, model: PlayerModel) {
		this.input = input;
		this.model = model;

		this.spawnX = model.getSprite().x();
		this.spawnY = model.getSprite().y();

		//this.AABB = this.offsetBoundingBox(this.model.getBoundingBox(), 
											//this.SPAWN_X, this.SPAWN_Y);
		this.xSpeed = 0;
		this.ySpeed = 0;
		this.grounded = false;
	}

	/**
	 * Applies one frame of movement, resolved against solid room obstacles.
	 *
	 * @param dt - Seconds elapsed since the last frame.
	 * @param obstacles - Collection of Konva nodes on the stage to test for collisions.
	 */
	public update(dt: number, obstacles: kv.Node[] = [], slopes: Slope[] = []): void {
		if(this.isRespawn() && !this.respawned){
			this.respawn();
			this.respawned = true;
		}

		if(!this.isRespawn()) this.respawned = false;

		const dx = this.moveX(dt);
		const dy = this.moveY(dt);

		if(dx === 0 && dy === 0) return;

		const sprite = this.model.getSprite();
		const parent = sprite.getParent() ?? undefined;

		for (const node of obstacles) {
			if (node === sprite) continue;
			if (node.hasName('spikes')){
				let boundingBox = node.getClientRect({ relativeTo: parent });
				if(checkAABBCollision(this.model.getBoundingBox(), boundingBox)){
					this.respawn();
					return;
				}
			}
		}

		let boundingBoxes = this.getObstacleBoxes(obstacles);
		boundingBoxes = boundingBoxes.concat(this.getSlopeBoxes(slopes));

		let playerBox: BoundingBox = sprite.getClientRect({
				relativeTo: parent
		});

		if(dx !== 0) {
			const safeTopLeftX = resolveHorizontalMovement(
				playerBox, dx, boundingBoxes
			);
			const deltaXApplied = safeTopLeftX - playerBox.x;

			if(Math.abs(deltaXApplied) < Math.abs(dx)
				- PlayerController.COLLISION_OFFSET) this.xSpeed = 0;

			sprite.x(sprite.x() + deltaXApplied);
		}

		if(dy !== 0) {
			if (dx !== 0)
				playerBox = sprite.getClientRect({ relativeTo: parent });

			const safeTopLeftY = resolveVerticalMovement(
				playerBox, dy, boundingBoxes
			);
			const deltaYApplied = safeTopLeftY - playerBox.y;

			const blocked = Math.abs(deltaYApplied) < Math.abs(dy) - PlayerController.COLLISION_OFFSET;
			this.grounded = blocked && dy > 0;
			if(blocked)
				this.ySpeed = 0;

			sprite.y(sprite.y() + deltaYApplied);
		}
	}

	/** 
	 * Respawns player at level spawn after death and sets currSpeed to 0. 
	 */
	public respawn(){
		this.model.getSprite().x(this.spawnX);
		this.model.getSprite().y(this.spawnY);
		this.xSpeed = 0;
		this.ySpeed = 0;
		this.grounded = false;
		this.jumpCuttable = false;
		this.coyoteTimer = 0;
		this.jumpBufferTimer = 0;
	}

	/**
	 * Sets a new spawn point for the player. May be useful when transitioning
	 * between levels.
	 * @param x - The new player spawn point's x coordinate.
	 * @param y - The new player spawn point's y coordinate.
	 */	
	public setSpawn(x: number, y: number){
		this.spawnX = x;
		this.spawnY = y;
	}

	/**
	 * Offsets a given bounding box by an x offset value and a y offset value.
	 * 
	 * @param box - The bounding box to be offsetted.
	 * @param x - The x offset value, in pixels.
	 * @param y - The y offset value, in pixels.
	 * @returns A new bounding box with the same width and height as box, but
	 * offsetted x pixels to the right and y pixels downwards. 
	 */
	private offsetBoundingBox(box: BoundingBox, x: number, y: number): BoundingBox{
		return {
			x: box.x + x,
			y: box.y + y,
			width: box.width,
			height: box.height
		};
	}

	/**
	 * Applies movement and acceleration to the player for one frame. Updates
	 * xSpeed to be the calculated player speed during this frame.
	 *
	 * @param dt Seconds elapsed since the last frame. Movement is scaled by
	 *   this so speed stays the same regardless of frame rate. Assumed to be
	 *   positive and 0.1 at max.
	 * @returns Number of pixels moved this frame.
	 */
	private moveX(dt: number): number{
		/** Assumes dt is at most 0.1 */
		if(dt > 0.1 || dt < 0) throw new Error("Invalid delta time");

		let deltaX = 0;

		/** If both directions are pressed or not pressed, decelerate. */
		if(this.isLeft() === this.isRight()){
			let timeToZero = Math.abs(this.xSpeed
									  / PlayerController.X_DECELERATION);
			/** Always decelerate during dt */
			if(timeToZero >= dt){
				deltaX = 0.5 * (this.xSpeed + Math.sign(this.xSpeed)
						 * Math.max(0, Math.abs(this.xSpeed)
						 - PlayerController.X_DECELERATION * dt)) * dt

				this.xSpeed = Math.sign(this.xSpeed)
								* Math.max(0, Math.abs(this.xSpeed)
								- PlayerController.X_DECELERATION * dt);
			}
			/** Reaches 0 during dt */
			else{
				deltaX = 0.5 * this.xSpeed * timeToZero;
				this.xSpeed = 0;
			}
		}

		/** If only left or right is pressed, go that direction. */
		else{
			let sign = this.isLeft() ? -1 : 1;

			if (- sign * this.xSpeed > 0){
				let timeToZero = Math.abs(this.xSpeed
									  	  / PlayerController.X_DECELERATION);
				/** Always decelerate during dt */
				if(timeToZero >= dt){
					deltaX = 0.5 * (this.xSpeed + this.xSpeed
							 + sign * PlayerController.X_DECELERATION * dt)
							 * dt
					this.xSpeed += sign
									  * PlayerController.X_DECELERATION * dt;
				}
				/** Decelerate then accelerate during dt */
				else{
					let timeToMax = PlayerController.MAX_X_SPEED
									/ PlayerController.X_ACCELERATION;
					let accelTime = Math.min(dt - timeToZero, timeToMax);
					deltaX = 0.5 * this.xSpeed * timeToZero
							 + 0.5 * sign * PlayerController.X_ACCELERATION
							 * accelTime * accelTime
					/** Reaches max during dt */
					if(dt - timeToZero >= timeToMax){
						deltaX += sign * PlayerController.MAX_X_SPEED
								  * (dt - timeToZero - timeToMax)
					}
					this.xSpeed = sign * PlayerController.X_ACCELERATION
									 * accelTime;
				}
			}
			else{
				let timeToMax = (PlayerController.MAX_X_SPEED
								- Math.abs(this.xSpeed))
								/ PlayerController.X_ACCELERATION;
				/** Always accelerate during dt */
				if(timeToMax >= dt){
					deltaX = 0.5 * (this.xSpeed + this.xSpeed
							 + sign * PlayerController.X_ACCELERATION * dt)
							 * dt
					this.xSpeed += sign
									  * PlayerController.X_ACCELERATION * dt;
				}
				/** Accelerate and reached max during dt */
				else{
					deltaX = 0.5 * (this.xSpeed + sign
									* PlayerController.MAX_X_SPEED) * timeToMax
							+ sign * PlayerController.MAX_X_SPEED
								* (dt - timeToMax)
					this.xSpeed = sign * PlayerController.MAX_X_SPEED;
				}
			}
		}

		return deltaX;
	}

	/**
	 * Applies a jump (if one is allowed), cuts a rising jump short if jump was
	 * released, and applies one frame of gravity. Updates ySpeed to be the
	 * player's vertical speed after this frame.
	 *
	 * A jump happens when jump was held within the last JUMP_BUFFER_TIME and
	 * the player was grounded within the last COYOTE_TIME. A buffered jump
	 * whose key was already released gets cut on the next frame, so a quick
	 * tap before landing gives a short hop.
	 *
	 * Gravity applies even while grounded so that the floor blocking it each
	 * frame is what keeps grounded true; walking off a ledge clears it.
	 *
	 * @param dt Seconds elapsed since the last frame.
	 * @returns Number of pixels moved this frame (positive is down).
	 */
	private moveY(dt: number): number {
		this.coyoteTimer = this.grounded
			? PlayerController.COYOTE_TIME
			: Math.max(0, this.coyoteTimer - dt);
		this.jumpBufferTimer = this.isJump()
			? PlayerController.JUMP_BUFFER_TIME
			: Math.max(0, this.jumpBufferTimer - dt);

		if(this.jumpBufferTimer && this.coyoteTimer) {
			this.ySpeed = -PlayerController.JUMP_SPEED;
			this.grounded = false;
			this.coyoteTimer = 0;
			this.jumpBufferTimer = 0;
			this.jumpCuttable = true;
		} else if(this.jumpCuttable && this.ySpeed < 0 && !this.isJump()) {
			this.ySpeed *= PlayerController.JUMP_CUT;
			this.jumpCuttable = false;
		}

		const {ySpeed, dy} = applyGravity(this.ySpeed, dt);
		this.ySpeed = ySpeed;
		return dy;
	}

	/**
	 * Collects the bounding boxes of all solid obstacles, relative to the
	 * player's parent so they share a coordinate space with the player's box.
	 *
	 * @param obstacles - Konva nodes on the stage to test for collisions.
	 * @returns Bounding boxes of the nodes tagged `'solid'`, excluding the player.
	 */
	private getObstacleBoxes(obstacles: kv.Node[]): BoundingBox[] {
		const sprite = this.model.getSprite();
		const parent = sprite.getParent() ?? undefined;

		const boxes: BoundingBox[] = []
		for (const node of obstacles) {
			if (node === sprite) continue;
			// If obstacles are tagged with 'solid'  check here:
			if (node.hasName('solid')) {
				boxes.push(node.getClientRect({ relativeTo: parent }));
			}
		}
		return boxes;
	}

	private getSlopeBoxes(slopes: Slope[]): BoundingBox[]{
		let boxes: BoundingBox[] = [];
		slopes.forEach(s => {
			if(s.stabilized) boxes.push(s.getLineBox());
		});
		return boxes;
	}

	/**
	 * Checks whether any "left" button is pressed in Input.
	 *
	 * @returns whether any "left" button is pressed
	 */
	private isLeft() {
		return this.input.isKeyDown('KeyA')
				|| this.input.isKeyDown('ArrowLeft');
	}

	/**
	 * Checks whether any "right" button is pressed in Input.
	 *
	 * @returns whether any "right" button is pressed
	 */
	private isRight() {
		return this.input.isKeyDown('KeyD')
				|| this.input.isKeyDown('ArrowRight');
	}

	/**
	 * Checks whether any "jump" button is pressed in Input.
	 *
	 * @returns whether any "jump" button is pressed
	 */
	private isJump() {
		return this.input.isKeyDown('Space')
				|| this.input.isKeyDown('ArrowUp')
				|| this.input.isKeyDown('KeyW');
	}

	/**
	 * Checks whether the respawn button is pressed in Input.
	 * @returns whether the respawn button is pressed in Input.
	 */
	private isRespawn(){
		return this.input.isKeyDown('KeyR');
	}
}
