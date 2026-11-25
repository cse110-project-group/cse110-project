import { ActionType } from "../entities/action/action";
import Input from "./input";
import Slope from "../entities/slope/slope";
import { createAABB } from "../entities/slope/slope";
import Player from "../entities/player/player";
import { dot, normalize, vecNorm, vecDiff, vecSum, vecScale } from "./linearAlgebra";
import { BoundingBox, checkAABBCollision } from "./collision";
import kv from "konva";
import SlopeModel from "../entities/slope/slopeModel";

// Mode of the current selection. Can be thought of as states.
enum SelectionMode{
    SLOPES,
    ENDPOINTS,
    OPERATE
}

// Pair interface to simplify storing.
interface Pair<T, U> {
    first: T,
    second: U
};

/** Class that manages actions on slopes. */
export default class ActionManager {
    private currentAction: ActionType | undefined = undefined;
    private currParams: number[] | undefined = undefined;
    
    private input: Input;
    private player: Player;

    private selectedSlopes: Slope[] = [];
    private selectedEndpoints: number[] = [];
    private prevSlope: Slope | undefined = undefined;
    private prevEndpoint: number | undefined = undefined;

    private stabilizeList: Pair<Slope, BoundingBox>[] = [];

    private currSelection: SelectionMode = SelectionMode.SLOPES;

    private prevPointer: boolean = false;

    public static readonly SLOPE_DETECTION_THRESHOLD = 15;
    public static readonly ENDPOINT_DETECTION_THRESHOLD = 20;

    constructor(input: Input, player: Player){
        this.input = input;
        this.player = player;
    }

    /**
     * Switches currentAction to a new action. Also resets all variables that
     * contain the current selection.
     * @param action - The incoming action.
     */
    public switchAction(action: ActionType){
        if(this.currentAction == action) this.currentAction = undefined;
        else{
            this.clearCurrentSelections();
            this.currentAction = action;
        }
        console.log(action);
    }

