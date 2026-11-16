import kv from 'konva';
import Player from '../entities/player/player.ts';
import type { Level, Rectangle } from '../levels/level.ts';

export function loadLevel(
    level: Level,
    gameLayer: kv.Layer,
    player: Player
): void {
    gameLayer.find('.solid').forEach((node) => node.destroy());

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

    const sprite = player.getSprite();
    sprite.x(level.spawnPoint.x);
    sprite.y(level.spawnPoint.y);
    sprite.moveToTop();

    gameLayer.batchDraw();
}
