import { describe, expect, it } from 'vitest';
import { Level } from '../../src/levels/level.ts';
import {
	LevelParser,
	validNumber,
	validObject,
	validRectangle,
	validSlope,
	validList,
	validPoint,
} from '../../src/levels/levelParser.ts';

function validLevel(): Level {
	return {
		levelId: 1,
		spawnPoint: { x: 10, y: 20 },
		platforms: [{ upperLeft: { x: 0, y: 500 }, width: 800, height: 40 }],
		walls: [{ upperLeft: { x: 780, y: 0 }, width: 20, height: 500 }],
		slopes: [{ startPoint: { x: 100, y: 300 }, xComponent: 200, yComponent: 80 }],
	};
}

describe('validObject', () => {
	it('returns the same object when given a plain object', () => {
		const object = { a: 1 };
		expect(validObject(object, 'level')).toBe(object);
	});

	it.each([
		['null', null],
		['a list', [1, 2]],
		['a number', 5],
		['text', 'hello'],
		['undefined', undefined],
	])('throws for %s', (_description, value) => {
		expect(() => validObject(value, 'level.spawnPoint')).toThrow('level.spawnPoint');
	});
});

describe('validNumber', () => {
	it.each([0, 5, -3, 2.5])('returns the number %s', (value) => {
		expect(validNumber(value, 'x')).toBe(value);
	});

	it.each([
		['text', '5'],
		['null', null],
		['undefined (a missing field)', undefined],
		['a boolean', true],
		['an object', {}],
	])('throws for %s', (_description, value) => {
		expect(() => validNumber(value, 'spawnPoint.x')).toThrow('spawnPoint.x must be a valid number');
	});
});

describe('validPoint', () => {
	it('returns a point with the x and y it was given', () => {
		expect(validPoint({ x: 1, y: 2 }, 'spawnPoint')).toEqual({ x: 1, y: 2 });
	});

	it('throws if x is missing', () => {
		expect(() => validPoint({ y: 2 }, 'spawnPoint')).toThrow('spawnPoint.x');
	});

	it('throws if y is not a number', () => {
		expect(() => validPoint({ x: 1, y: '2' }, 'spawnPoint')).toThrow('spawnPoint.y');
	});

	it('throws if it is not an object', () => {
		expect(() => validPoint('hello', 'spawnPoint')).toThrow('spawnPoint');
	});
});

describe('validList', () => {
	it('returns the checked items as a new list', () => {
		expect(validList([1, 2, 3], 'xs', validNumber)).toEqual([1, 2, 3]);
	});

	it('returns an empty list for an empty list', () => {
		expect(validList([], 'xs', validNumber)).toEqual([]);
	});

	it.each([
		['text', 'none'],
		['an object', {}],
		['null', null],
		['undefined (a missing field)', undefined],
	])('throws if the value is %s', (_description, value) => {
		expect(() => validList(value, 'level.walls', validNumber)).toThrow('level.walls must be a list');
	});

	it('names the position of the first bad item', () => {
		expect(() => validList([1, 'two', 3], 'xs', validNumber)).toThrow('xs[1] must be a valid number');
	});
});

describe('validRectangle', () => {
	it('returns a rectangle from valid data', () => {
		const data = { upperLeft: { x: 0, y: 500 }, width: 800, height: 40 };
		expect(validRectangle(data, 'level.platforms[0]')).toEqual(data);
	});

	it('throws if width is missing', () => {
		const data = { upperLeft: { x: 0, y: 500 }, height: 40 };
		expect(() => validRectangle(data, 'level.platforms[0]')).toThrow('level.platforms[0].width');
	});

	it.each([0, -5])('throws if width is %s', (width) => {
		const data = { upperLeft: { x: 0, y: 500 }, width, height: 40 };
		expect(() => validRectangle(data, 'level.walls[0]')).toThrow('level.walls[0].width must be greater than 0');
	});

	it.each([0, -5])('throws if height is %s', (height) => {
		const data = { upperLeft: { x: 0, y: 500 }, width: 10, height };
		expect(() => validRectangle(data, 'level.walls[0]')).toThrow('level.walls[0].height must be greater than 0');
	});

	it('names the exact field when the corner point is wrong', () => {
		const data = { upperLeft: { x: 0 }, width: 10, height: 10 };
		expect(() => validRectangle(data, 'level.walls[2]')).toThrow('level.walls[2].upperLeft.y');
	});
});

