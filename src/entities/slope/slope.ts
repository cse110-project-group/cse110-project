import SlopeModel from './slopeModel.ts';
import SlopeController from './slopeController.ts';
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

    /** BoundingBox for when the slope becomes stabilized (e.g. becomes a 
     * platform using COS). */
    AABB: BoundingBox = {x: -1, y: -1, width: -1, height: -1};

    /**
     * @param x - X position of one of the slope's endpoints, in pixels.
     * @param y - Y position of one of the slope's endpoints, in pixels.
     * @param width - Width of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     * @param height - Height of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     */ 
    constructor(x: number, y: number, 
                width: number, height: number) {

        if (width == 0 && height == 0){
            throw new Error("Width and height of a slope cannot both be 0.");
        }

        this.model = new SlopeModel(x, y, width, height);
        this.controller = new SlopeController(this.model);

        if(width == 0 || height == 0){
            this.stabilized = true;
            this.AABB = createAABB(x, y, width, height);
            this.model.slopeStrokeColor = "#A0A0A0";
            this.model.recolorLine();
        }

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
     * is being stabilized (i.e. modified by an action). Also takes a
     * BoundingBox as input, which will be considered before other parameters.
     * 
     * @param x -  X position of one of the slope's new endpoints, in pixels.
     * @param y - Y position of one of the slope's new endpoints, in pixels.
     * @param width - New width of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     * @param height - New height of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     * @param boundingBox - Optional input with the format of a BoundingBox.
     */
    public updateParams(x?: number, y?: number, width?: number, height?: number,
                        boundingBox?: BoundingBox){
        if(boundingBox !== undefined){
            this.x = boundingBox.x;
            this.y = boundingBox.y;
            this.width = boundingBox.width;
            this.height = boundingBox.height;
        }
        else{
            this.x = x === undefined ? this.x : x;
            this.y = y === undefined ? this.y : y;
            this.width = width === undefined ? this.width : width;
            this.height = height === undefined ? this.height : height;
        }

        if(this.width == 0 || this.height == 0) this.stabilize();

        this.model.updateSprite(this.x, this.y, this.width, this.height);
        
    }

    /** Helper to determine how the slope should be stabilized. */
    private stabilize(){
        if (this.width == 0 && this.height == 0){
            throw new Error("Width and height of a slope cannot both be 0.");
        }

        this.AABB = createAABB(this.x, this.y, this.width, this.height);

        this.stabilized = true;
        this.model.slopeStrokeColor = "#A0A0A0";
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
/** Helper to create a BoundingBox that corresponds to the slope line. */
export function createAABB(x: number, y: number, width: number, height: number): BoundingBox{
        if(width != 0 && height != 0) throw new Error("One of width or height must be 0.");
        if(width == 0 && height == 0) throw new Error("Only one of width or height can be 0.");
        
        let AABB;
        if(width == 0){
            if(height < 0){
                AABB = {
                    x: x - SlopeModel.SLOPE_STROKE_WIDTH / 2,
                    y: y + height,
                    width: SlopeModel.SLOPE_STROKE_WIDTH,
                    height: -height
                }
            }
            else{
                AABB = {
                    x: x - SlopeModel.SLOPE_STROKE_WIDTH / 2,
                    y: y,
                    width: SlopeModel.SLOPE_STROKE_WIDTH,
                    height: height
                }
            }
        }
        else{
            if(width < 0){
                AABB = {
                    x: x + width,
                    y: y - SlopeModel.SLOPE_STROKE_WIDTH / 2,
                    width: -width,
                    height: SlopeModel.SLOPE_STROKE_WIDTH,
                }
            }
            else{
                AABB = {
                    x: x,
                    y: y - SlopeModel.SLOPE_STROKE_WIDTH / 2,
                    width: width,
                    height: SlopeModel.SLOPE_STROKE_WIDTH,
                }
            }   
        }
        return AABB;
    }