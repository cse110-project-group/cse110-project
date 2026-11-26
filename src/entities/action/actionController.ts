import Input from '../../systems/input.ts';
import ActionModel from './actionModel.ts';
import { ActionType } from './action.ts'
import ActionManager from '../../systems/actionManager.ts';

/**
 * Controls the action object in response to input.
 */
export default class ActionController {
    private input: Input;
    private model: ActionModel;
    
    private manager: ActionManager;

    /**
     * @param input - Shared input tracker to poll each frame.
     * @param manager - Shared manager between all actions.
     * @param model - The action model tied to this controller.
     */
    constructor(input: Input, manager: ActionManager, model: ActionModel) {
        this.input = input;
        this.model = model;

        this.manager = manager;
    }
}