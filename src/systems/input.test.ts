// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Input from './input.ts';

function press(code: string) {
	window.dispatchEvent(new KeyboardEvent('keydown', { code }));
}

function release(code: string) {
	window.dispatchEvent(new KeyboardEvent('keyup', { code }));
}

describe('Input', () => {
	let input: Input;

	beforeEach(() => {
		input = new Input();
	});

	afterEach(() => {
		input.destroy();
	});

	it('reports no keys down initially', () => {
		expect(input.isKeyDown('KeyA')).toBe(false);
	});

	it('reports a key as down after keydown', () => {
		press('KeyA');
		expect(input.isKeyDown('KeyA')).toBe(true);
	});

	it('reports a key as up after keyup', () => {
		press('KeyA');
		release('KeyA');
		expect(input.isKeyDown('KeyA')).toBe(false);
	});

	it('tracks multiple keys independently', () => {
		press('KeyA');
		press('KeyD');
		release('KeyA');
		expect(input.isKeyDown('KeyA')).toBe(false);
		expect(input.isKeyDown('KeyD')).toBe(true);
	});

	it('stays down when keydown repeats', () => {
		press('KeyA');
		press('KeyA');
		release('KeyA');
		expect(input.isKeyDown('KeyA')).toBe(false);
	});

	it('ignores keyup for a key that was never pressed', () => {
		release('KeyA');
		expect(input.isKeyDown('KeyA')).toBe(false);
	});

	it('uses physical key codes, not characters', () => {
		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', key: 'A' }));
		expect(input.isKeyDown('KeyA')).toBe(true);
		expect(input.isKeyDown('A')).toBe(false);
	});

	it('releases all keys when the window loses focus', () => {
		press('KeyA');
		press('KeyD');
		window.dispatchEvent(new Event('blur'));
		expect(input.isKeyDown('KeyA')).toBe(false);
		expect(input.isKeyDown('KeyD')).toBe(false);
	});

	it('stops tracking keys after destroy', () => {
		input.destroy();
		press('KeyA');
		expect(input.isKeyDown('KeyA')).toBe(false);
	});

	it('keeps separate state per instance', () => {
		press('KeyA');
		const other = new Input();
		expect(other.isKeyDown('KeyA')).toBe(false);
		other.destroy();
	});
});
