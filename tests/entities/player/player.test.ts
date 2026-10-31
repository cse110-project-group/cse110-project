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
		for(let i = 0; i < 10; ++i) controller.update(0.1);
		expect(model.getSprite().x()).toBe(100);
	});

	it.each(['KeyA', 'ArrowLeft'])('moves left with %s', (code) => {
		let modelX = model.getSprite().x();
		press(code);
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		let timeToMax = PlayerController.MAX_X_SPEED 
						/ PlayerController.X_ACCELERATION;
		expect(model.getSprite().x()).toBeCloseTo(
			modelX - 0.5 * PlayerController.MAX_X_SPEED * timeToMax
			- PlayerController.MAX_X_SPEED * (0.5 - timeToMax)
		);
	});

	it.each(['KeyD', 'ArrowRight'])('moves right with %s', (code) => {
		let modelX = model.getSprite().x();
		press(code);
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		let timeToMax = PlayerController.MAX_X_SPEED 
						/ PlayerController.X_ACCELERATION;
		expect(model.getSprite().x()).toBeCloseTo(
			modelX + 0.5 * PlayerController.MAX_X_SPEED * timeToMax
			+ PlayerController.MAX_X_SPEED * (0.5 - timeToMax)
		);
	});

	it('scales movement by delta time', () => {
		let modelX = model.getSprite().x();
		press('KeyD');
		controller.update(0.1);
		expect(model.getSprite().x()).toBeCloseTo(
			modelX + 0.5 * PlayerController.X_ACCELERATION * 0.1 * 0.1
		);
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
		expect(model.getSprite().x()).toBe(100);
	});

	it('stops moving after the key is released', () => {
		let modelX = model.getSprite().x();
		press('KeyD');
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		release('KeyD');
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		let timeToMax = PlayerController.MAX_X_SPEED 
						/ PlayerController.X_ACCELERATION;
		let timeToZero = PlayerController.MAX_X_SPEED 
						/ PlayerController.X_DECELERATION;
		expect(model.getSprite().x()).toBeCloseTo(
			modelX + 0.5 * PlayerController.MAX_X_SPEED * timeToMax
			+ PlayerController.MAX_X_SPEED * (0.5 - timeToMax)
			+ 0.5 * PlayerController.MAX_X_SPEED * timeToZero
		);
	});

	it('never changes vertical position', () => {
		press('KeyA');
		for(let i = 0; i < 10; ++i) controller.update(0.1);
		expect(model.getSprite().y()).toBe(50);
	});

	it.each(['KeyA', 'ArrowLeft', 'KeyD', 'ArrowRight'])
			('moves independent of framerate', (code) => {
		press(code);
		for(let i = 0; i < 10; ++i) controller.update(0.05);
		release(code);
		for(let i = 0; i < 10; ++i) controller.update(0.05);
		let modelX1 = model.getSprite().x();
		model = new PlayerModel(100, 50);
		controller = new PlayerController(input, model);
		press(code);
		for(let i = 0; i < 100; ++i) controller.update(0.005);
		release(code);
		for(let i = 0; i < 100; ++i) controller.update(0.005);
		let modelX2 = model.getSprite().x();
		expect(modelX1).toBeCloseTo(modelX2);
	})

	it.each([['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']])
			('changes movement independent of framerate', (code1, code2) => {
		press(code1);
		for(let i = 0; i < 20; ++i) controller.update(0.025);
		release(code1);
		press(code2);
		for(let i = 0; i < 10; ++i) controller.update(0.025);
		release(code2);
		let modelX1 = model.getSprite().x();
		model = new PlayerModel(100, 50);
		controller = new PlayerController(input, model);
		press(code1);
		for(let i = 0; i < 50; ++i) controller.update(0.01);
		release(code1);
		press(code2);
		for(let i = 0; i < 25; ++i) controller.update(0.01);
		release(code2);
		let modelX2 = model.getSprite().x();
		expect(modelX1).toBeCloseTo(modelX2);
	})
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
		let spriteX = player.getSprite().x();
		press('KeyD');
		for(let i = 0; i < 10; ++i) player.update(0.1);
		let timeToMax = PlayerController.MAX_X_SPEED 
						/ PlayerController.X_ACCELERATION;
		expect(player.getSprite().x()).toBeCloseTo(
			spriteX + 0.5 * PlayerController.MAX_X_SPEED * timeToMax
			+ PlayerController.MAX_X_SPEED * (1 - timeToMax)
		);
	});
});
