import kv from 'konva';
import Player from '../entities/player/player.ts';
import type { Level, Rectangle } from '../levels/level.ts';

export function loadLevel(
	level: Level,
	gameLayer: kv.Layer,
	player: Player
): void {
	gameLayer.find('.solid').forEach((node) => node.destroy());
	gameLayer.find('.slope').forEach((node) => node.destroy());

	const solids: Rectangle[] = [...level.platforms, ...level.walls];
	for (const rect of solids) {
		gameLayer.add(new kv.Rect({
			x: rect.upperLeft.x,
			y: rect.upperLeft.y,
			width: rect.width,
			height: rect.height,
			fill: '#555',
			name: 'solid'
		}));
	}

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

	player.controller.setSpawnPoint(level.spawnPoint.x, level.spawnPoint.y);
	player.controller.respawn();

	player.getSprite().moveToTop();
	gameLayer.batchDraw();
}
