import Input from './systems/input.ts';
import kv from 'konva';
import Player from './entities/player/player.ts';
import { BoundingBox, checkLevelClear } from './systems/collision.ts';

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
    /** Collection of solid bounding boxes for platforms/walls in the level. */
    private obstacles: BoundingBox[] = [];
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

        this.input = new Input();
        this.player = new Player(
            this.input, this.stage.width() / 4, this.stage.height() / 2
        );

        this.gameLayer.add(this.player.getSprite());

        // --- Temporary Test Wall ---
        // Places a brown obstacle block directly in the center path
        const wall = new kv.Rect({
            x: this.stage.width() / 2,
            y: this.stage.height() / 2 - 50,
            width: 50,
            height: 100,
            fill: '#8b5a2b',
        });
        this.gameLayer.add(wall);
        this.obstacles.push({
            x: wall.x(),
            y: wall.y(),
            width: wall.width(),
            height: wall.height()
        });
        // ---------------------------

        this.gameLayer.draw();
    }

    /**
     * Runs once per animation frame: computes the time since the last frame
     * (in seconds, capped at {@link Game.MAX_DELTA_TIME}) and updates every
     * entity with it, then schedules itself
     * again. Konva redraws the layer automatically when shapes change.
     *
     * @param time High-resolution timestamp from `requestAnimationFrame`.
     */
    private gameLoop = (time: number) => {
        const deltaTime = Math.min(
            Game.MAX_DELTA_TIME,
            Math.max(0, (time - this.lastTime) / 1000)
        );
        this.lastTime = time;

        // 1. Move player and resolve collisions against obstacles
        this.player.update(deltaTime, this.obstacles);

        // 2. Check if player has run past the right side of the screen
        if (checkLevelClear(this.player.getBoundingBox(), this.stage.width())) {
            console.log('Level Complete! Player reached the right edge.');
        }

        requestAnimationFrame(this.gameLoop);
    }

    /** Starts the game loop. Call once after constructing the game. */
    public start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }
}