import kv from 'konva';
import Player from '../entities/player/player.ts';
import Platform from '../entities/platform/platform.ts';
import SpikesModel from '../entities/spikes/spikesModel.ts';
import type { Level } from '../levels/level.ts';
import Slope from '../entities/slope/slope.ts';
import Action from '../entities/action/action.ts';
import ActionManager from '../systems/actionManager.ts';
import Game from '../game.ts';

export function loadLevel(
	level: Level,
	gameLayer: kv.Layer,
	player: Player
): [Slope[], ActionManager] {
	gameLayer.find('.solid').forEach((node) => node.destroy());
	gameLayer.find('.slope').forEach((node) => node.destroy());
	gameLayer.find('.spikes').forEach((node) => node.destroy());
	gameLayer.find('.action').forEach((node) => node.destroy());

	const stageWidth = gameLayer.getStage()?.width() ?? 1280;
	const stageHeight = gameLayer.getStage()?.height() ?? 720;

	let slopeList: Slope[] = [];
	let actionManager = new ActionManager(player.controller.getInput(), player);

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

	for (const slope of level.slopes) {
		let slopeObject = new Slope(slope.startPoint.x,
									slope.startPoint.y,
									slope.xComponent,
									slope.yComponent);
		slopeList.push(slopeObject);
		gameLayer.add(slopeObject.getSprite());
	}

	for (const row of level.spikes) {
		const spikes = new SpikesModel(row.upperLeft.x, 
									   row.upperLeft.y, 
									   row.width);
		gameLayer.add(spikes.getSprite());
	}

	const actionCount = level.actions.length;
	for (let a = 0; a < actionCount; ++a){
		let x = a * Game.ACTION_SEPARATION - 
				Math.max(0, actionCount / 2.0 - 0.5) * Game.ACTION_SEPARATION;
		let actionObject = new Action(player.controller.getInput(), 
									  actionManager, 
									  level.actions[a], 
									  stageWidth / 2 + x, 
									  stageHeight - Game.ACTION_Y_OFFSET);
		console.log(actionObject);
		gameLayer.add(actionObject.getSprite());
	}

	player.controller.setSpawn(level.spawnPoint.x, level.spawnPoint.y);
	player.controller.respawn();

	player.getSprite().moveToTop();
	gameLayer.batchDraw();

	return [slopeList, actionManager];
}