    /**
     * Updates the actionManager based on the current action. Should be called
     * per frame.
     * @param slopes - An array that contains all slopes in the game.
     */
    public update(slopes: Slope[]){
        // Check if each slope in list can stabilize.
        for(let i = this.stabilizeList.length - 1; i >= 0; --i){
            let stabilize = this.stabilizeList[i]
            if(checkAABBCollision(this.player.model.getBoundingBox(), 
                createAABB(stabilize.second.x, stabilize.second.y,
                    stabilize.second.width, stabilize.second.height))) continue;
            stabilize.first.updateParams(undefined, undefined, 
                                        undefined, undefined, stabilize.second);
            this.stabilizeList.splice(i, 1);
        }

        // If not in action, return.
        if(this.currentAction == undefined){
            this.clearCurrentSelections();
            return;
        }

        if(slopes === undefined || slopes.length === 0) return;

        let position = this.input.getMouseLocation();
        if(position === undefined) return;

        if(this.currParams === undefined)
            this.currParams = this.getRequiredParams(this.currentAction);

        switch(this.currSelection){
            case SelectionMode.SLOPES:
                // Get minimum distance and corresponding index.
                let minSlopeDist, minSlopeIndex;
                [minSlopeDist, minSlopeIndex] = this.getMinDist(position, slopes);
                if(minSlopeDist == Number.MAX_VALUE && minSlopeIndex == -1){
                    this.currentAction = undefined;
                    return;
                }

                // Check if closest slope is within detection threshold
                if(minSlopeDist < SlopeModel.SLOPE_STROKE_WIDTH / 2
                                + ActionManager.SLOPE_DETECTION_THRESHOLD
                    && this.inRange(position[0] - slopes[minSlopeIndex].x, 
                                    Math.min(0, slopes[minSlopeIndex].width), 
                                    Math.max(0, slopes[minSlopeIndex].width))
                    && this.inRange(position[1] - slopes[minSlopeIndex].y, 
                                    Math.min(0, slopes[minSlopeIndex].height), 
                                    Math.max(0, slopes[minSlopeIndex].height))){
                    // Make closest slope glow and previous slope unglow
                    let minSlope = slopes[minSlopeIndex];
                    if(!this.selectedSlopes.includes(minSlope)) minSlope.model.glow();
                    if(this.prevSlope != undefined && this.prevSlope != minSlope
                        && !this.selectedSlopes.includes(this.prevSlope)) {
                        this.prevSlope.model.unglow();
                    }
                    
                    // Push or remove corresponding slope on click
                    if(this.input.getPointerDown() && !this.prevPointer){
                        if(!this.selectedSlopes.includes(minSlope)){
                            this.selectedSlopes.push(minSlope);
                            minSlope.model.strongGlow()
                        }
                        else{
                            let idx = this.selectedSlopes.indexOf(minSlope);
                            this.selectedSlopes.splice(idx, 1);
                        }
                        this.prevPointer = true;
                    }
                    if(!this.input.getPointerDown()) this.prevPointer = false;
                    this.prevSlope = minSlope;
                } 
                // Unglow previous slope if too far from any slope
                else{
                    if(this.prevSlope != undefined 
                        && !this.selectedSlopes.includes(this.prevSlope)) 
                        this.prevSlope.model.unglow();
                }

                if(this.selectedSlopes.length == this.currParams[0]){
                    /** If the selection has more than one slopes, then such an
                     * operation will not rely on endpoints (for now) */
                    if(this.currParams[0] != 1) 
                        this.currSelection = SelectionMode.OPERATE;
                    else this.currSelection = SelectionMode.ENDPOINTS;
                }

                break;

            case SelectionMode.ENDPOINTS:
                if(this.selectedSlopes.length == 0){
                    this.currentAction = undefined;
                    return;
                }

                let slope = this.selectedSlopes[0];

                let ellipses = slope.model.getSprite().getChildren(function(node){
                    return node.getClassName() === 'Ellipse';
                });

                let endpointCoords = [[ellipses[0].x(), ellipses[0].y()],
                                    [ellipses[1].x(), ellipses[1].y()]];

                let minDist, minPoint;
                [minDist, minPoint] = this.getClosestEndpoint(position, endpointCoords);

                let indicators = slope.model.getSprite().getChildren(function(node){
                    return node.getClassName() === 'Group';
                }) as kv.Group[]; 

                if(minDist < SlopeModel.ENDPOINT_RADIUS 
                            + ActionManager.ENDPOINT_DETECTION_THRESHOLD){
                            
                    let indicator = indicators[minPoint];
                    indicator.setAttrs({"opacity": 1.0});

                    let hints = indicator.getChildren(function(node){
                        return node.getClassName() === 'Group';
                    }); 

                    if(this.currentAction == ActionType.COS) hints[0].setAttrs({"opacity": 1.0});
                    else if(this.currentAction == ActionType.SIN) hints[1].setAttrs({"opacity": 1.0});

                    let otherIdx = (minPoint + 1) % 2;
                    if(!this.selectedEndpoints.includes(otherIdx)){
                        let other = indicators[otherIdx];
                        this.setOpacityRecursive(other, 0.0);
                        this.prevEndpoint = minPoint;
                    }
                    
                    if(this.input.getPointerDown() && !this.prevPointer){
                        if(!this.selectedEndpoints.includes(minPoint)){
                            this.selectedEndpoints.push(minPoint);
                            indicators[minPoint].setAttrs({"opacity": 1.0});
                            let hints = indicators[minPoint].getChildren(function(node){
                                return node.getClassName() === 'Group';
                            }); 

                            if(this.currentAction == ActionType.COS) hints[0].setAttrs({"opacity": 1.0});
                            else if(this.currentAction == ActionType.SIN) hints[1].setAttrs({"opacity": 1.0});

                        }
                        else{
                            let idx = this.selectedEndpoints.indexOf(minPoint);
                            this.selectedEndpoints.splice(idx, 1);
                        }
                        this.prevPointer = true;
                    }
                    if(!this.input.getPointerDown()) this.prevPointer = false;
                    this.prevEndpoint = minPoint;

                }
                else{
                    if(this.prevEndpoint != undefined 
                        && !this.selectedEndpoints.includes(this.prevEndpoint))
                        this.setOpacityRecursive(indicators[this.prevEndpoint], 0.0);
                }

                if(this.selectedEndpoints.length == this.currParams[1])
                    this.currSelection = SelectionMode.OPERATE;
                break;

            case SelectionMode.OPERATE:
                this.operate(this.currentAction, this.selectedSlopes, this.selectedEndpoints);
                this.currSelection = SelectionMode.SLOPES;
                this.currentAction = undefined;
                break;
        }
        
    }

    /** Helper to clear all endpoint selections. 
     * MUST BE CALLED BEFORE CLEARSLOPES() */
    private clearEndpoints(){
        let slope = this.selectedSlopes[0];
        this.selectedEndpoints.forEach((s) => {
            let indicators = slope.model.getSprite().getChildren(function(node){
                return node.getClassName() === 'Group';
            });
            indicators[s].setAttrs({"opacity": 0.0});
        });
        this.selectedEndpoints = [];
    }

    /** Helper to clear all slope selections.  */
    private clearSlopes(){
        this.selectedSlopes.forEach((s) => s.model.unglow());
        this.selectedSlopes = [];
    }

    /** Helper to set the opacity of a group along with all groups within 
     * it recursively. */
    private setOpacityRecursive(group: kv.Group, opacity: number){
        let subgroups = group.getChildren(function(node){
            return node.getClassName() === 'Group';
        }) as kv.Group[]; 
        subgroups.forEach(group => {
            this.setOpacityRecursive(group, opacity);
        });
        if(group.getAttr("opacity") != opacity) group.setAttrs({"opacity": opacity});
    } 

