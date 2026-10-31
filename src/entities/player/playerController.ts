import Input from '../../systems/input.ts';
import PlayerModel from './playerModel.ts';

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
	private currSpeed: number;

	/** Static readonlys as constants */
	public static readonly MAX_X_SPEED: number = 200; 
	/** Acceleration / deceleration for horizontal movement. 
	 * (Note: Should be relatively large to ensure snappy movement.)
	*/
	public static readonly X_ACCELERATION: number = 800;
	public static readonly X_DECELERATION: number = 1600;

	/**
	 * @param input - Shared input tracker to poll each frame.
	 * @param model - The player model whose sprite this controller moves.
	 */
	constructor(input: Input, model: PlayerModel) {
		this.input = input;
		this.model = model;
		this.currSpeed = 0;
	}

	/**
	 * Updates player object for one frame.
	 *
	 * @param dt - Seconds elapsed since the last frame. 
	 */
	public update(dt: number) {
		this.move(dt);
	}

	/**
	 * Applies movement and acceleration to the player for one frame.
	 *
	 * @param dt - Seconds elapsed since the last frame. Movement is scaled by
	 *   this so speed stays the same regardless of frame rate. Assumed to be
	 *   0.1 at max.
	 */
	private move(dt: number){
		/** Assumes dt is at most 0.1 */
		if(dt > 0.1) throw new Error("Invalid delta time");

		/** If both directions are pressed or not pressed, decelerate. */
		if(this.isLeft() === this.isRight()){
			let timeToZero = Math.abs(this.currSpeed 
									  / PlayerController.X_DECELERATION);
			/** Always decelerate during dt */
			if(timeToZero >= dt){
				this.model.getSprite().x(
					this.model.getSprite().x() 
					+ 0.5 * (this.currSpeed + Math.sign(this.currSpeed) 
							* Math.max(0, Math.abs(this.currSpeed) 
							- PlayerController.X_DECELERATION * dt)) * dt
				);
				this.currSpeed = Math.sign(this.currSpeed) 
								* Math.max(0, Math.abs(this.currSpeed) 
								- PlayerController.X_DECELERATION * dt);
			}
			/** Reaches 0 during dt */
			else{
				this.model.getSprite().x(
					this.model.getSprite().x() 
					+ 0.5 * this.currSpeed * timeToZero);
				this.currSpeed = 0;
			}
		}
		
		/** If only left or right is pressed, go that direction. */
		else{
			let sign = this.isLeft() ? -1 : 1;

			if (- sign * this.currSpeed > 0){
				let timeToZero = Math.abs(this.currSpeed 
									  	  / PlayerController.X_DECELERATION);
				/** Always decelerate during dt */
				if(timeToZero >= dt){
					this.model.getSprite().x(
						this.model.getSprite().x() 
						+ 0.5 * (this.currSpeed + this.currSpeed
								+ sign * PlayerController.X_DECELERATION * dt) 
								* dt
					);
					this.currSpeed += sign 
									  * PlayerController.X_DECELERATION * dt;
				}
				/** Decelerate then accelerate during dt */
				else{
					this.model.getSprite().x(
						this.model.getSprite().x() 
						+ 0.5 * this.currSpeed * timeToZero
						+ 0.5 * sign * PlayerController.X_ACCELERATION 
						* (dt - timeToZero) * (dt - timeToZero)
					);
					this.currSpeed = sign * PlayerController.X_ACCELERATION 
									 * (dt - timeToZero);
				}
			}
			else{
				let timeToMax = (PlayerController.MAX_X_SPEED 
								- Math.abs(this.currSpeed))
								/ PlayerController.X_ACCELERATION;
				/** Always accelerate during dt */
				if(timeToMax >= dt){
					this.model.getSprite().x(
						this.model.getSprite().x() 
						+ 0.5 * (this.currSpeed + this.currSpeed
								+ sign * PlayerController.X_ACCELERATION * dt)
								* dt
					);
					this.currSpeed += sign 
									  * PlayerController.X_ACCELERATION * dt;
				}
				/** Accelerate and reached max during dt */
				else{
					this.model.getSprite().x(
						this.model.getSprite().x() 
						+ 0.5 * (this.currSpeed 
								+ sign * PlayerController.MAX_X_SPEED) 
						* timeToMax
						+ sign * PlayerController.MAX_X_SPEED * (dt - timeToMax)
					);
					this.currSpeed = sign * PlayerController.MAX_X_SPEED;
				}
			}
		}
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
