import kv from 'konva';

/**
 * Holds the platform's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior.
 */
export default class PlatformModel {
    /** Konva shape representing the sprite. */
    private sprite: kv.Rect;

    private static readonly PLAT_STROKE_COLOR: string = "#3a271c";
    private static readonly PLAT_STROKE_WIDTH: number = 15;
    private static readonly PLAT_FILL: string = "#645c50";
    private static readonly PLAT_CORNER_RADIUS: number = 1;

    /**
     * @param x - X position of the platform's upper left corner, in pixels.
     * @param y - Y position of the platform's upper left corner, in pixels.
     * @param width - Width of the platform (i.e. x difference between two 
     * endpoints), in pixels.
     * @param height - Height of the platform (i.e. y difference between two 
     * endpoints), in pixels.
     */
    constructor(x: number, y: number, width: number, height: number) {
        this.sprite = new kv.Rect({
            x: x,
            y: y,
            width: width,
            height: height,
            fill: PlatformModel.PLAT_FILL,
            stroke: PlatformModel.PLAT_STROKE_COLOR,
            strokeWidth: PlatformModel.PLAT_STROKE_WIDTH,
            cornerRadius: PlatformModel.PLAT_CORNER_RADIUS
        });
    }

    /** Returns the Konva group so it can be added to a layer or moved. */
    public getSprite(): kv.Rect {
        return this.sprite;
    }
}
