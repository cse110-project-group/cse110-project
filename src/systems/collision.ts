import kv from 'konva';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Determines whether two axis-aligned bounding boxes overlap.
 */
export function checkAABBCollision(a: BoundingBox, b: BoundingBox): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

/**
 * Calculates a player's new horizontal position using Konva's getClientRect(),
 * clamping the value against obstacles to prevent moving through solid objects.
 *
 * @param playerSprite The Konva shape representing the player.
 * @param dx Proposed horizontal delta (speed * deltaTime).
 * @param obstacles Collection of Konva nodes (e.g. layer.children).
 * @returns The resolved center/anchor X coordinate for the sprite.
 */
export function resolveHorizontalMovement(
  playerSprite: kv.Shape,
  dx: number,
  obstacles: kv.Node[]
): number {
  // Let Konva compute the exact outer bounding box automatically
  const box = playerSprite.getClientRect();

  let targetX = box.x + dx;

  // Predictive sweep box covering the proposed step
  const testBox: BoundingBox = {
    x: dx > 0 ? box.x : targetX,
    y: box.y,
    width: box.width + Math.abs(dx),
    height: box.height,
  };

  for (const node of obstacles) {
    // Ignore the player's own sprite
    if (node === playerSprite) continue;

    const obstacleBox = node.getClientRect();

    if (checkAABBCollision(testBox, obstacleBox)) {
      if (dx > 0) {
        targetX = Math.min(targetX, obstacleBox.x - box.width);
      } else if (dx < 0) {
        targetX = Math.max(targetX, obstacleBox.x + obstacleBox.width);
      }
      testBox.x = dx > 0 ? box.x : targetX;
      testBox.width = box.width + Math.abs(targetX - box.x);
    }
  }

  // Convert the clamped top-left X coordinate back to the sprite's local origin
  const offsetX = playerSprite.x() - box.x;
  return targetX + offsetX;
}