// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../helpers/canvasStub.ts';
import Input from '../../../src/systems/input.ts';
import Player from '../../../src/entities/player/player.ts';
import PlayerController from '../../../src/entities/player/playerController.ts';
import PlayerModel from '../../../src/entities/player/playerModel.ts';

function press(code: string) {
	window.dispatchEvent(new KeyboardEvent('keydown', { code }));
}

function release(code: string) {
	window.dispatchEvent(new KeyboardEvent('keyup', { code }));
}

describe('PlayerModel', () => {
	it('places the sprite at the given position', () => {
		const model = new PlayerModel(10, 20);
		expect(model.getSprite().x()).toBe(10);
		expect(model.getSprite().y()).toBe(20);
	});

	it('returns the same sprite every time', () => {
		const model = new PlayerModel(0, 0);
		expect(model.getSprite()).toBe(model.getSprite());
	});
});

describe('PlayerController', () => {
	let input: Input;
	let model: PlayerModel;
	let controller: PlayerController;

	beforeEach(() => {
		input = new Input();
		model = new PlayerModel(100, 50);
		controller = new PlayerController(input, model);
	});

	afterEach(() => {
		input.destroy();
	});

	it('does not move without input', () => {
		controller.update(1);
		expect(model.getSprite().x()).toBe(100);
	});

	it.each(['KeyA', 'ArrowLeft'])('moves left with %s', (code) => {
		press(code);
		controller.update(0.5);
		expect(model.getSprite().x()).toBeLessThan(100);
		expect(model.getSprite().x()).toBeGreaterThanOrEqual(0);
	});

	it.each(['KeyD', 'ArrowRight'])('moves right with %s', (code) => {
		press(code);
		controller.update(0.5);
		expect(model.getSprite().x()).toBeGreaterThan(100);
		expect(model.getSprite().x()).toBeLessThanOrEqual(200);
	});

	it('scales movement by delta time', () => {
		press('KeyD');
		controller.update(0.1);
		expect(model.getSprite().x()).toBeLessThan(120);
		expect(model.getSprite().x()).toBeGreaterThan(100);
	});

	it('does not move when delta time is zero', () => {
		press('KeyD');
		controller.update(0);
		expect(model.getSprite().x()).toBe(100);
	});

	it('cancels out when both directions are held', () => {
		press('KeyA');
		press('KeyD');
		controller.update(1);
		expect(model.getSprite().x()).toBe(100);
	});

	it('stops moving after the key is released', () => {
		press('KeyD');
		controller.update(0.5);
		release('KeyD');
		controller.update(0.5);
		expect(model.getSprite().x()).toBeLessThanOrEqual(200);
		expect(model.getSprite().x()).toBeGreaterThan(100);
	});

	it('never changes vertical position', () => {
		press('KeyA');
		controller.update(1);
		expect(model.getSprite().y()).toBe(50);
	});
});

describe('Player', () => {
	let input: Input;

	beforeEach(() => {
		input = new Input();
	});

	afterEach(() => {
		input.destroy();
	});

	it('exposes its sprite at the starting position', () => {
		const player = new Player(input, 30, 40);
		expect(player.getSprite().x()).toBe(30);
		expect(player.getSprite().y()).toBe(40);
	});

	it('moves its sprite on update', () => {
		const player = new Player(input, 100, 0);
		press('KeyD');
		player.update(1);
		expect(player.getSprite().x()).toBeGreaterThan(200);
		expect(player.getSprite().x()).toBeLessThanOrEqual(300);
	});
});
