import Input from '../../systems/input.ts';
import ActionModel from './actionModel.ts';
import { ActionType } from './action.ts'

/**
 * Controls the action object in response to input.
 */
export default class SlopeController {
    private input: Input;
    private model: ActionModel;

    /**
     * @param input - Shared input tracker to poll each frame.
     * @param model - The action model tied to this controller.
     */
    constructor(input: Input, model: ActionModel) {
        this.input = input;
        this.model = model;
    }
}