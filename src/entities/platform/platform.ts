import PlatformModel from './platformModel.ts';
import PlatformController from './platformController.ts';
import Input from '../../systems/input.ts';
import { BoundingBox } from '../../systems/collision.ts';

/**
 * The platform entity. Wires a {@link PlatformModel} (what is drawn) to a
 * {@link PlatformController} (how it functions) so the game only has to 
 * deal with one object.
 *
 * @example
 * const platform = new Platform(input, 640, 720, 320, 180);
 * layer.add(platform.getSprite());
 */
export default class Platform {
    model: PlatformModel;
    //controller: PlatformController;
    AABB: BoundingBox;

    /**
     * @param x - X position of the platform's upper left corner, in pixels.
     * @param y - Y position of the platform's upper left corner, in pixels.
     * @param width - Width of the platform, in pixels.
     * @param height - Height of the platform, in pixels.
     */    
    constructor(x: number, y: number, width: number, height: number) {
        if(width <= 0) throw new Error("Invalid width, should be positive.");
        if(height <= 0) throw new Error("Invalid height, should be positive.");

        this.model = new PlatformModel(x, y, width, height);
        //this.controller = new PlatformController(input, this.model);

        this.AABB = {x: x, y: y, width: width, height: height};
    }

    /** Returns the platform's Konva shape, ready to add to a layer. */
    public getSprite() {
        return this.model.getSprite();
    }
}
