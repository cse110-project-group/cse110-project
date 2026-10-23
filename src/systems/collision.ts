/**
 * Represents an unrotated rectangular boundary in 2D coordinate space.
 */
export interface BoundingBox {
  /** Top-left X coordinate, in pixels. */
  x: number;
  /** Top-left Y coordinate, in pixels. */
  y: number;
  /** Horizontal span of the box, in pixels. */
  width: number;
  /** Vertical span of the box, in pixels. */
  height: number;
}

/**
 * Platform validation rules to prevent "cheesing" levels.
 */
export interface PlatformConstraints {
  maxWidth: number;
  startZoneRightEdge: number;
  exitZoneLeftEdge: number;
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
 * Calculates a player's new horizontal position, clamping the value against
 * obstacle boundaries and the left screen edge (x = 0).
 *
 * @param box Current top-left bounding box of the player prior to moving.
 * @param dx Proposed horizontal delta (speed * deltaTime), in pixels.
 * @param obstacles Collection of solid bounding boxes present in the room.
 * @returns The resolved top-left X coordinate after collision clamping.
 */
export function resolveHorizontalMovement(
  box: BoundingBox,
  dx: number,
  obstacles: BoundingBox[]
): number {
  let targetX = box.x + dx;

  if (dx > 0) {
    // Moving RIGHT: sweep box from original position to intended target
    const sweepBox: BoundingBox = {
      x: box.x,
      y: box.y,
      width: box.width + dx,
      height: box.height,
    };

    for (const obstacle of obstacles) {
      if (checkAABBCollision(sweepBox, obstacle)) {
        // Player's right edge must stop at obstacle's left edge
        targetX = Math.min(targetX, obstacle.x - box.width);
      }
    }
  } else if (dx < 0) {
    // Moving LEFT: sweep box from intended target to original right edge
    const sweepBox: BoundingBox = {
      x: box.x + dx,
      y: box.y,
      width: box.width - dx,
      height: box.height,
    };

    for (const obstacle of obstacles) {
      if (checkAABBCollision(sweepBox, obstacle)) {
        // Player's left edge must stop at obstacle's right edge
        targetX = Math.max(targetX, obstacle.x + obstacle.width);
      }
    }
  }

  return targetX;
}
/**
 * Checks if the player has completely run off the right edge of the stage.
 */
export function checkLevelClear(box: BoundingBox, stageWidth: number): boolean {
  return box.x >= stageWidth;
}

/**
 * Validates that a player-created projection does not bridge start to finish.
 */
export function isValidPlatformProjection(
  platform: BoundingBox,
  constraints: PlatformConstraints
): boolean {
  if (platform.width > constraints.maxWidth) return false;
  const touchesStart = platform.x <= constraints.startZoneRightEdge;
  const reachesGoal = platform.x + platform.width >= constraints.exitZoneLeftEdge;
  return !(touchesStart && reachesGoal);
}