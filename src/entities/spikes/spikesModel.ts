import kv from 'konva';
import Game from '../../game';

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
        for(let i = 0; i < Math.ceil(width / Game.GRID_UNIT); ++i){
            let tri = new kv.Line({
                points: [
                    i * Game.GRID_UNIT, Game.GRID_UNIT,
                    (i + 1) * Game.GRID_UNIT, Game.GRID_UNIT,
                    (i + 0.5) * Game.GRID_UNIT, 0
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
