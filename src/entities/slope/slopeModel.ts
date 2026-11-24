import kv from 'konva';
import Slope from './slope';
import { BoundingBox } from '../../systems/collision';
import { vecNorm } from '../../systems/linearAlgebra';

/**
 * Holds the slope's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior; {@link SlopeController} reads and updates its
 * sprite each frame.
 */
export default class SlopeModel {
    /** Konva shape representing the sprite. */
    private sprite: kv.Group;

    public static readonly SLOPE_STROKE_WIDTH: number = 15;
    public static readonly ENDPOINT_RADIUS: number = 12.5;

    private static readonly ENDPOINT_FILL: string = "#FFFFFF";
    private static readonly ENDPOINT_STROKE_COLOR: string = "#000000";
    private static readonly ENDPOINT_STROKE_WIDTH: number = 5;
    private static readonly ENDPOINT_INDICATOR_RADIUS: number = 25;

    private static readonly HINT_STROKE_WIDTH: number = 10;
    private static readonly HINT_OPACITY: number = 0.1;
    private static readonly HINT_OPACITY_STRONG: number = 0.6;

    public slopeStrokeColor = "#ff7575";

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
            stroke: this.slopeStrokeColor,
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

        let indicators = this.sprite.getChildren(function(node){
            return node.getClassName() === 'Group';
        });
        indicators[0].setAttrs({x: x, y: y});
        indicators[1].setAttrs({x: x + width, y: y + height});
    }

    private constructSprite(x: number, y: number, 
                            width: number, height: number): kv.Group{
        let radius = vecNorm([width, height]);

        let sprite = new kv.Group({
            x: 0,
            y: 0,
            name: 'slope'
        })
        let line = new kv.Line({
            points: [x, y, x + width, y + height],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.SLOPE_STROKE_WIDTH,
            shadowColor: "#EEEE00",
            shadowBlur: 20,
            shadowOpacity: 0.0
        });
        let endpoint1 = new kv.Ellipse({
            x: x,
            y: y,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: SlopeModel.ENDPOINT_FILL,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH
        });
        let endpoint2 = new kv.Ellipse({
            x: x + width,
            y: y + height,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: SlopeModel.ENDPOINT_FILL,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH
        });

        let indicator1 = new kv.Group({
            x: x,
            y: y,
            opacity: 0.0
        });
        let endpoint1Indicator = new kv.Ellipse({
            x: 0,
            y: 0,
            radiusX: SlopeModel.ENDPOINT_INDICATOR_RADIUS,
            radiusY: SlopeModel.ENDPOINT_INDICATOR_RADIUS,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH,
            dash: [8, 8]
        });
        let circleOutline1 = new kv.Ellipse({
            x: 0,
            y: 0,
            radiusX: radius,
            radiusY: radius,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH * 2,
            opacity: 0.05
        });

        let cosGroup1 = new kv.Group({
            x: 0,
            y: 0,
            opacity: 0
        });
        let cosAxis1 = new kv.Line({
            points: [0, 0, Math.sign(width) * radius, 0],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            opacity: SlopeModel.HINT_OPACITY
        });
        let cosProjection1 = new kv.Line({
            points: [width, 0, width, height],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            dash: [16, 16],
            opacity: SlopeModel.HINT_OPACITY
        });
        let cosNewPlat1 = new kv.Line({
            points: [0, 0, width, 0],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            opacity: SlopeModel.HINT_OPACITY_STRONG
        });
        let cosEndpoint1 = new kv.Ellipse({
            x: width,
            y: 0,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: this.slopeStrokeColor,
            opacity: SlopeModel.HINT_OPACITY_STRONG
        });
        cosGroup1.add(cosAxis1);
        cosGroup1.add(cosProjection1);
        cosGroup1.add(cosNewPlat1);
        cosGroup1.add(cosEndpoint1);

        let sinGroup1 = new kv.Group({
            x: 0,
            y: 0,
            opacity: 0
        });
        let sinAxis1 = new kv.Line({
            points: [0, 0, 0, Math.sign(height) * radius],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            opacity: SlopeModel.HINT_OPACITY
        });
        let sinProjection1 = new kv.Line({
            points: [0, height, width, height],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            dash: [16, 16],
            opacity: SlopeModel.HINT_OPACITY
        });
        let sinNewPlat1 = new kv.Line({
            points: [0, 0, 0, height],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            opacity: SlopeModel.HINT_OPACITY_STRONG
        });
        let sinEndpoint1 = new kv.Ellipse({
            x: 0,
            y: height,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: this.slopeStrokeColor,
            opacity: SlopeModel.HINT_OPACITY_STRONG
        });
        sinGroup1.add(sinAxis1);
        sinGroup1.add(sinProjection1);
        sinGroup1.add(sinNewPlat1);
        sinGroup1.add(sinEndpoint1);

        let indicator2 = new kv.Group({
            x: x + width,
            y: y + height,
            opacity: 0.0
        });
        let endpoint2Indicator = new kv.Ellipse({
            x: 0,
            y: 0,
            radiusX: SlopeModel.ENDPOINT_INDICATOR_RADIUS,
            radiusY: SlopeModel.ENDPOINT_INDICATOR_RADIUS,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH,
            dash: [8, 8]
        });
        let circleOutline2 = new kv.Ellipse({
            x: 0,
            y: 0,
            radiusX: radius,
            radiusY: radius,
            stroke: SlopeModel.ENDPOINT_STROKE_COLOR,
            strokeWidth: SlopeModel.ENDPOINT_STROKE_WIDTH * 2,
            opacity: 0.05
        });

        let cosGroup2 = new kv.Group({
            x: 0,
            y: 0,
            opacity: 0
        });
        let cosAxis2 = new kv.Line({
            points: [0, 0, -Math.sign(width) * radius, 0],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            opacity: SlopeModel.HINT_OPACITY
        });
        let cosProjection2 = new kv.Line({
            points: [-width, -height, -width, 0],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            dash: [16, 16],
            opacity: SlopeModel.HINT_OPACITY
        });
        let cosNewPlat2 = new kv.Line({
            points: [0, 0, -width, 0],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            opacity: SlopeModel.HINT_OPACITY_STRONG
        });
        let cosEndpoint2 = new kv.Ellipse({
            x: -width,
            y: 0,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: this.slopeStrokeColor,
            opacity: SlopeModel.HINT_OPACITY_STRONG
        });
        cosGroup2.add(cosAxis2);
        cosGroup2.add(cosProjection2);
        cosGroup2.add(cosNewPlat2);
        cosGroup2.add(cosEndpoint2);

        let sinGroup2 = new kv.Group({
            x: 0,
            y: 0,
            opacity: 0
        });
        let sinAxis2 = new kv.Line({
            points: [0, 0, 0, -Math.sign(height) * radius],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            opacity: SlopeModel.HINT_OPACITY
        });
        let sinProjection2 = new kv.Line({
            points: [-width, -height, 0, -height],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            dash: [16, 16],
            opacity: SlopeModel.HINT_OPACITY
        });
        let sinNewPlat2 = new kv.Line({
            points: [0, 0, 0, -height],
            stroke: this.slopeStrokeColor,
            strokeWidth: SlopeModel.HINT_STROKE_WIDTH,
            lineCap: "round",
            opacity: SlopeModel.HINT_OPACITY_STRONG
        });
        let sinEndpoint2 = new kv.Ellipse({
            x: 0,
            y: -height,
            radiusX: SlopeModel.ENDPOINT_RADIUS,
            radiusY: SlopeModel.ENDPOINT_RADIUS,
            fill: this.slopeStrokeColor,
            opacity: SlopeModel.HINT_OPACITY_STRONG
        });
        sinGroup2.add(sinAxis2);
        sinGroup2.add(sinProjection2);
        sinGroup2.add(sinNewPlat2);
        sinGroup2.add(sinEndpoint2);

        indicator1.add(endpoint1Indicator);
        indicator1.add(circleOutline1);
        indicator1.add(cosGroup1);
        indicator1.add(sinGroup1);

        indicator2.add(endpoint2Indicator);
        indicator2.add(circleOutline2);
        indicator2.add(cosGroup2);
        indicator2.add(sinGroup2);

        sprite.add(line);
        sprite.add(endpoint1);
        sprite.add(endpoint2);
        sprite.add(indicator1);
        sprite.add(indicator2);

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

    /** Recolors line to current stroke color */
    public recolorLine(){
        let line = this.sprite.getChildren(function(node){
            return node.getClassName() === 'Line';
        });
        line[0].setAttrs({"stroke": this.slopeStrokeColor});
    }
}
