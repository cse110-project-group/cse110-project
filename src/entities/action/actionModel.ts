import kv from 'konva';
import { loadCachedImage } from '../../systems/imageCache.ts';
import { createButton } from '../../UI/createButton.ts'
import { ActionType } from './action.ts'
import { Image } from 'konva/lib/shapes/Image';
import ActionManager from '../../systems/actionManager.ts';
import Konva from 'konva';

/**
 * Holds the action's visual state: the Konva shape drawn on the game layer.
 *
 * The model owns no behavior; {@link ActionController} reads and updates its
 * sprite each frame.
 */
export default class ActionModel {
    /** Konva shape representing the sprite. */
    private sprite: kv.Group = new kv.Group();


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
        this.sprite = createButton({
            image: <HTMLImageElement> document.createElement("img"),
            label: type,
            x: x,
            y: y,
            width: ActionModel.BUTTON_WIDTH,
            height: ActionModel.BUTTON_HEIGHT,
            onClick: () => {manager.switchAction(type)}
        });

        loadCachedImage('/assets/button.png')
				.then((loadedImg) => {
                    let image = this.sprite.getChildren(function(node){
                        return node.getClassName() === 'Image';
                    })[0];
                    image.getAttrs()["image"] = loadedImg;
                })
				.catch((err) => {
					console.error('Failed to load button sprite:', err);
				});
        
    }

    /** Returns the Konva group so it can be added to a layer or moved. */
    public getSprite(): kv.Group {
        return this.sprite;
    }
}
