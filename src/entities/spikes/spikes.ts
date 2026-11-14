import SpikesModel from './spikesModel.ts';
import SpikesController from './spikesController.ts';
import Input from '../../systems/input.ts';
import { BoundingBox } from '../../systems/collision.ts';
import Game from '../../game.ts';

/**
 * The spikes entity. Wires a {@link SpikesModel} (what is drawn) to a
 * {@link SpikesController} (how it functions) so the game only has to 
 * deal with one object.
 *
 * @example
 * const spikes = new Spikes(720, 720, 180);
 * layer.add(spikes.getSprite());
 */
export default class Spikes {
    model: SpikesModel;
    //controller: SpikesController;
    AABB: BoundingBox;

    /**
     * @param x - X position of the spikes' upper left corner, in pixels.
     * @param y - Y position of the spikes' upper left corner, in pixels.
     * @param width - Width of the spikes, in pixels. Assumed to be an integer
     * multiple of grid unit length.
     */    
    constructor(x: number, y: number, width: number) {
        if(width <= 0) throw new Error("Invalid width, should be positive.");
        if(width % Game.GRID_UNIT != 0) throw new Error(
            "Invalid width, should be an integer multiple of grid unit length. (Maybe calculation error?)");

        if(x % Game.GRID_UNIT != 0) throw new Error(
            "Invalid x, should be an integer multiple of grid unit length. (Maybe calculation error?)");
        if(y % Game.GRID_UNIT != 0) throw new Error(
            "Invalid y, should be an integer multiple of grid unit length. (Maybe calculation error?)");

        this.model = new SpikesModel(x, y, width);
        //this.controller = new SpikesController(this.model);

        this.AABB = {
            x: x, 
            y: y, 
            width: width, 
            height: Game.GRID_UNIT
        };
    }

    /** Returns the spikes' Konva shape, ready to add to a layer. */
    public getSprite() {
        return this.model.getSprite();
    }
}
