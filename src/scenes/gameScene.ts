import kv from 'konva';
import Player from '../entities/player/player.ts';
import Platform from '../entities/platform/platform.ts';
import SpikesModel from '../entities/spikes/spikesModel.ts';
import type { Level } from '../levels/level.ts';

export function loadLevel(
	level: Level,
	gameLayer: kv.Layer,
	player: Player
): void {
	gameLayer.find('.solid').forEach((node) => node.destroy());
	gameLayer.find('.slope').forEach((node) => node.destroy());
	gameLayer.find('.spikes').forEach((node) => node.destroy());

	const stageWidth = gameLayer.getStage()?.width() ?? 1280;
	const stageHeight = gameLayer.getStage()?.height() ?? 720;

	// Invisible left-edge boundary wall (x: -40..0) spanning full screen height
	// Stops the player's leftmost edge flush at x = 0 so the sprite never clips off-screen
	gameLayer.add(new kv.Rect({
		x: -40,
		y: 0,
		width: 40,
		height: stageHeight,
		name: 'solid'
	}));

	// Bottom dungeon spikes (30px tall at the bottom of the screen)
	const spikeHeight = 30;
	gameLayer.add(new kv.Rect({
		x: 0,
		y: stageHeight - spikeHeight,
		width: stageWidth,
		height: spikeHeight,
		fill: '#c53030',
		name: 'spikes'
	}));

	for (const rect of [...level.platforms, ...level.walls]) {
		const platform = new Platform(
			rect.upperLeft.x, rect.upperLeft.y, rect.width, rect.height
		);
		gameLayer.add(platform.getSprite());
	}

	// Holder for slopes until implemented
	for (const slope of level.slopes) {
		gameLayer.add(new kv.Line({
			points: [
				slope.startPoint.x,
				slope.startPoint.y,
				slope.startPoint.x + slope.xComponent,
				slope.startPoint.y + slope.yComponent
			],
			stroke: '#e4cece',
			strokeWidth: 4,
			name: 'slope'
		}));
	}

	for (const row of level.spikes) {
		const spikes = new SpikesModel(row.upperLeft.x, row.upperLeft.y, row.width);
		gameLayer.add(spikes.getSprite());
	}

	player.controller.setSpawn(level.spawnPoint.x, level.spawnPoint.y);
	player.controller.respawn();

	player.getSprite().moveToTop();
	gameLayer.batchDraw();
}
