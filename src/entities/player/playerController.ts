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
	private curr_speed: number;

	/**
	 * @param input - Shared input tracker to poll each frame.
	 * @param model - The player model whose sprite this controller moves.
	 */
	constructor(input: Input, model: PlayerModel) {
		this.input = input;
		this.model = model;
		this.curr_speed = 0;
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
