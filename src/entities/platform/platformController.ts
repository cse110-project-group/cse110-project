import Input from '../../systems/input.ts';
import PlatformModel from './platformModel.ts';

/**
 * Controls the platform object in response to input. 
 * No use for now as platforms are supposed to be stationary.
 */
export default class PlatformController {
    private input: Input;
    private model: PlatformModel;

    /**
     * @param input - Shared input tracker to poll each frame.
     * @param model - The platform model tied to this controller.
     */
    constructor(input: Input, model: PlatformModel) {
        this.input = input;
        this.model = model;
    }
}