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
 * If the entity already significantly overlaps an obstacle prior to moving,
 * that obstacle is ignored to allow free exit without backwards snapping.
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

	// Tolerance threshold for floating-point precision inaccuracies
	const offset = 0.5;

	let targetX = box.x + dx;

	// Predictive sweep box spanning the full trajectory of the step
	const sweepBox: BoundingBox = {
		x: dx > 0 ? box.x : targetX,
		y: box.y + offset,
		width: box.width + Math.abs(dx),
		height: box.height - offset * 2,
	};

	for (const obstacle of obstacles) {
		if (checkAABBCollision(box, obstacle, offset)) {
			continue;
		}

		if (checkAABBCollision(sweepBox, obstacle)) {
			if (dx > 0) {
				if (box.x + box.width > obstacle.x + offset) {
					continue;
				}
				targetX = Math.min(targetX, obstacle.x - box.width);
			} else if (dx < 0) {
				if (box.x < obstacle.x + obstacle.width - offset) {
					continue;
				}
				targetX = Math.max(targetX, obstacle.x + obstacle.width);
			}

			// Shrink the sweep envelope to the newly clamped boundary
			sweepBox.x = dx > 0 ? box.x : targetX;
			sweepBox.width = box.width + Math.abs(targetX - box.x);
		}
	}

	return targetX;
}

export function resolveVerticalMovement(
	box: BoundingBox,
	dy: number,
	obstacles: BoundingBox[]
): number {
	if (dy === 0) return box.y;

	// Tolerance threshold for floating-point precision inaccuracies
	const offset = 0.5;

	let targetY = box.y + dy;

	// Predictive sweep box spanning the full trajectory of the vertical step.
	// Inset on x by the tolerance so a wall the box is merely brushing
	// alongside (sub-0.5px overlap) doesn't register as a floor or ceiling.
	const sweepBox: BoundingBox = {
		x: box.x + offset,
		y: dy > 0 ? box.y : targetY,
		width: box.width - offset * 2,
		height: box.height + Math.abs(dy),
	};

	for (const obstacle of obstacles) {
		// Already overlapping by more than the tolerance: ignore so the
		// entity can move out without snapping
		if (checkAABBCollision(box, obstacle, offset)) {
			continue;
		}

		if (checkAABBCollision(sweepBox, obstacle)) {
			if (dy > 0) {
				// Falling: leading edge is the bottom. If it is already deeper
				// than the tolerance inside the obstacle, ignore it.
				if (box.y + box.height > obstacle.y + offset) {
					continue;
				}
				// Clamp the bottom edge flush to the obstacle's top face
				targetY = Math.min(targetY, obstacle.y - box.height);
			} else {
				// Rising: leading edge is the top. If it is already deeper
				// than the tolerance inside the obstacle, ignore it.
				if (box.y < obstacle.y + obstacle.height - offset) {
					continue;
				}
				// Clamp the top edge flush to the obstacle's bottom face
				targetY = Math.max(targetY, obstacle.y + obstacle.height);
			}

			// Shrink the sweep envelope to the newly clamped boundary
			sweepBox.y = dy > 0 ? box.y : targetY;
			sweepBox.height = box.height + Math.abs(targetY - box.y);
		}
	}

	return targetY;
}