import ActionModel from './actionModel.ts';
import ActionController from './actionController.ts';
import Input from '../../systems/input.ts';

/** Enum for designating action type, will expand later. */
export enum ActionType {
    COS = "COS",
    SIN = "SIN"
}

/**
 * The action entity. Wires a {@link ActionModel} (what is drawn) to a
 * {@link ActionController} (how it functions) so the game only has to 
 * deal with one object.
 *
 * @example
 * const action = new Action(input, ActionType.COS);
 */
export default class Action {
    model: ActionModel;
    controller: ActionController;

    type: ActionType;

    /**
     * Note: Idea for this is to read all actions available for the given level
     * in the parser and instantiate each by calculating the position using the 
     * amount of actions we have in this level so that they are centered.
     * 
     * @param input - Shared input tracker the controller polls.
     * @param type - The type of the action (i.e. how it will modify a slope),
     * typed using the ActionType enum.
     * @param x - X position of the action button's upper left corner, 
     * in pixels.
     * @param y - Y position of the action button's upper left corner, 
     * in pixels.
     */    
    constructor(input: Input, type: ActionType, x: number, y: number) {
        this.model = new ActionModel(type, x, y);
        this.controller = new ActionController(input, this.model);

        this.type = type;
    }

    /** Returns the platform's Konva shape, ready to add to a layer. */
    public getSprite() {
        return this.model.getSprite();
    }
}
