import Input from '../../systems/input.ts';
import PlayerModel from './playerModel.ts';
import kv from 'konva';
import { resolveHorizontalMovement } from '../../systems/collision.ts';

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
    private speed: number;

    /**
     * @param input Shared input tracker to poll each frame.
     * @param model The player model whose sprite this controller moves.
     */
    constructor(input: Input, model: PlayerModel) {
        this.input = input;
        this.model = model;
        this.speed = 200;
    }

    /**
     * Applies one frame of movement.
     *
     * @param dt Seconds elapsed since the last frame. Movement is scaled by
     *   this so speed stays the same regardless of frame rate.
     * @param obstacles Collection of Konva nodes on the stage.
     */
    public update(dt: number, obstacles: kv.Node[] = []) {
        let dx = 0;

        if (this.input.isKeyDown('KeyA')
            || this.input.isKeyDown('ArrowLeft')) {
            dx -= this.speed * dt;
        }

        if (this.input.isKeyDown('KeyD')
            || this.input.isKeyDown('ArrowRight')) {
            dx += this.speed * dt;
        }

        if (dx !== 0) {
            const sprite = this.model.getSprite();
            const safeX = resolveHorizontalMovement(sprite, dx, obstacles);
            sprite.x(safeX);
        }
    }
}