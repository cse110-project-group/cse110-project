import { Level, Point, Slope, Platform } from "./level";

/**
 * Class that parses JSON strings and 
 * Level objects and converts them to 
 * and from JSON.
 *  @example
 * 
 */
export class LevelParser {
    /**
     * Takes a JSON string, checks that the string
     * represents a valid level, then converts into 
     * a Level object.
     * @param {string} text - a JSON string containing level data.
     * @returns {Level} A level object.
     * @throws {Error} If the input string is not valid JSON or not a valid Level object.
     */
    unserialize(text: string): Level {
        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error('not valid JSON');
        }
        return this.validate(data);
    }

    /**
     * Validates a level object then converts into 
     * a JSON string.
     * @param {Level} level - A Level object.
     * @returns {string} A JSON string that represents a level.
     * @throws {Error} if level is not a valid Level object.
     */
    serialize(level: Level): string {
        return JSON.stringify(this.validate(level), null, 2)
    }

    /**
     * Takes an unknown object and checks that it represents a valid Level, then
     * returns a Level object with the data.
     * @param {unknown} data - An unknown object.
     * @param {string} name - The name of the level the object represents.
     * @returns a Level object with the data from the object.
     * @throws {Error} If any components in the data object are not valid.
     */
    validate(data: unknown, name: string = 'level'): Level {
        const object = validObject(data, name);
        const num = validNumber(object.num, `${name}.num`);
        const spawnPoint = validPoint(object.spawnPoint, `${name}.spawnPoint`);
        const platforms: Platform[] = [];
        if (!Array.isArray(object.platforms)) throw new Error(`${name}.platforms must be a list`);
        for (const [i, platform] of object.platforms.entries()) {
	        platforms.push(validPlatform(platform, `${name}.platforms[${i}]`));
        }
        const slopes: Slope[] = [];
        if (!Array.isArray(object.slopes)) throw new Error(`${name}.slopes must be a list`);
        for (const [i, slope] of object.slopes.entries()) {
	        slopes.push(validSlope(slope, `${name}.slopes[${i}]`));
        }
        return {
            num: num,
            spawnPoint: spawnPoint,
            platforms: platforms,
            slopes: slopes
        }
    }
}

// helper functions

/**
 * Takes in an object of unknown type and checks that it 
 * is a valid object and not an array.
 * @param {unknown} object - An unknown object.
 * @param {string} name - The name of the level the unknown object is supposed to represent, eg. level1.
 * @returns The same object with a type of Record so its data can be read.
 * @throws {Error} If the object is not a valid object, null or an array.
 */
export function validObject(object: unknown, name: string): Record<string, unknown>{
    if (typeof(object) !== 'object' || object === null || Array.isArray(object)) {
        throw new Error(`${name} is an invalid object`);
    }
    return object as Record<string, unknown>;
}

/**
 * Takes in an unknown value and checks that it is a valid number.
 * @param {unknown} value - An unknown value being validated as a number.
 * @param {string} name - The number that the value is supposed to represent, eg. spawnPoint.x.
 * @returns {number} The value as a number if it is a valid number.
 * @throws {Error} If the value is null or not a number.
 */
export function validNumber(value: unknown, name: string): number{
    if (!Number.isFinite(value) || typeof(value) !== 'number') {
        throw new Error(`${name} must be a valid number`);
    }
    return value;
}

/**
 * Checks if a number is greater than 0.
 * @param {unknown }value - An unknown value being validated as being > 0.
 * @param {string} name - The number that the value is supposed to represent.
 * @returns {number} The same value as a number if it is > 0.
 * @throws {Error} If the value <= 0.
 */
export function validPositiveNumber(value: unknown, name: string): number {
	const number = validNumber(value, name); 
	if (number <= 0) {
		throw new Error(`${name} must be greater than 0`);
	}
	return number;
}

/**
 * Takes in an unknown object and checks that it is a valid Point.
 * @param {unknown} data - An unknown object being validated as a Point.
 * @param {string} name - The name of the point the object is supposed to represent, eg. spawnPoint.
 * @returns {Point} A Point object with data read from the object.
 * @throws {Error} If data is not a valid object or data.x/data.y are not valid numbers.
 */
export function validPoint(data: unknown, name: string): Point{
    const point = validObject(data, name);
    return {
        x: validNumber(point.x, `${name}.x`),
        y: validNumber(point.y, `${name}.y`)
    };
}

/**
 * Takes in an unknown object and checks that it is a valid Platform.
 * @param {unknown} data - An unknown object being validated as a Platform.
 * @param name - The platform the object is supposed to represent in a Platforms array, eg. Platforms[0].
 * @returns {Platform} A Platform object with data read from the object.
 * @throws {Error} If data is not a valid object or data.upperLeft is not a valid Point 
 * or data.width/data.height are not positive numbers.
 */
export function validPlatform(data: unknown, name: string): Platform {
    const platform = validObject(data, name);
    return {
        upperLeft: validPoint(platform.upperLeft, `${name}.upperLeft`),
        width: validPositiveNumber(platform.width, `${name}.width`),
        height: validPositiveNumber(platform.height, `${name}.height`)
    }
}

/**
 * Takes in an unknown object and checks that it is a valid Slope.
 * @param {unknown} data - An unknown object being validated as a Slope.
 * @param {string} name - The slope the object is supposed to represent in a Slopes array, eg. Slopes[0].
 * @returns {Slope} A Slope object with data read from the object.
 * @throws {Error} If data is not a valid object or data.startPoint is not a valid Point 
 * or data.xComponent/data.yComponent are not numbers.
 */
export function validSlope(data: unknown, name: string): Slope {
    const slope = validObject(data, name);
    return {
        startPoint: validPoint(slope.startPoint, `${name}.startPoint`),
        xComponent: validNumber(slope.xComponent, `${name}.xComponent`), 
        yComponent: validNumber(slope.yComponent, `${name}.yComponent`)
    }
}