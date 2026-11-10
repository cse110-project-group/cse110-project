import kv from 'konva';

/**
 * Holds the spikes' visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior.
 */
export default class SpikesModel {
    /** Konva shape representing the sprite. */
    private sprite: kv.Group;

    private static readonly SPIKE_STROKE_COLOR: string = "#6b0000";
    private static readonly SPIKE_STROKE_WIDTH: number = 5;
    private static readonly SPIKE_FILL: string = "#c02c2c";
    
    unit: number = 30 //placeholder, should be side length of a grid unit based on level format

    /**
     * Draws spikes from x to width in intervals of grid unit length. If width
     * is not a multiple of unit, then draws until next multiple of unit.
     * 
     * @param x - X position of the spikes' upper left corner, in pixels.
     * @param y - Y position of the spikes' upper left corner, in pixels.
     * @param width - Width of the spikes (i.e. x difference between two 
     * endpoints), in pixels.
     */
    constructor(x: number, y: number, width: number) {
        this.sprite = new kv.Group({
            x: x,
            y: y
        });
        for(let i = 0; i < Math.ceil(width / this.unit); ++i){
            let tri = new kv.Line({
                points: [
                    i * this.unit, this.unit,
                    (i + 1) * this.unit, this.unit,
                    (i + 0.5) * this.unit, 0
                ], 
                fill: SpikesModel.SPIKE_FILL,
                stroke: SpikesModel.SPIKE_STROKE_COLOR,
                strokeWidth: SpikesModel.SPIKE_STROKE_WIDTH,
                closed: true
            });
            this.sprite.add(tri);
        }
    }

    /** Returns the Konva group so it can be added to a layer or moved. */
    public getSprite(): kv.Group {
        return this.sprite;
    }
}
