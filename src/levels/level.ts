/**
 * Interface to represent a level.
 * Stores the number of the level,
 * the player's spawn point as a Point,
 * and the platforms, walls and slopes
 * in the level.
 * @example
 * const level: Level = {
 *   num: 1,
 *   spawnPoint: { x: 1, y: 2},
 * 	 platforms: [[{ upperLeft: { x: 2, y: 5 }, width: 4, height: 2 }]],
 *   walls: [{ upperLeft: { x: 10, y: 0 }, width: 5, height: 10 }],
 *   slopes: [{ startPoint: { x: 3, y: 4 }, xComponent: 2, yComponent: 5 }]
 * };
 */
export interface Level {
    levelId: number;
    spawnPoint: Point;
    platforms: Platform[];
	walls: Wall[];
    slopes: Slope[];
}

/**
 * Interface to represent a point.
 * Stores the x and y coordinate
 * of the point.
 * @example
 * const point: Point = { x: 1, y: 2 };
 */
export interface Point {
    x: number;
    y: number;
}

/**
 * Interface to represent a rectangle.
 * Stores the upper left corner as
 * a point, and the width and height.
 * @example
 * const rectangle: Rectangle = { upperLeft: {1,2}, width: 4, height: 5 };
 */
export interface Rectangle {
	upperLeft: Point;
	width: number;
	height: number;
}

/**
 * Interface to represent platforms.
 * Has the same fields as rectangle.
 * @example
 * const platform: Platform = { upperLeft: {1,2}, width: 3, height: 4 }
 */
export interface Platform extends Rectangle {}

/**
 * Interface to represent walls.
 * Has the same fields as rectangle.
 * @example
 * const wall: Wall = { upperLeft: {3,4}, width: 4, height: 5 };
 */
export interface Wall extends Rectangle {}

/**
 * Interface to store a slope.
 * Stores the start point as a
 * point and the x and y components
 * as numbers. Slopes will be lines
 * that start at the start point and
 * stretch from (startX, startY) to
 * (startX + xComponent, startY + yComponent)
 * @example
 * const slope: Slope = { startPoint: {1,2}, xComponent: 2, yComponent: 2 }
 */
export interface Slope {
    startPoint: Point;
    xComponent: number;
    yComponent: number;
}


