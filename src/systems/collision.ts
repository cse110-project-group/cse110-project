/**
 * Represents an unrotated rectangular boundary in 2D coordinate space.
 * Compatible with Konva's IRect returned by getClientRect().
 */
export interface BoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

/**
 * Determines whether two axis-aligned bounding boxes overlap.
 *
 * @param a - First bounding box to test.
 * @param b - Second bounding box to test.
 * @param offset - Minimum overlap depth required to count as a collision.
 * @returns True if the boxes intersect on both axes beyond the offset, otherwise false.
 */
export function checkAABBCollision(
    a: BoundingBox,
    b: BoundingBox,
    offset: number = 0
): boolean {
    return (
        a.x < b.x + b.width - offset &&
        a.x + a.width > b.x + offset &&
        a.y < b.y + b.height - offset &&
        a.y + a.height > b.y + offset
    );
}

/**
 * Calculates an entity's new horizontal position by testing a predictive sweep box
 * against solid obstacle boundaries.
 *
 * Uses a collision skin offset to prevent floating-point inaccuracies
 * from registering surface contact as an internal overlap.
 *
 * @param box - Current bounding box of the entity before moving.
 * @param dx - Proposed horizontal delta (speed * deltaTime).
 * @param obstacles - Collection of solid obstacle bounding boxes.
 * @returns The resolved top-left X coordinate for the entity's bounding box.
 */
export function resolveHorizontalMovement(
    box: BoundingBox,
    dx: number,
    obstacles: BoundingBox[]
): number {
    if (dx === 0) return box.x;

    // Half-pixel tolerance offset for floating-point precision
    const offset = 0.5;

    let targetX = box.x + dx;

    // Predictive sweep box spanning the full trajectory of the step.
    const sweepBox: BoundingBox = {
        x: dx > 0 ? box.x : targetX,
        y: box.y,
        width: box.width + Math.abs(dx),
        height: box.height,
    };

    for (const obstacle of obstacles) {
        if (checkAABBCollision(box, obstacle, offset)) {
            continue;
        }

        if (checkAABBCollision(sweepBox, obstacle)) {
            if (dx > 0) {
                targetX = Math.min(targetX, obstacle.x - box.width);
            } else if (dx < 0) {
                targetX = Math.max(targetX, obstacle.x + obstacle.width);
            }

			// Shrink the sweep envelope to the newly clamped boundary
            sweepBox.x = dx > 0 ? box.x : targetX;
            sweepBox.width = box.width + Math.abs(targetX - box.x);
        }
    }

    return targetX;
}