    /**
     * Helper for getting the minimum distance to a slope within an array of 
     * slopes and the corresponding index. Slopes that come later take precedence 
     * in case of a tie.
     * @param position - The position of the pointer.
     * @param slopes - Array containing all slopes to be considered.
     * @returns An array containing the minimum distance and the index of the
     * corresponding slope, in that order.
     */
    private getMinDist(position: number[], slopes: Slope[]): [number, number]{
        let minDist = Number.MAX_VALUE;
        let minIndex = -1;
        if(this.currentAction == undefined) return [minDist, minIndex];
        for(let i = 0; i < slopes.length; ++i){
            // If the current action does not act on stabilized slopes, continue.
            if(this.excludeStabilized(this.currentAction) && slopes[i].stabilized) continue;
            let dir = slopes[i].getDirection();
            let endpoint = slopes[i].getAnchorEndpoint();
            let slopeLen = vecNorm(dir);
            let lenEndpoint = dot(dir, vecDiff(position, endpoint)) / slopeLen;
            let proj = vecSum(endpoint, vecScale(normalize(dir), lenEndpoint));
            let dist = vecNorm(vecDiff(position, proj));
            if(dist <= minDist){
                minDist = dist;
                minIndex = i;
            }
        }
        return [minDist, minIndex];
    }

    /**
     * Helper for getting the minimum distance to an endpoint within an array of 
     * endpoints (obtained from a slope) and the corresponding index. Endpoints 
     * that come later take precedence in case of a tie.
     * @param position - The position of the pointer.
     * @param endpoints - Array containing all endpoint coordinates to be 
     * considered.
     * @returns An array containing the minimum distance and the index of the
     * corresponding endpoint, in that order.
     */
    private getClosestEndpoint(position: number[], endpoints: number[][]): [number, number]{
        let dist1 = vecNorm(vecDiff(position, [endpoints[0][0], endpoints[0][1]]));
        let dist2 = vecNorm(vecDiff(position, [endpoints[1][0], endpoints[1][1]]));
        if(dist1 <= dist2) return [dist1, 0];
        else return [dist2, 1];
    }

    /**
     * Operates based on the given action. Defines a unique behavior for each
     * actionType.
     * @param type - The type of the incoming action.
     * @param slopes - An array containing all selected slopes.
     * @param endpoints - An array containing all selected endpoints.
     */
    private operate(type: ActionType, selectedSlopes: Slope[], selectedEndpoints: number[]){
        switch(type){
            case ActionType.COS:
                var slope = selectedSlopes[0];
                var endpoint = selectedEndpoints[0];
                if(endpoint == 0) this.stabilizeList.push({first: slope, 
                    second: {x: slope.x, y: slope.y, width: slope.width, height: 0}});
                else this.stabilizeList.push({first: slope,
                    second: {x: slope.x, y: slope.y + slope.height, width: slope.width, height: 0}});
                break;
            case ActionType.SIN:
                var slope = selectedSlopes[0];
                var endpoint = selectedEndpoints[0];
                if(endpoint == 0) this.stabilizeList.push({first: slope,
                    second: {x: slope.x, y: slope.y, width: 0, height: slope.height}});
                else this.stabilizeList.push({first: slope,
                    second: {x: slope.x + slope.width, y: slope.y, width: 0, height: slope.height}});
                break;
            case ActionType.TEST:
                break;
            default:
                throw new Error("Action does not match any valid type (maybe forgot to add?)");
        }
    }

    /**
     * Helper for getting the required number of parameters for each action.
     * The returned array gives the number of required slopes and the number of
     * required endpoints in that order.
     * @param type - The required actionType.
     */
    private getRequiredParams(type: ActionType): [number, number]{
        switch (type){
            case ActionType.COS:
                return [1, 1];
                break;
            case ActionType.SIN:
                return [1, 1];
                break;
            case ActionType.TEST:
                return [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
                break;
            default:
                throw new Error("Action does not match any valid type (maybe forgot to add?)");
        }  
    }

    /** Helper that returns whether each actionType should exclude considering
     * slopes that are already stabilized. */
    private excludeStabilized(type: ActionType): boolean{
        switch (type){
            case ActionType.COS:
                return true;
                break;
            case ActionType.SIN:
                return true;
                break;
            case ActionType.TEST:
                return false;
                break;
            default:
                throw new Error("Action does not match any valid type (maybe forgot to add?)");
        }  
    }

    /** Helper to clear all variables related to current selection. */
    private clearCurrentSelections(){
        if(this.prevSlope != undefined){
            this.prevSlope.model.unglow();
            if(this.prevEndpoint != undefined){
                this.prevSlope.model.getSprite().getChildren(function(node){
                    return node.getClassName() === 'Group';
                })[this.prevEndpoint].setAttrs({"opacity": 0.0});
            }
        } 
        
        this.prevPointer = false;
        this.currParams = undefined;
        this.currSelection = SelectionMode.SLOPES;
        if(this.selectedEndpoints.length != 0) this.clearEndpoints();
        if(this.selectedSlopes.length != 0) this.clearSlopes();
    }

    /** Helper to check if a <= n <= b. */
    private inRange(n: number, a: number, b: number): boolean{
        return n >= a && n <= b;
    }
}