import Input from '../../systems/input.ts';
import SlopeModel from './slopeModel.ts';

/**
 * Controls the slope object in response to input.
 */
export default class SlopeController {
    private input: Input;
    private model: SlopeModel;

    /**
     * @param input - Shared input tracker to poll each frame.
     * @param model - The slope model tied to this controller.
     */
    constructor(input: Input, model: SlopeModel) {
        this.input = input;
        this.model = model;
    }
}