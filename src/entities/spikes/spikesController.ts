import Input from '../../systems/input.ts';
import SpikesModel from './spikesModel.ts';

/**
 * Controls the spikes object in response to input. 
 * No use for now as spikes are supposed to be stationary.
 */
export default class SpikesController {
    private input: Input;
    private model: SpikesModel;

    /**
     * @param input - Shared input tracker to poll each frame.
     * @param model - The spikes model tied to this controller.
     */
    constructor(input: Input, model: SpikesModel) {
        this.input = input;
        this.model = model;
    }
}