import kv from 'konva';
import Slope from './slope';
import { BoundingBox } from '../../systems/collision';

/**
 * Holds the slope's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior; {@link SlopeController} reads and updates its
 * sprite each frame.
 */
export default class SlopeModel {
    /** Konva shape representing the sprite. */
    private sprite: kv.Group;

    private static readonly ENDPOINT_FILL: string = "#FFFFFF";
    private static readonly ENDPOINT_STROKE_COLOR: string = "#000000";
    private static readonly ENDPOINT_STROKE_WIDTH: number = 5;
    private static readonly ENDPOINT_INDICATOR_RADIUS: number = 25;

    /**
     * @param x - X position of one of the slope's endpoints, in pixels.
     * @param y - Y position of one of the slope's endpoints, in pixels.
     * @param width - Width of the slope (i.e. x difference between two 
     * endpoints), in pixels.
     * @param height - Height of the slope (i.e. y difference between two 
     * endpoints), in pixels.
     */
    constructor(x: number, y: number, width: number, height: number) {
        this.sprite = this.constructSprite(x, y, width, height);
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
        let lineList = this.sprite.getChildren(function(node){
            return node.getClassName() === 'Line';
        });
        let line = lineList[0];
        let lineTween = new kv.Tween({
            node: line,
            duration: 0.5,
            points: [x, y, x + width, y + height],
            stroke: Slope.slopeStrokeColor,
            easing: kv.Easings.BounceEaseOut,
            onFinish: () => {lineTween.destroy()}
        });

        let endpoints = this.sprite.getChildren(function(node){
            return node.getClassName() === 'Ellipse';
        });
        let endpoint0 = endpoints[0];
        let endpoint1 = endpoints[1];
        let endpoint0Tween = new kv.Tween({
            node: endpoint0,
            duration: 0.5,
            x: x,
            y: y,
            easing: kv.Easings.BounceEaseOut,
            onFinish: () => {endpoint0Tween.destroy()}
        });
        let endpoint1Tween = new kv.Tween({
            node: endpoint1,
            duration: 0.5,
            x: x + width,
            y: y + height,
            easing: kv.Easings.BounceEaseOut,
            onFinish: () => {endpoint1Tween.destroy()}
        });
        lineTween.play();
        endpoint0Tween.play();
        endpoint1Tween.play();
    }

    private constructSprite(x: number, y: number, 
                            width: number, height: number): kv.Group{
        let sprite = new kv.Group({
            x: 0,
            y: 0,
            name: 'slope'
        })
        let line = new kv.Line({
            points: [x, y, x + width, y + height],
            stroke: Slope.slopeStrokeColor,
            strokeWidth: Slope.SLOPE_STROKE_WIDTH,
            shadowColor: "#EEEE00",
            shadowBlur: 20,
            shadowOpacity: 0.0
        });
        let endpoint1 = new kv.Ellipse({
            x: x,
            y: y,
            radiusX: Slope.ENDPOINT_RADIUS,
            radiusY: Slope.ENDPOINT_RADIUS,
            fill: SlopeModel.ENDPOINT_FILL,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH
        });
        let endpoint2 = new kv.Ellipse({
            x: x + width,
            y: y + height,
            radiusX: Slope.ENDPOINT_RADIUS,
            radiusY: Slope.ENDPOINT_RADIUS,
            fill: SlopeModel.ENDPOINT_FILL,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH
        });
        let endpoint1Indicator = new kv.Ellipse({
            x: x,
            y: y,
            radiusX: SlopeModel.ENDPOINT_INDICATOR_RADIUS,
            radiusY: SlopeModel.ENDPOINT_INDICATOR_RADIUS,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH,
            dash: [8, 8],
            opacity: 0.0
        });
        let endpoint2Indicator = new kv.Ellipse({
            x: x + width,
            y: y + height,
            radiusX: SlopeModel.ENDPOINT_INDICATOR_RADIUS,
            radiusY: SlopeModel.ENDPOINT_INDICATOR_RADIUS,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH,
            dash: [8, 8],
            opacity: 0.0
        });
        sprite.add(line);
        sprite.add(endpoint1);
        sprite.add(endpoint2);
        sprite.add(endpoint1Indicator);
        sprite.add(endpoint2Indicator);

        return sprite;
    }

    /** Makes the connecting line glow faintly */
    public glow(){
        let line = this.sprite.getChildren(function(node){
            return node.getClassName() === 'Line';
        });
        line[0].setAttrs({"shadowBlur": 20});
        line[0].setAttrs({"shadowOpacity": 0.6});
    }

    /** Makes the connecting line glow strongly */
    public strongGlow(){
        let line = this.sprite.getChildren(function(node){
            return node.getClassName() === 'Line';
        });
        line[0].setAttrs({"shadowBlur": 30});
        line[0].setAttrs({"shadowOpacity": 1.0});
    }

    /** Stops the connecting line from glowing */
    public unglow(){
        let line = this.sprite.getChildren(function(node){
            return node.getClassName() === 'Line';
        });
        line[0].setAttrs({"shadowOpacity": 0.0});
    }
}
