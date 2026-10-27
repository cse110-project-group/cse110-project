import Input from '../../systems/input.ts';
import PlayerModel from './playerModel.ts';
import kv from 'konva';
import { BoundingBox, resolveHorizontalMovement } from '../../systems/collision.ts';

export default class PlayerController {
	private input: Input;
	private model: PlayerModel;
	private speed: number;

	/**
	 * @param input - Shared input manager to poll key states.
	 * @param model - The player model instance containing the sprite.
	 */
	constructor(input: Input, model: PlayerModel) {
		this.input = input;
		this.model = model;
		this.speed = 200;
	}

	/**
	 * Applies horizontal displacement resolved against active room obstacles.
	 *
	 * @param dt - Elapsed frame delta time in seconds.
	 * @param obstacles - Canvas nodes present on the layer.
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
			// If obstacles are tagged with 'solid' or name === 'obstacle', check here:
			if (node.name() === 'solid' || !node.name()) {
			obstacleBoxes.push(node.getClientRect({ relativeTo: parent }));
			}
		}

		const safeTopLeftX = resolveHorizontalMovement(playerBox, dx, obstacleBoxes);

		const deltaApplied = safeTopLeftX - playerBox.x;
		sprite.x(sprite.x() + deltaApplied);
	}
}