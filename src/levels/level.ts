/**
 * Interface to represent a level.
 * Stores the number of the level, 
 * the player's spawn point as a Point,
 * and the platforms and slopes.
 * @example
 * const level1 = { num: 1, }
 */
export interface Level {
    num: number;
    spawnPoint: Point;
    platforms: Platform[];
    slopes: Slope[];
}

/**
 * Interface to represent a point.
 * Stores the x and y coordinate
 * of the point.
 * @example
 * const point1 = { x: 1, y: 2 }
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Interface to represent platforms.
 * Stores the upper left coordinate 
 * as a point, and the width and height
 * of the platform.
 * @example
 * const platform1 = { upperLeft: {1,2}, width: 3, height: 4 }
 */
export interface Platform {
    upperLeft: Point;
    width: number;
    height: number;
}

/**
 * Interface to store a slope.
 * Stores the start point as a
 * point and the x and y components 
 * as numbers. Slopes will be lines 
 * that start at the start point and
 * stretch from (startX, startY) to 
 * (startX + xComponent, startY + yComponent)
 * @example 
 * const slope1 = { startPoint: {1,2}, xComponent: 2, yComponent: 2 }
 */
export interface Slope {
    startPoint: Point;
    xComponent: number;
    yComponent: number;
}

