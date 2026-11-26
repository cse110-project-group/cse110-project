import SlopeModel from './slopeModel.ts';

/**
 * Controls the slope object in response to input.
 */
export default class SlopeController {
    private model: SlopeModel;

    /**
     * @param model - The slope model tied to this controller.
     */
    constructor( model: SlopeModel) {
        this.model = model;
    }
}