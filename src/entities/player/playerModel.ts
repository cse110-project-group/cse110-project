import kv from 'konva';

/**
 * Holds the player's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior; {@link PlayerController} reads and updates its
 * sprite each frame.
 */
export default class PlayerModel {
	/** Konva shape representing the player. Its position is the player's position. */
	private sprite: kv.Ellipse;
	private static max_x_speed: number = 200; 
	/** Acceleration / deceleration for horizontal movement. 
	 * (Note: Should be relatively large to ensure snappy movement.)
	*/
	private static x_acceleration: number = 800;
	private static x_deceleration: number = 1600;

	/**
	 * @param x - Initial x position of the sprite's center, in pixels.
	 * @param y - Initial y position of the sprite's center, in pixels.
	 */
	constructor(x: number, y: number) {
		this.sprite = new kv.Ellipse({
			x: x,
			y: y,
			radiusX: 25,
			radiusY: 50,
			fill: 'gray',
		});

	}

	/** Returns the Konva shape so it can be added to a layer or moved. */
	public getSprite(): kv.Ellipse {
		return this.sprite;
	}

	/**
	 * Getter for max X speed.
	 * @returns max X speed
	 */
	public static getMaxXSpeed(){
		return this.max_x_speed;
	}

	/**
	 * Getter for X acceleration.
	 * @returns X acceleration
	 */
	public static getXAcceleration(){
		return this.x_acceleration;
	}

	/**
	 * Getter for X deceleration.
	 * @returns X deceleration
	 */
	public static getXDeceleration(){
		return this.x_deceleration;
	}
}
