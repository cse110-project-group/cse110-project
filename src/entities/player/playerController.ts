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
	private static readonly MAX_X_SPEED: number = 200; 
	/** Acceleration / deceleration for horizontal movement. 
	 * (Note: Should be relatively large to ensure snappy movement.)
	*/
	private static readonly X_ACCELERATION: number = 800;
	private static readonly X_DECELERATION: number = 1600;

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
	 *   this so speed stays the same regardless of frame rate.
	 */
	private move(dt: number){
		/** If both directions are pressed, decelerate. */
		if(this.isLeft() && this.isRight()){
				this.currSpeed = Math.sign(this.currSpeed) 
								  * Math.max(0, Math.abs(this.currSpeed) 
								  - PlayerController.X_DECELERATION * dt);
		}
		/** If only left is pressed, go left. */
		else if(this.isLeft()) {
			/** If moving right, decelerate first */
			if(this.currSpeed > 0){
				this.currSpeed -= PlayerController.X_DECELERATION * dt;
			}
			else{
				this.currSpeed = Math.max(- PlayerController.MAX_X_SPEED, 
									 	this.currSpeed 
										- PlayerController.X_ACCELERATION * dt);
			}
		}
		/** If only right is pressed, go right. */
		else if(this.isRight()) {
			/** If moving left, decelerate first */
			if(this.currSpeed < 0){
				this.currSpeed += PlayerController.X_DECELERATION * dt;
			}
			else{
				this.currSpeed = Math.min(PlayerController.MAX_X_SPEED, 
										this.currSpeed 
										+ PlayerController.X_ACCELERATION * dt);
			}
		}
		/** Otherwise, decelerate. */
		else{
			this.currSpeed = Math.sign(this.currSpeed) 
							  * Math.max(0, Math.abs(this.currSpeed) 
							  - PlayerController.X_DECELERATION * dt);
		}

		this.model.getSprite().x(
			this.model.getSprite().x() + this.currSpeed * dt
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
