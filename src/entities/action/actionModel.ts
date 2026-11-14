import kv from 'konva';
import { createButton } from '../../UI/createButton.ts'
import { ActionType } from './action.ts'

/**
 * Holds the action's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior; {@link ActionController} reads and updates its
 * sprite each frame.
 */
export default class ActionModel {
    /** Konva shape representing the sprite. */
    private sprite: kv.Group;

    private buttonImage = new Image();

    private static readonly PLAT_STROKE_COLOR: string = "#3a271c";
    private static readonly PLAT_STROKE_WIDTH: number = 15;
    private static readonly PLAT_FILL: string = "#645c50";
    private static readonly PLAT_CORNER_RADIUS: number = 1;

    /**
     * Note: Should be a button (hence the createButton() import), haven't 
     * written yet.
     * 
     * @param type - The type of the action (i.e. how it will modify a slope),
     * typed using the ActionType enum.
     * @param x - X position of the action button's upper left corner, 
     * in pixels.
     * @param y - Y position of the action button's upper left corner, 
     * in pixels.
     */
    constructor(type: ActionType, x: number, y: number) {
        this.sprite = new kv.Group();
    }

    /** Returns the Konva group so it can be added to a layer or moved. */
    public getSprite(): kv.Group {
        return this.sprite;
    }
}
