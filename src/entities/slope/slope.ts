import SlopeModel from './slopeModel.ts';
import SlopeController from './slopeController.ts';
import Input from '../../systems/input.ts';
import { BoundingBox } from '../../systems/collision.ts';

/**
 * The slope entity. Wires a {@link SlopeModel} (what is drawn) to a
 * {@link SlopeController} (how it functions) so the game only has to deal with
 * one object.
 *
 * @example
 * const slope = new Slope(input, 640, 720, 320, 180);
 * layer.add(slope.getSprite());
 */
export default class Slope {
    model: SlopeModel;
    controller: SlopeController;

    x: number;
    y: number;
    width: number;
    height: number;

    /** This is here because this will also be used for the bounding box. */
    public static readonly SLOPE_STROKE_WIDTH: number = 15;

    /** BoundingBox for when the slope becomes interactable (e.g. becomes a 
     * platform using COS). */
    AABB: BoundingBox = {x: -1, y: -1, width: -1, height: -1};

    /**
     * @param input - Shared input tracker the controller polls.
     * @param x - X position of one of the slope's endpoints, in pixels.
     * @param y - Y position of one of the slope's endpoints, in pixels.
     * @param width - Width of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     * @param height - Height of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     */ 
    constructor(input: Input, x: number, y: number, 
                width: number, height: number) {
        this.model = new SlopeModel(x, y, width, height);
        this.controller = new SlopeController(input, this.model);

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /** Returns the slope's Konva shape, ready to add to a layer. */
    public getSprite() {
        return this.model.getSprite();
    }

    /**
     * Update parameters of this slope object, intended to be used when slope
     * is being stabilized (i.e. modified by an action).
     * 
     * @param x -  X position of one of the slope's new endpoints, in pixels.
     * @param y - Y position of one of the slope's new endpoints, in pixels.
     * @param width - New width of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     * @param height - New height of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     */
    public updateParams(x?: number, y?: number, 
                        width?: number, height?: number){
        this.x = x === undefined ? this.x : x;
        this.y = y === undefined ? this.y : y;
        this.width = width === undefined ? this.width : width;
        this.height = height === undefined ? this.height : height;

        this.model.updateSprite(this.x, this.y, this.width, this.height);
    }
}
