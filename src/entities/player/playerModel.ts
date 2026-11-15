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

	public static readonly SPRITE_RADIUS_X = 25;
	public static readonly SPRITE_RADIUS_Y = 50;


	/**
	 * @param x - Initial x position of the sprite's center, in pixels.
	 * @param y - Initial y position of the sprite's center, in pixels.
	 */
	constructor(x: number, y: number) {
		this.sprite = new kv.Ellipse({
			x: x,
			y: y,
			radiusX: PlayerModel.SPRITE_RADIUS_X,
			radiusY: PlayerModel.SPRITE_RADIUS_Y,
			fill: 'gray',
		});

	}

	/** Returns the Konva shape so it can be added to a layer or moved. */
	public getSprite(): kv.Ellipse {
		return this.sprite;
	}
}
