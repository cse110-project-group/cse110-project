import Input from './systems/input.ts';
import kv from 'konva';
import Player from './entities/player/player.ts';
import { NodeConfig } from 'konva/lib/Node';
import Action from './entities/action/action.ts';
import { ActionType } from './entities/action/action.ts';
import ActionManager from './systems/actionManager.ts';
import Slope from './entities/slope/slope.ts';
import { checkLevelClear } from './systems/collision.ts';
import type { Level } from './levels/level.ts';
import { loadLevel } from './scenes/gameScene.ts';

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

	public static readonly ACTION_SEPARATION = 300;
	public static readonly ACTION_Y_OFFSET = 50;

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
	private levels: Level[];
	private currentLevelIndex = 0;
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

		const unit = Game.GRID_UNIT; // 30
		const snap = (val: number) => Math.floor(val / unit) * unit;

		const gridWidth = snap(this.stage.width());
		const centerX = snap(this.stage.width() / 2);
		const floorTop = snap(this.stage.height() - 90);

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

		const platforms = [
			{ x: centerX + 90, rise: 120 },
			{ x: centerX + 300, rise: 210 },
			{ x: centerX + 90, rise: 330 },
			{ x: centerX - 240, rise: 120 },
			{ x: centerX - 450, rise: 210 },
		];

		const tempLevel1: Level = {
			levelId: 1,
			spawnPoint: { x: this.stage.width() / 2, y: this.stage.height() / 2 },
			platforms: [
				{
					upperLeft: { x: 0, y: floorTop },
					width: gridWidth,
					height: 120
				},
				// Temporary test platforms, placed relative to the screen center and
				// the floor's top. Each step rises 120px (under JUMP_HEIGHT) so every
				// one is reachable, and none overlap the player's spawn point.
				...platforms.map(({ x, rise }) => ({
					upperLeft: { x, y: floorTop - rise },
					width: 150,
					height: 30
				}))
			],
			walls: [],
			slopes: [
					{startPoint: {x: 1080, y: 460}, xComponent: 300, yComponent: -90},
					{startPoint: {x: 120, y: 540}, xComponent: 300, yComponent: 0}
			],
			spikes: [],
			actions: [ActionType.COS, ActionType.SIN]
		};

		const tempLevel2: Level = {
			levelId: 2,
			spawnPoint: { x: 100, y: floorTop - 120 },
			platforms: [
				{
					upperLeft: { x: 0, y: floorTop },
					width: gridWidth,
					height: 120
				},
				{ upperLeft: { x: 210, y: floorTop - 90 }, width: 180, height: 30 },
				{ upperLeft: { x: 450, y: floorTop - 210 }, width: 180, height: 30 },
				{ upperLeft: { x: 720, y: floorTop - 150 }, width: 180, height: 30 },
				{ upperLeft: { x: 990, y: floorTop - 240 }, width: 180, height: 30 },
			],
			walls: [],
			slopes: [],
			spikes: [],
			actions: []
		};
		// END TEST PLATFORMS

		this.input = new Input(this.stage.container());
		this.player = new Player(
			this.input, this.stage.width() / 2, this.stage.height() / 2
		);

		// SLOPES AND ACTIONS TEST
		// let cosAction = new Action(this.input, this.actionManager, ActionType.COS, this.stage.width() / 2 - 150, this.stage.height() - 50);
		// let sinAction = new Action(this.input, this.actionManager, ActionType.SIN, this.stage.width() / 2 + 150, this.stage.height() - 50);
		// this.gameLayer.add(cosAction.getSprite());
		// this.gameLayer.add(sinAction.getSprite());

		// let slope1 = new Slope(this.input, 1080, 510, 300, -90);
		// let slope2 = new Slope(this.input, 120, 540, 300, 0);
		// this.slopeArray = [slope1, slope2];
		// this.gameLayer.add(slope1.getSprite());
		// this.gameLayer.add(slope2.getSprite());
		// SLOPES AND ACTIONS TEST END
		
		this.gameLayer.add(this.player.getSprite());

		this.levels = [tempLevel1, tempLevel2];
		[this.slopeArray, this.actionManager] = 
				loadLevel(this.levels[this.currentLevelIndex], 
						  this.gameLayer, this.player);

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

		const playerBox = this.player.getSprite().getClientRect({
			relativeTo: this.gameLayer
		});

		if (checkLevelClear(playerBox, this.stage.width())) {
			if (this.currentLevelIndex + 1 < this.levels.length) {
				this.currentLevelIndex += 1;
				[this.slopeArray, this.actionManager] = 
						loadLevel(this.levels[this.currentLevelIndex], 
								  this.gameLayer, this.player);
			} else {
				window.location.reload();
				return;
			}
		}

		requestAnimationFrame(this.gameLoop);
	}

	public getPlayer() { return this.player; }

	/** Starts the game loop. Call once after constructing the game. */
	public start() {
		this.lastTime = performance.now();
		requestAnimationFrame(this.gameLoop);
	}
}
