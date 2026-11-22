import kv from 'konva';
import { loadCachedImage } from '../../systems/imageCache.ts';
import { createButton } from '../../UI/createButton.ts'
import { ActionType } from './action.ts'
import { Image } from 'konva/lib/shapes/Image';
import ActionManager from '../../systems/actionManager.ts';
import Konva from 'konva';

/**
 * Interface for options relating to instantiating an image. Must specify the 
 * image source. Can optionally specify the width, height, class name, or id
 * of the image.
 * Original from: https://stackoverflow.com/questions/34208398
 */
interface CreateImgOptions {
    src: string;
    width?: number,
    height?: number,
    className?: string;
    id?: string;
}

/**
 * Holds the action's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior; {@link ActionController} reads and updates its
 * sprite each frame.
 */
export default class ActionModel {
    /** Konva shape representing the sprite. */
    private sprite: kv.Group = new kv.Group();

    private image : HTMLImageElement;

    private static readonly BUTTON_WIDTH: number = 250;
    private static readonly BUTTON_HEIGHT: number = 75;

    /**
     * Creates a button that corresponds to the specified action type.
     * 
     * @param manager - Shared manager between all actions.
     * @param type - The type of the action (i.e. how it will modify a slope),
     * typed using the ActionType enum.
     * @param x - X position of the action button's upper left corner, 
     * in pixels.
     * @param y - Y position of the action button's upper left corner, 
     * in pixels.
     */
    constructor(manager: ActionManager, type: ActionType, x: number, y: number) {
        this.image = this.createImg({
            src: 'assets/button.png', 
            width: ActionModel.BUTTON_WIDTH, 
            height: ActionModel.BUTTON_HEIGHT
        });
        this.sprite = createButton({
            image: this.image,
            label: type,
            x: x - ActionModel.BUTTON_WIDTH / 2,
            y: y - ActionModel.BUTTON_HEIGHT / 2,
            width: ActionModel.BUTTON_WIDTH,
            height: ActionModel.BUTTON_HEIGHT,
            onClick: () => {manager.switchAction(type)}
        });
    }

    /**
     * Helper for creating an image using a CreateImgOptions interface.
     * Original from: https://stackoverflow.com/questions/34208398
     * 
     * @param options A CreateImgOptions that at the very least specifies the 
     * image source.
     * @returns An instantiated HTMLImageELement with the given source.
     */
    private createImg(options: CreateImgOptions): HTMLImageElement {
        let img = <HTMLImageElement> document.createElement("img");
        img.src = options.src;
        if (options.width) img.width = options.width;
        if (options.height) img.height = options.height;
        if (options.className) img.className = options.className;
        if (options.id) img.id = options.id;
        return img;
    }

    /** Returns the Konva group so it can be added to a layer or moved. */
    public getSprite(): kv.Group {
        return this.sprite;
    }
}
