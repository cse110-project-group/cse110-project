import { describe, expect, it } from 'vitest';
import type { Level } from '../../src/levels/level.ts';
import {
	LevelParser,
	validNumber,
	validObject,
	validPlatform,
	validPoint,
	validSlope,
} from '../../src/levels/levelParser.ts';

function validLevel(): Level {
	return {
		num: 1,
		spawnPoint: { x: 10, y: 20 },
		platforms: [{ upperLeft: { x: 0, y: 500 }, width: 800, height: 40 }],
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

describe('validPlatform', () => {
	it('returns a platform from valid data', () => {
		const data = { upperLeft: { x: 0, y: 500 }, width: 800, height: 40 };
		expect(validPlatform(data, 'level.platforms[0]')).toEqual(data);
	});

	it('throws if width is missing', () => {
		const data = { upperLeft: { x: 0, y: 500 }, height: 40 };
		expect(() => validPlatform(data, 'level.platforms[0]')).toThrow('level.platforms[0].width');
	});
});

describe('validSlope', () => {
	it('returns a slope from valid data', () => {
		const data = { startPoint: { x: 100, y: 300 }, xComponent: 200, yComponent: 80 };
		expect(validSlope(data, 'level.slopes[0]')).toEqual(data);
	});

	it('throws if the start point is missing', () => {
		expect(() => validSlope({ xComponent: 1, yComponent: 1 }, 'level.slopes[0]')).toThrow('level.slopes[0].startPoint');
	});

	it('throws if a component is not a number', () => {
		const data = { startPoint: { x: 1, y: 1 }, xComponent: 'big', yComponent: 1 };
		expect(() => validSlope(data, 'level.slopes[0]')).toThrow('level.slopes[0].xComponent');
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
		expect(() => parser.unserialize('{ "num": 1,')).toThrow('not valid JSON');
	});

	it('unserialize throws for JSON that is not a level', () => {
		expect(() => parser.unserialize('5')).toThrow('invalid object');
		expect(() => parser.unserialize('[1, 2]')).toThrow('invalid object');
	});

	it('unserialize says which field is wrong', () => {
		const level: any = validLevel();
		delete level.platforms[0].width;
		expect(() => parser.unserialize(JSON.stringify(level))).toThrow('level.platforms[0].width');
	});

	it('unserialize throws if platforms is not a list', () => {
		const level: any = validLevel();
		level.platforms = 'none';
		expect(() => parser.unserialize(JSON.stringify(level))).toThrow('platforms must be a list');
	});

	it('serialize refuses a level with bad data', () => {
		const level: any = validLevel();
		level.spawnPoint.x = 'left';
		expect(() => parser.serialize(level)).toThrow('level.spawnPoint.x');
	});
});