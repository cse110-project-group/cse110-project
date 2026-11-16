// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../helpers/canvasStub.ts';
import Input from '../../../src/systems/input.ts';
import Player from '../../../src/entities/player/player.ts';
import PlayerController from '../../../src/entities/player/playerController.ts';
import PlayerModel from '../../../src/entities/player/playerModel.ts';
import kv from 'konva';

function press(code: string) {
	window.dispatchEvent(new KeyboardEvent('keydown', { code }));
}

function release(code: string) {
	window.dispatchEvent(new KeyboardEvent('keyup', { code }));
}

/** A wide solid floor whose top edge is at `y`. */
function floorAt(y: number) {
	return new kv.Rect({ x: -5000, y, width: 10000, height: 50, name: 'solid' });
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

	/**
	 * Runs `frames` updates of 0.01s each.
	 *
	 * @returns The highest point (lowest y) the sprite reached.
	 */
	function step(frames: number, obstacles: kv.Node[] = []) {
		let minY = model.getSprite().y();
		for(let i = 0; i < frames; ++i) {
			controller.update(0.01, obstacles);
			minY = Math.min(minY, model.getSprite().y());
		}
		return minY;
	}

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
			modelX - 0.5 * PlayerController.X_ACCELERATION 
				* Math.min(0.5, timeToMax) * Math.min(0.5, timeToMax)
			- PlayerController.MAX_X_SPEED * Math.max(0, 0.5 - timeToMax)
		);
	});

	it.each(['KeyD', 'ArrowRight'])('moves right with %s', (code) => {
		let modelX = model.getSprite().x();
		press(code);
		for(let i = 0; i < 5; ++i) controller.update(0.1);
		let timeToMax = PlayerController.MAX_X_SPEED 
						/ PlayerController.X_ACCELERATION;
		expect(model.getSprite().x()).toBeCloseTo(
			modelX + 0.5 * PlayerController.X_ACCELERATION 
				* Math.min(0.5, timeToMax) * Math.min(0.5, timeToMax)
			+ PlayerController.MAX_X_SPEED * Math.max(0, 0.5 - timeToMax)
		);
	});

	it('scales movement by delta time', () => {
		let modelX = model.getSprite().x();
		press('KeyD');
		controller.update(0.1);
		let timeToMax = PlayerController.MAX_X_SPEED 
						/ PlayerController.X_ACCELERATION;
		expect(model.getSprite().x()).toBeCloseTo(
			modelX 
			+ 0.5 * PlayerController.X_ACCELERATION 
				* Math.min(0.1, timeToMax) * Math.min(0.1, timeToMax)
			+ PlayerController.MAX_X_SPEED * Math.max(0, 0.1 - timeToMax) 
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
			modelX + 0.5 * PlayerController.X_ACCELERATION 
				* Math.min(0.5, timeToMax) * Math.min(0.5, timeToMax)
			+ PlayerController.MAX_X_SPEED * Math.max(0, 0.5 - timeToMax)
			+ 0.5 * PlayerController.X_DECELERATION 
				* Math.min(0.5, timeToZero) * Math.min(0.5, timeToZero)
		);
	});

	it('falls without a floor', () => {
		for(let i = 0; i < 10; ++i) controller.update(0.1);
		expect(model.getSprite().y()).toBeGreaterThan(50);
	});

	it('stays on a floor while moving sideways', () => {
		const floor = floorAt(100);
		press('KeyA');
		for(let i = 0; i < 10; ++i) controller.update(0.1, [floor]);
		expect(model.getSprite().y()).toBeCloseTo(50);
	});

	it.each(['Space', 'ArrowUp', 'KeyW'])('jumps with %s when grounded', (code) => {
		const floor = floorAt(100);
		controller.update(0.1, [floor]); // land first so grounded is set
		press(code);
		controller.update(0.1, [floor]);
		expect(model.getSprite().y()).toBeLessThan(50);
	});

	it('reaches about JUMP_HEIGHT at the peak of a held jump', () => {
		const floor = floorAt(100);
		controller.update(0.01, [floor]);
		press('Space');
		// Hold past the peak (~0.39s), then release so it doesn't bounce again.
		let minY = step(50, [floor]);
		release('Space');
		minY = Math.min(minY, step(100, [floor]));
		expect(50 - minY).toBeCloseTo(PlayerController.JUMP_HEIGHT, -1);
		expect(model.getSprite().y()).toBeCloseTo(50);
	});

	it('jumps lower when jump is released early', () => {
		const floor = floorAt(100);
		controller.update(0.01, [floor]);
		press('Space');
		step(5, [floor]);
		release('Space');
		const minY = step(100, [floor]);
		expect(50 - minY).toBeLessThan(PlayerController.JUMP_HEIGHT / 2);
		expect(50 - minY).toBeGreaterThan(0);
		expect(model.getSprite().y()).toBeCloseTo(50);
	});

	it('does not cut a jump released after the peak', () => {
		const floor = floorAt(100);
		controller.update(0.01, [floor]);
		press('Space');
		const minY = step(50, [floor]);
		release('Space');
		const yAtRelease = model.getSprite().y();
		controller.update(0.01, [floor]);
		// Already falling, so releasing changes nothing: still moving down.
		expect(model.getSprite().y()).toBeGreaterThan(yAtRelease);
		expect(50 - minY).toBeCloseTo(PlayerController.JUMP_HEIGHT, -1);
	});

	describe('coyote time', () => {
		/** Walks right off a ledge under the player; stops on the first airborne frame. */
		function walkOffLedge() {
			const ledge = new kv.Rect({
				x: 50, y: 100, width: 100, height: 50, name: 'solid'
			});
			controller.update(0.01, [ledge]);
			press('KeyD');
			for(let i = 0; i < 100 && model.getSprite().y() <= 50 + 1e-6; ++i) {
				controller.update(0.01, [ledge]);
			}
			release('KeyD');
			expect(model.getSprite().y()).toBeGreaterThan(50);
			return ledge;
		}

		it('allows a jump shortly after walking off a ledge', () => {
			const ledge = walkOffLedge();
			press('Space');
			expect(step(10, [ledge])).toBeLessThan(50);
		});

		it('does not allow a jump after COYOTE_TIME has passed', () => {
			const ledge = walkOffLedge();
			step(15, [ledge]); // 0.15s > COYOTE_TIME
			const yBefore = model.getSprite().y();
			press('Space');
			controller.update(0.01, [ledge]);
			expect(model.getSprite().y()).toBeGreaterThan(yBefore);
		});

		it('does not allow a second jump within COYOTE_TIME of takeoff', () => {
			const floor = floorAt(100);
			controller.update(0.01, [floor]);
			press('Space');
			step(2, [floor]);
			release('Space');
			step(1, [floor]); // jump is cut here
			// Pressing again 0.03s after takeoff must not relaunch at full speed.
			const yBefore = model.getSprite().y();
			press('Space');
			controller.update(0.01, [floor]);
			const rise = yBefore - model.getSprite().y();
			expect(rise).toBeLessThan(0.75 * PlayerController.JUMP_SPEED * 0.01);
		});
	});

	describe('jump buffering', () => {
		// Floor 40px below the player's feet: falling from rest lands at
		// t = sqrt(2 * 40 / GRAVITY) = 0.2s. Resting y on it is 90.
		const restY = 90;

		it('jumps on landing when pressed shortly before', () => {
			const floor = floorAt(140);
			step(15, [floor]); // t = 0.15s, 0.05s before landing
			press('Space');
			controller.update(0.01, [floor]);
			release('Space');
			step(10, [floor]); // land
			const minY = step(50, [floor]);
			expect(minY).toBeLessThan(restY - 5);
		});

		it('does not jump on landing when pressed too early', () => {
			const floor = floorAt(140);
			press('Space');
			controller.update(0.01, [floor]);
			release('Space');
			step(20, [floor]); // land at 0.2s; buffer expired at ~0.11s
			const minY = step(50, [floor]);
			expect(minY).toBeCloseTo(restY);
		});
	});

	it('cannot jump in midair', () => {
		press('Space');
		controller.update(0.1);
		expect(model.getSprite().y()).toBeGreaterThan(50);
	});

	it('stops rising when hitting a ceiling', () => {
		const floor = floorAt(100);
		// Ceiling 20px above the player's head (top of the sprite is at 0).
		const ceiling = new kv.Rect({
			x: -5000, y: -40, width: 10000, height: 20, name: 'solid'
		});
		controller.update(0.01, [floor, ceiling]);
		press('Space');
		let minY = model.getSprite().y();
		for(let i = 0; i < 20; ++i) {
			controller.update(0.01, [floor, ceiling]);
			minY = Math.min(minY, model.getSprite().y());
		}
		expect(minY).toBeCloseTo(30);
	});

	it('falls after walking off a ledge', () => {
		const ledge = new kv.Rect({
			x: 50, y: 100, width: 100, height: 50, name: 'solid'
		});
		controller.update(0.1, [ledge]);
		expect(model.getSprite().y()).toBeCloseTo(50);
		press('KeyD');
		for(let i = 0; i < 10; ++i) controller.update(0.1, [ledge]);
		expect(model.getSprite().y()).toBeGreaterThan(50);
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

	it.each([['KeyA', 'ArrowLeft'], ['KeyD', 'ArrowRight']])
			('moves without getting affected by changing framerate', 
			(code1, code2) => {
		press(code2);
		let t1 = 0;
		while(t1 < 0.5){
			let interval = Math.min(Math.random() * 0.1, 0.5 - t1);
			controller.update(interval);
			t1 += interval;
		}
		release(code2);
		press(code1);
		while(t1 < 1){
			let interval = Math.min(Math.random() * 0.1, 1 - t1);
			controller.update(interval);
			t1 += interval;
		}
		release(code1);
		let modelX1 = model.getSprite().x();
		model = new PlayerModel(100, 50);
		controller = new PlayerController(input, model);
		press(code2);
		let t2 = 0;
		while(t2 < 0.5){
			let interval = Math.min(Math.random() * 0.1, 0.5 - t2);
			controller.update(interval);
			t2 += interval;
		}
		release(code2);
		press(code1);
		while(t2 < 1){
			let interval = Math.min(Math.random() * 0.1, 1 - t2);
			controller.update(interval);
			t2 += interval;
		}
		release(code1);
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
			spriteX + 0.5 * PlayerController.X_ACCELERATION 
				* Math.min(1, timeToMax) * Math.min(1, timeToMax)
			+ PlayerController.MAX_X_SPEED * Math.max(0, 1 - timeToMax)
		);
	});
});