describe('validSlope', () => {
	const slope = (xComponent: unknown, yComponent: unknown) => ({ startPoint: { x: 1, y: 1 }, xComponent, yComponent });

	it('returns a slope from valid data', () => {
		const data = slope(200, 80);
		expect(validSlope(data, 'level.slopes[0]')).toEqual(data);
	});

	it.each([
		[2, 3],
		[2, -3],
		[-2, 3],
		[-2, -3],
		[0.5, -0.5],
	])('accepts the components %s and %s (positive or negative)', (xComponent, yComponent) => {
		const data = slope(xComponent, yComponent);
		expect(validSlope(data, 'level.slopes[0]')).toEqual(data);
	});

	it.each([
		['xComponent', slope(0, 3)],
		['yComponent', slope(2, 0)],
	])('throws if %s is 0', (field, data) => {
		expect(() => validSlope(data, 'level.slopes[0]')).toThrow(`level.slopes[0].${field} must not be 0`);
	});

	it('throws if both components are 0', () => {
		expect(() => validSlope(slope(0, 0), 'level.slopes[0]')).toThrow('must not be 0');
	});

	it('treats -0 as 0', () => {
		expect(() => validSlope(slope(-0, 3), 'level.slopes[0]')).toThrow('level.slopes[0].xComponent must not be 0');
	});

	it.each([
		['text', 'big'],
		['null', null],
		['undefined (a missing field)', undefined],
		['NaN', NaN],
	])('throws if a component is %s', (_description, value) => {
		expect(() => validSlope(slope(value, 3), 'level.slopes[0]')).toThrow('level.slopes[0].xComponent must be a valid number');
		expect(() => validSlope(slope(2, value), 'level.slopes[0]')).toThrow('level.slopes[0].yComponent must be a valid number');
	});

	it('throws if the start point is missing', () => {
		expect(() => validSlope({ xComponent: 1, yComponent: 1 }, 'level.slopes[0]')).toThrow('level.slopes[0].startPoint');
	});
});

describe('LevelParser', () => {
	const parser = new LevelParser();

	it('unserialize turns JSON text into a level', () => {
		const level = validLevel();
		expect(parser.unserialize(JSON.stringify(level))).toEqual(level);
	});

	it('serialize turns a level into JSON text that matches the level', () => {
		const level = validLevel();
		const text = parser.serialize(level);
		expect(typeof text).toBe('string');
		expect(JSON.parse(text)).toEqual(level);
	});

	it('gives back the same level after serialize then unserialize', () => {
		const level = validLevel();
		expect(parser.unserialize(parser.serialize(level))).toEqual(level);
	});

	it('writes the same text again after a round trip', () => {
		const text = parser.serialize(validLevel());
		expect(parser.serialize(parser.unserialize(text))).toBe(text);
	});

	it('unserialize throws "not valid JSON" for broken text', () => {
		expect(() => parser.unserialize('{ "levelId": 1,')).toThrow('not valid JSON');
	});

	it('unserialize throws for JSON that is not a level', () => {
		expect(() => parser.unserialize('5')).toThrow('invalid object');
		expect(() => parser.unserialize('[1, 2]')).toThrow('invalid object');
	});

	it('unserialize says the level id must be a whole number', () => {
		const level: any = validLevel();
		level.levelId = 1.5;
		expect(() => parser.unserialize(JSON.stringify(level))).toThrow('level.levelId must be a whole number');
	});

	it.each([0, -1, -100])('unserialize throws if the level id is %s', (levelId) => {
		const level: any = validLevel();
		level.levelId = levelId;
		expect(() => parser.unserialize(JSON.stringify(level))).toThrow('level.levelId must be greater than 0');
	});

	it.each([1, 2, 50])('unserialize accepts a level id of %s', (levelId) => {
		const level = { ...validLevel(), levelId };
		expect(parser.unserialize(JSON.stringify(level)).levelId).toBe(levelId);
	});

	it('unserialize says which field is wrong', () => {
		const level: any = validLevel();
		delete level.platforms[0].width;
		expect(() => parser.unserialize(JSON.stringify(level))).toThrow('level.platforms[0].width');
	});

	it.each(['platforms', 'walls', 'slopes'])('unserialize throws if %s is not a list', (field) => {
		const level: any = validLevel();
		level[field] = 'none';
		expect(() => parser.unserialize(JSON.stringify(level))).toThrow(`level.${field} must be a list`);
	});

	it.each(['platforms', 'walls', 'slopes'])('unserialize throws if %s is missing', (field) => {
		const level: any = validLevel();
		delete level[field];
		expect(() => parser.unserialize(JSON.stringify(level))).toThrow(`level.${field} must be a list`);
	});

});
