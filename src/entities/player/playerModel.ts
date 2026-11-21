import kv from 'konva';
import { loadImage } from '../../systems/loadImage.ts';

/**
 * Holds the player's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior; {@link PlayerController} reads and updates its
 * sprite each frame.
 */
export default class PlayerModel {
	/** Konva shape representing the player. Its position is the player's position. */
	private sprite: kv.Image;

	public static readonly SPRITE_RADIUS_X = 25;
	public static readonly SPRITE_RADIUS_Y = 50;

	/**
	 * @param x - Initial x position of the sprite's center, in pixels.
	 * @param y - Initial y position of the sprite's center, in pixels.
	 * @param image - Image for the sprite.
	 */
	constructor(x: number, y: number, image?: HTMLImageElement) {
		const width = PlayerModel.SPRITE_RADIUS_X * 2;
		const height = PlayerModel.SPRITE_RADIUS_Y * 2;

		this.sprite = new kv.Image({
			x: x,
			y: y,
			width: width,
			height: height,
			offsetX: width / 2,
			offsetY: height / 2,
			fill: image ? undefined : 'gray',
			image: image,
		});

		if (!image) {
			loadImage('/assets/player-sprite.png')
				.then((loadedImg) => {
					if (!loadedImg) {
						console.error('Failed to load player sprite.');
						return;
					}
					this.sprite.fill(undefined);
					this.sprite.image(loadedImg);
					this.sprite.getLayer()?.batchDraw();
				})
				.catch((err) => {
					console.error('Failed to load player sprite:', err);
				});
		}
	}

	/** Returns the Konva shape so it can be added to a layer or moved. */
	public getSprite(): kv.Image {
		return this.sprite;
	}

	/** Returns the sprite's bounding box to be used for collision detection. */
	public getBoundingBox(): kv.IRect {
		return this.sprite.getClientRect();
	}
}
