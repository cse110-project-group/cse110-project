import kv from 'konva';
import Slope from './slope';

/**
 * Holds the slope's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior; {@link SlopeController} reads and updates its
 * sprite each frame.
 */
export default class SlopeModel {
    /** Konva shape representing the sprite. */
    private sprite: kv.Group;

    private static readonly SLOPE_STROKE_COLOR: string = "#A0A0A0";

    private static readonly ENDPOINT_FILL: string = "#FFFFFF";
    private static readonly ENDPOINT_STROKE_COLOR: string = "#000000";
    private static readonly ENDPOINT_STROKE_WIDTH: number = 5;
    private static readonly ENDPOINT_RADIUS: number = 12.5;

    /**
     * @param x - X position of one of the slope's endpoints, in pixels.
     * @param y - Y position of one of the slope's endpoints, in pixels.
     * @param width - Width of the slope (i.e. x difference between two 
     * endpoints), in pixels.
     * @param height - Height of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     */
    constructor(x: number, y: number, width: number, height: number) {
        this.sprite = new kv.Group({
            x: x,
            y: y
        })
        let line = new kv.Line({
            points: [0, 0, width, height],
            stroke: SlopeModel.SLOPE_STROKE_COLOR,
            strokeWidth: Slope.SLOPE_STROKE_WIDTH
        });
        let endpoint1 = new kv.Ellipse({
            x: 0,
            y: 0,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: SlopeModel.ENDPOINT_FILL,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH
        })
        let endpoint2 = new kv.Ellipse({
            x: width,
            y: height,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: SlopeModel.ENDPOINT_FILL,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH
        })
        this.sprite.add(line);
        this.sprite.add(endpoint1);
        this.sprite.add(endpoint2);
    }

    /** Returns the Konva group so it can be added to a layer or moved. */
    public getSprite(): kv.Group {
        return this.sprite;
    }

    /**
     * Updates sprite with new parameters.
     * 
     * @param x - X position of one of the slope's endpoints, in pixels.
     * @param y - Y position of one of the slope's endpoints, in pixels.
     * @param width - Width of the slope (i.e. x difference between two 
     * endpoints), in pixels.
     * @param height - Height of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     */
    public updateSprite(x: number, y: number, width: number, height: number) {
        this.sprite = new kv.Group({
            x: x,
            y: y
        })
        let line = new kv.Line({
            points: [x, y, x + width, y + height],
            stroke: SlopeModel.SLOPE_STROKE_COLOR,
            strokeWidth: Slope.SLOPE_STROKE_WIDTH
        });
        let endpoint1 = new kv.Ellipse({
            x: x,
            y: y,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: SlopeModel.ENDPOINT_FILL,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH
        })
        let endpoint2 = new kv.Ellipse({
            x: x + width,
            y: y + height,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: SlopeModel.ENDPOINT_FILL,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH
        })
        this.sprite.add(line);
        this.sprite.add(endpoint1);
        this.sprite.add(endpoint2);
    }
}
