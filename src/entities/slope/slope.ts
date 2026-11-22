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

    public stabilized: boolean = false;

    x: number;
    y: number;
    width: number;
    height: number;

    public static readonly SLOPE_STROKE_WIDTH: number = 15;
    public static readonly ENDPOINT_RADIUS: number = 12.5;

    public static slopeStrokeColor = "#ff7575";

    /** BoundingBox for when the slope becomes stabilized (e.g. becomes a 
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

        if (width == 0 && height == 0){
            throw new Error("Width and height of a slope cannot both be 0.");
        }

        if(width == 0){
            this.stabilized = true;
            this.AABB = {
                x: x - Slope.SLOPE_STROKE_WIDTH / 2,
                y: y,
                width: Slope.SLOPE_STROKE_WIDTH,
                height: height
            }
            Slope.slopeStrokeColor = "#A0A0A0";
        }
        else if(height == 0){
            this.stabilized = true;
            this.AABB = {
                x: x,
                y: y - Slope.SLOPE_STROKE_WIDTH / 2,
                width: width,
                height: Slope.SLOPE_STROKE_WIDTH,
            }
            Slope.slopeStrokeColor = "#A0A0A0";
        }

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

        if(this.width == 0 || this.height == 0) this.stabilize();

        this.model.updateSprite(this.x, this.y, this.width, this.height);
        
    }

    /** Helper to determine how the slope should be stabilized. */
    private stabilize(){
        if (this.width == 0 && this.height == 0){
            throw new Error("Width and height of a slope cannot both be 0.");
        }

        if(this.width == 0){
            if(this.height < 0){
                this.AABB = {
                    x: this.x - Slope.SLOPE_STROKE_WIDTH / 2,
                    y: this.y + this.height,
                    width: Slope.SLOPE_STROKE_WIDTH,
                    height: -this.height
                }
            }
            else{
                this.AABB = {
                    x: this.x - Slope.SLOPE_STROKE_WIDTH / 2,
                    y: this.y,
                    width: Slope.SLOPE_STROKE_WIDTH,
                    height: this.height
                }
            }
            
        }
        else{
            if(this.width < 0){
                this.AABB = {
                    x: this.x + this.width,
                    y: this.y - Slope.SLOPE_STROKE_WIDTH / 2,
                    width: -this.width,
                    height: Slope.SLOPE_STROKE_WIDTH,
                }
            }
            else{
                this.AABB = {
                    x: this.x,
                    y: this.y - Slope.SLOPE_STROKE_WIDTH / 2,
                    width: this.width,
                    height: Slope.SLOPE_STROKE_WIDTH,
                }
            }   
        }
        this.stabilized = true;
        Slope.slopeStrokeColor = "#A0A0A0";
    }

    /** Getter for the endpoint specified during initialization.*/
    public getAnchorEndpoint(): number[]{
        return [this.x, this.y];
    }

    /** Getter for direction vector of slope. */
    public getDirection(): number[]{
        return [this.width, this.height];
    }

    public getLineBox(): BoundingBox{
        return this.AABB;
    }
}
