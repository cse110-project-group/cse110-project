// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './helpers/canvasStub.ts';
import kv from 'konva';
import Game from '../src/game.ts';

describe('Game', () => {
	let frames: FrameRequestCallback[];

	beforeEach(() => {
		document.body.innerHTML = '<div id="container"></div>';
		frames = [];
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			frames.push(cb);
			return frames.length;
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		kv.stages.forEach((s) => s.destroy());
		document.body.innerHTML = '';
	});

	/** Runs the most recently scheduled frame at the given timestamp. */
	function runFrame(time: number) {
		frames.pop()!(time);
	}

	function playerSprite(): kv.Shape {
		return kv.stages[0].findOne('Ellipse') as kv.Shape;
	}

	it('creates a stage sized to the window', () => {
		new Game();
		expect(kv.stages[0].width()).toBe(window.innerWidth);
		expect(kv.stages[0].height()).toBe(window.innerHeight);
	});

	it('places the player at the center of the stage', () => {
		new Game();
		expect(playerSprite().x()).toBe(window.innerWidth / 2);
		expect(playerSprite().y()).toBe(window.innerHeight / 2);
	});

	it('schedules the next frame on start and after each frame', () => {
		vi.spyOn(performance, 'now').mockReturnValue(0);
		new Game().start();
		expect(frames).toHaveLength(1);
		runFrame(16);
		expect(frames).toHaveLength(1);
	});

	it('moves the player by elapsed time each frame', () => {
		vi.spyOn(performance, 'now').mockReturnValue(1000);
		new Game().start();
		const startX = playerSprite().x();

		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
		runFrame(1050); // 0.05s at 200px/s
		expect(playerSprite().x()).toBeCloseTo(startX + 10);
		window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
	});

	it('caps delta time after a long pause (e.g. tab switch)', () => {
		vi.spyOn(performance, 'now').mockReturnValue(1000);
		new Game().start();
		const startX = playerSprite().x();

		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
		runFrame(11000); // 10s gap, capped to 0.1s at 200px/s
		expect(playerSprite().x()).toBeCloseTo(startX + 20);
		window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
	});

	it('never uses a negative delta time', () => {
		vi.spyOn(performance, 'now').mockReturnValue(1000);
		new Game().start();
		const startX = playerSprite().x();

		window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
		runFrame(500); // timestamp earlier than start
		expect(playerSprite().x()).toBe(startX);
		window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
	});
});
