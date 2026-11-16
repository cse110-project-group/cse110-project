import { describe, expect, it } from 'vitest';
import {
	applyGravity,
	GRAVITY,
	TERMINAL_VELOCITY,
} from '../../src/systems/physics';

describe('Physics - applyGravity', () => {
	it('increases speed by GRAVITY * dt', () => {
		expect(applyGravity(0, 0.1).ySpeed).toBeCloseTo(GRAVITY * 0.1);
	});

	it('moves by the average of the old and new speed', () => {
		expect(applyGravity(0, 0.1).dy).toBeCloseTo(0.5 * GRAVITY * 0.1 * 0.1);
	});

	it('slows an upward speed', () => {
		const { ySpeed, dy } = applyGravity(-500, 0.01);
		expect(ySpeed).toBeCloseTo(-500 + GRAVITY * 0.01);
		expect(dy).toBeLessThan(0);
	});

	it('caps speed at TERMINAL_VELOCITY', () => {
		expect(applyGravity(TERMINAL_VELOCITY, 0.1).ySpeed).toBe(TERMINAL_VELOCITY);
		expect(applyGravity(TERMINAL_VELOCITY - 1, 0.1).ySpeed).toBe(TERMINAL_VELOCITY);
	});

	it('does not change speed when dt is 0', () => {
		expect(applyGravity(300, 0)).toEqual({ ySpeed: 300, dy: 0 });
	});
});
