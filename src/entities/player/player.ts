import PlayerModel from './playerModel.ts';
import PlayerController from './playerController.ts';
import Input from '../../systems/input.ts';
import kv from 'konva';

/**
 * The player entity. Wires a {@link PlayerModel} (what is drawn) to a
 * {@link PlayerController} (how it moves) so the game only has to deal with
 * one object.
 *
 * @example
 * const player = new Player(input, 100, 200);
 * layer.add(player.getSprite());
 * // each frame:
 * player.update(deltaTime);
 */
export default class Player {
    model: PlayerModel;
    controller: PlayerController;

    /**
     * @param input Shared input tracker the controller polls.
     * @param x Starting x position, in pixels.
     * @param y Starting y position, in pixels.
     */
    constructor(input: Input, x: number, y: number) {
        this.model = new PlayerModel(x, y);
        this.controller = new PlayerController(input, this.model);
    }

    /** Returns the player's Konva shape, ready to add to a layer. */
    public getSprite() {
        return this.model.getSprite();
    }

    /**
     * Advances the player by one frame.
     *
     * @param deltaTime Seconds elapsed since the last frame.
     * @param obstacles Collection of Konva nodes on the stage.
     */
    public update(deltaTime: number, obstacles: kv.Node[] = []) {
        this.controller.update(deltaTime, obstacles);
    }
}