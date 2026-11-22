import Input from './systems/input.ts';
import kv from 'konva';
import Player from './entities/player/player.ts';
import { NodeConfig } from 'konva/lib/Node';
import Action from './entities/action/action.ts';
import { ActionType } from './entities/action/action.ts';
import ActionManager from './systems/actionManager.ts';
import Slope from './entities/slope/slope.ts';

/**
 * Top-level game object. Creates the Konva stage, owns the shared
 * {@link Input} and all entities, and runs the main loop.
 *
 * Expects an element with id `container` to exist in the page (see
 * `index.html`); the stage is sized to fill the window.
 *
 * @example
 * const game = new Game();
 * game.start();
 */
export default class Game {
	/** Side length for a unit grid in a level */
	public static readonly GRID_UNIT = 30;

	/**
	 * Longest frame the game will simulate, in seconds. When the tab is in the
	 * background `requestAnimationFrame` pauses, so the first frame back would
	 * otherwise see a huge delta and entities would jump across the screen.
	 */
	private static readonly MAX_DELTA_TIME = 0.1;

	private input: Input;
	private stage: kv.Stage;
	private gameLayer: kv.Layer;
	private player: Player;
	private actionManager: ActionManager;
	/** Timestamp of the previous frame, in milliseconds. */
	private lastTime = 0;

	slopeArray: Slope[] = [];

	/** Builds the stage and layer and places the player at the center. */
	constructor() {
		this.stage = new kv.Stage({
			container: 'container',
			width: window.innerWidth,
			height: window.innerHeight
		});
		this.gameLayer = new kv.Layer();
		this.stage.add(this.gameLayer);


		// below are the test platforms so u can test movement, delete when we have levels
		// START TEST PLATFORMS
		const floor = new kv.Rect({
			x: 0,
			y: this.stage.height() - 100,
			width: this.stage.width(),
			height: 100,
			fill: '#555',
			name: 'solid'
		});
		this.gameLayer.add(floor);

		// Temporary test platforms, placed relative to the screen center and
		// the floor's top. Each step rises 110px (under JUMP_HEIGHT) so every
		// one is reachable, and none overlap the player's spawn point.
		const centerX = this.stage.width() / 2;
		const floorTop = floor.y();
		const platforms = [
			{ x: centerX + 100, rise: 110 },
			{ x: centerX + 300, rise: 220 },
			{ x: centerX + 100, rise: 330 },
			{ x: centerX - 250, rise: 110 },
			{ x: centerX - 450, rise: 220 },
		];
		for (const { x, rise } of platforms) {
			this.gameLayer.add(new kv.Rect({
				x: x,
				y: floorTop - rise,
				width: 150,
				height: 20,
				fill: '#555',
				name: 'solid'
			}));
		}
		// END TEST PLATFORMS

		this.input = new Input(this.stage.container());
		this.player = new Player(
			this.input, this.stage.width()/2, this.stage.height()/2
		);

		this.actionManager = new ActionManager(this.input);

		// SLOPES AND ACTIONS TEST
		let action = new Action(this.input, this.actionManager, ActionType.COS, 960, this.stage.height() - 10);
		this.gameLayer.add(action.getSprite())

		let slope1 = new Slope(this.input, 1080, 420, 300, -90);
		let slope2 = new Slope(this.input, 120, 540, 300, 0);
		this.slopeArray = [slope1, slope2];
		this.gameLayer.add(slope1.getSprite());
		this.gameLayer.add(slope2.getSprite());
		// SLOPES AND ACTIONS TEST END
		
		this.gameLayer.add(this.player.getSprite());

		this.gameLayer.draw();
	}

	/**
	 * Runs once per animation frame: computes the time since the last frame
	 * (in seconds, capped at {@link Game.MAX_DELTA_TIME}) and updates every
	 * entity with it, then schedules itself
	 * again. Konva redraws the layer automatically when shapes change.
	 *
	 * @param time - High-resolution timestamp from `requestAnimationFrame`.
	 */
	private gameLoop = (time: number) => {
		const deltaTime = Math.min(
			Game.MAX_DELTA_TIME,
			Math.max(0, (time - this.lastTime) / 1000)
		);
		this.lastTime = time;

		/** Remember to populate slopeArray with array containing level slopes */

		this.player.update(deltaTime, this.gameLayer.getChildren(), this.slopeArray);
		this.actionManager.update(this.slopeArray);

		requestAnimationFrame(this.gameLoop);
	}

	public getPlayer() { return this.player; }

	/** Starts the game loop. Call once after constructing the game. */
	public start() {
		this.lastTime = performance.now();
		requestAnimationFrame(this.gameLoop);
	}
}
