import Input from '../../systems/input.ts';
import PlayerModel from './playerModel.ts';
import type kv from 'konva';
import { BoundingBox, resolveHorizontalMovement } from '../../systems/collision.ts';

/**
 * Moves the player in response to keyboard input.
 *
 * Each frame, {@link update} polls {@link Input} and moves the model's sprite
 * horizontally: `A` / `ArrowLeft` moves left, `D` / `ArrowRight` moves right.
 * Holding both directions at once cancels out.
 */
export default class PlayerController {
	private input: Input;
	private model: PlayerModel;
	/** Horizontal movement speed, in pixels per second. */
	private curr_speed: number;

	/**
	 * @param input - Shared input manager to poll key frame.
	 * @param model - The player model whose sprite this controller moves.
	 */
	constructor(input: Input, model: PlayerModel) {
		this.input = input;
		this.model = model;
		this.curr_speed = 0;
	}

	/**
	 * Applies one frame of movement, resolved against solid room obstacles.
	 *
	 * @param dt - Seconds elapsed since the last frame. Movement is scaled by
	 *   this so speed stays the same regardless of frame rate.
	 * @param obstacles - Collection of Konva nodes on the stage to test for collisions.
	 */
	public update(dt: number, obstacles: kv.Node[] = []): void {
		let dx = 0;

		if (this.input.isKeyDown('KeyA') || this.input.isKeyDown('ArrowLeft')) {
			dx -= this.speed * dt;
		}
		if (this.input.isKeyDown('KeyD') || this.input.isKeyDown('ArrowRight')) {
			dx += this.speed * dt;
		}

		if (dx === 0) return;

		const sprite = this.model.getSprite();
		const parent = sprite.getParent() ?? undefined;

		const playerBox: BoundingBox = sprite.getClientRect({ relativeTo: parent });

		const obstacleBoxes: BoundingBox[] = [];
		for (const node of obstacles) {
			if (node === sprite) continue;
			// If obstacles are tagged with 'solid'  check here:
			if (node.hasName('solid')) {
				obstacleBoxes.push(node.getClientRect({ relativeTo: parent }));
			}
		}

		const safeTopLeftX = resolveHorizontalMovement(playerBox, dx, obstacleBoxes);

		const deltaApplied = safeTopLeftX - playerBox.x;
		sprite.x(sprite.x() + deltaApplied);
	}
	
	private move(dt: number){
		/** If both directions are pressed, decelerate. */
		if(this.isLeft() && this.isRight()){
				this.curr_speed = Math.sign(this.curr_speed) 
								  * Math.max(0, Math.abs(this.curr_speed) 
								  - PlayerModel.getXDeceleration() * dt);
		}
		/** If only left is pressed, go left. */
		else if(this.isLeft()) {
			this.curr_speed = Math.max(- PlayerModel.getMaxXSpeed(), 
									 	   this.curr_speed 
										   - PlayerModel.getXAcceleration() * dt);
		}
		/** If only right is pressed, go right. */
		else if(this.isRight()) {
			this.curr_speed = Math.min(PlayerModel.getMaxXSpeed(), 
										this.curr_speed 
										+ PlayerModel.getXAcceleration() * dt);
		}
		/** Otherwise, decelerate. */
		else{
			this.curr_speed = Math.sign(this.curr_speed) 
							  * Math.max(0, Math.abs(this.curr_speed) 
							  - PlayerModel.getXDeceleration() * dt);
		}

		this.model.getSprite().x(
			this.model.getSprite().x() + this.curr_speed * dt
		);
	}

	/**
	 * Checks whether any "left" button is pressed in Input.
	 * @returns whether any "left" button is pressed
	 */
	private isLeft(){
		return this.input.isKeyDown('KeyA') 
				|| this.input.isKeyDown('ArrowLeft');
	}

	/**
	 * Checks whether any "right" button is pressed in Input.
	 * @returns whether any "right" button is pressed
	 */
	private isRight(){
		return this.input.isKeyDown('KeyD') 
				|| this.input.isKeyDown('ArrowRight');
	}
}
