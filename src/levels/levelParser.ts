import { Level, Point, Platform, Wall, Slope, Rectangle } from './level.ts';

/**
 * Class that parses JSON strings and
 * Level objects and converts them to
 * and from JSON.
 * @example
 * const parser = new LevelParser();
 * const level = parser.unserialize(jsonString);
 * const json = parser.serialize(level);
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
	 * Converts a Level object to a JSON string.
     * @param {Level} level - A Level object.
     * @returns {string} A JSON string that represents a level.
     */
    serialize(level: Level): string {
        return JSON.stringify(level, null, 2)
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
        return {
            levelId: validInt(object.levelId, `${name}.levelId`),
            spawnPoint: validPoint(object.spawnPoint, `${name}.spawnPoint`),
            platforms: validList(object.platforms, `${name}.platforms`, validRectangle),
			walls: validList(object.walls, `${name}.walls`, validRectangle),
            slopes: validList(object.slopes, `${name}.slopes`, validSlope)
        }
    }
}

// helper functions

/**
 * Takes in an object of unknown type and checks that it
 * is a valid object, not null and not an array.
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
export function validNumber(value: unknown, name: string): number {
    if (typeof(value) !== 'number' || !Number.isFinite(value) ) {
        throw new Error(`${name} must be a valid number`);
    }
    return value;
}

/**
 *
 * @param {unknown} value - An unknown value being validated as an integer.
 * @param {string} name - The number that the value is supposed to represent, eg. level1.levelId.
 * @returns {number} The value as a number if it is an integer.
 * @throws {Error} If the value is not an integer.
 */
export function validInt(value: unknown, name: string): number {
	if (typeof(value) !== 'number' || !Number.isInteger(value)) {
		throw new Error(`${name} must be a whole number`);
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
 * Iterates through a list of a certain
 * object type and validates that every item
 * is an object of that type.
 * @param {unknown} data - An unknown object being validated as a list.
 * @param {string} name - The name of the list the object is supposed to represent, eg. platforms1
 * @param {function} validateItem - The specific function that validates that each item is the expected object type.
 * @returns {T[]} A list containing the original items of the list if they are valid.
 */
export function validList<T>(data: unknown, name: string, validateItem: (item: unknown, name: string) => T): T[] {
    if (!Array.isArray(data)) throw new Error(`${name} must be a list`);
    return data.map((item, i) => validateItem(item, `${name}[${i}]`));
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
 * Takes in an unknown object and checks that it is a valid Rectangle.
 * @param {unknown} data - An unknown object being validated as a Rectangle.
 * @param {string} name - The platform/wall the object is supposed to represent in a Platforms/Walls array, eg. Platforms[0].
 * @returns {Rectangle} A Rectangle object with data read from the object.
 * @throws {Error} If data is not a valid object or data.upperLeft is not a valid Point.
 * or data.width/data.height are not positive numbers.
 */
export function validRectangle(data: unknown, name: string): Rectangle {
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
 * @throws {Error} If data is not a valid object or data.startPoint is not a valid Point.
 * or data.xComponent/data.yComponent are not positive numbers.
 */
export function validSlope(data: unknown, name: string): Slope {
    const slope = validObject(data, name);
    return {
        startPoint: validPoint(slope.startPoint, `${name}.startPoint`),
        xComponent: validPositiveNumber(slope.xComponent, `${name}.xComponent`),
        yComponent: validPositiveNumber(slope.yComponent, `${name}.yComponent`)
    }
}
