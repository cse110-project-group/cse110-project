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
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		expect(model.getSprite().x()).toBeLessThanOrEqual(30);
		expect(model.getSprite().x()).toBeGreaterThanOrEqual(20);
	});

	it.each(['KeyD', 'ArrowRight'])('moves right with %s', (code) => {
		press(code);
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		expect(model.getSprite().x()).toBeGreaterThanOrEqual(170);
		expect(model.getSprite().x()).toBeLessThanOrEqual(180);
	});

	it('scales movement by delta time', () => {
		press('KeyD');
		controller.update(0.1);
		expect(model.getSprite().x()).toBeLessThanOrEqual(110);
		expect(model.getSprite().x()).toBeGreaterThanOrEqual(100);
	});

	it('does not move when delta time is zero', () => {
		press('KeyD');
		controller.update(0);
		expect(model.getSprite().x()).toBe(100);
	});

	it('cancels out when both directions are held', () => {
		press('KeyA');
		press('KeyD');
		for(let i = 0; i < 10; ++i) controller.update(0.1);
		expect(model.getSprite().x()).toBeLessThanOrEqual(105);
		expect(model.getSprite().x()).toBeGreaterThanOrEqual(95);
	});

	it('stops moving after the key is released', () => {
		press('KeyD');
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		release('KeyD');
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		expect(model.getSprite().x()).toBeLessThanOrEqual(190);
		expect(model.getSprite().x()).toBeGreaterThanOrEqual(180);
	});

	it('never changes vertical position', () => {
		press('KeyA');
		for(let i = 0; i < 10; ++i) controller.update(0.1);
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
		for(let i = 0; i < 10; ++i) player.update(0.1);
		expect(player.getSprite().x()).toBeGreaterThanOrEqual(265);
		expect(player.getSprite().x()).toBeLessThanOrEqual(275);
	});
});
