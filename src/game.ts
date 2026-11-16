import Input from './systems/input.ts';
import kv from 'konva';
import Player from './entities/player/player.ts';
import { NodeConfig } from 'konva/lib/Node';
import Platform from './entities/platform/platform.ts';
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
    private levels: Level[];
    private currentLevelIndex = 0;
    /** Timestamp of the previous frame, in milliseconds. */
    private lastTime = 0;

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
        const centerX = this.stage.width() / 2;
        const floorTop = this.stage.height() - 50;
        const platforms = [
            { x: centerX + 100, rise: 110 },
            { x: centerX + 300, rise: 220 },
            { x: centerX + 100, rise: 330 },
            { x: centerX - 250, rise: 110 },
            { x: centerX - 450, rise: 220 },
        ];

        const tempLevel1: Level = {
            levelId: 1,
            spawnPoint: { x: this.stage.width() / 2, y: this.stage.height() / 2 },
            platforms: [
                {
                    upperLeft: { x: 0, y: floorTop },
                    width: this.stage.width(),
                    height: 50
                },
                // Temporary test platforms, placed relative to the screen center and
                // the floor's top. Each step rises 110px (under JUMP_HEIGHT) so every
                // one is reachable, and none overlap the player's spawn point.
                ...platforms.map(({ x, rise }) => ({
                    upperLeft: { x, y: floorTop - rise },
                    width: 150,
                    height: 20
                }))
            ],
            walls: [],
            slopes: []
        };

        const tempLevel2: Level = {
            levelId: 2,
            spawnPoint: { x: 100, y: floorTop - 120 },
            platforms: [
                {
                    upperLeft: { x: 0, y: floorTop },
                    width: this.stage.width(),
                    height: 50
                },
                { upperLeft: { x: 200, y: floorTop - 100 }, width: 180, height: 20 },
                { upperLeft: { x: 460, y: floorTop - 200 }, width: 180, height: 20 },
                { upperLeft: { x: 720, y: floorTop - 150 }, width: 180, height: 20 },
                { upperLeft: { x: 980, y: floorTop - 250 }, width: 180, height: 20 },
            ],
            walls: [],
            slopes: []
        };
        // END TEST PLATFORMS

		this.input = new Input(this.stage.container());
        this.player = new Player(
            this.input, this.stage.width() / 2, this.stage.height() / 2
        );

        this.gameLayer.add(this.player.getSprite());

        this.levels = [tempLevel1, tempLevel2];
        loadLevel(this.levels[this.currentLevelIndex], this.gameLayer, this.player);

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

        this.player.update(deltaTime, this.gameLayer.getChildren());

        const playerBox = this.player.getSprite().getClientRect({
            relativeTo: this.gameLayer
        });

        if (checkLevelClear(playerBox, this.stage.width())) {
            if (this.currentLevelIndex + 1 < this.levels.length) {
                this.currentLevelIndex += 1;
                loadLevel(this.levels[this.currentLevelIndex], this.gameLayer, this.player);
            } else {
                window.location.reload();
                return;
            }
        }

        requestAnimationFrame(this.gameLoop);
    }

    /** Starts the game loop. Call once after constructing the game. */
    public start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }
}
