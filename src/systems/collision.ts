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

export type Axis = 'x' | 'y';

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
 * Resolves an entity's new position along a single axis by testing a predictive
 * sweep box against solid obstacle boundaries.
 *
 * If the entity is "stuck" (already overlapping an obstacle beyond the
 * tolerance), the only way out is a jump:
 *  - Horizontal movement is blocked entirely, so the entity can't slide
 *    sideways through the obstacle.
 *  - Downward movement is blocked, so it can't fall through.
 *  - Upward movement (a jump) is allowed.
 *
 * @param box - Current bounding box of the entity before moving.
 * @param delta - Proposed delta along the axis (speed * deltaTime).
 * @param obstacles - Collection of solid obstacle bounding boxes.
 * @param axis - Axis to resolve movement on.
 * @returns The resolved top-left coordinate on `axis` for the entity's bounding box.
 */
export function resolveMovement(
	box: BoundingBox,
	delta: number,
	obstacles: BoundingBox[],
	axis: Axis
): number {
	const pos = axis;
	const size = axis === 'x' ? 'width' : 'height';
	const perpPos = axis === 'x' ? 'y' : 'x';
	const perpSize = axis === 'x' ? 'height' : 'width';

	if (delta === 0) return box[pos];

	// Tolerance threshold for floating-point precision inaccuracies
	const offset = 0.5;

	let target = box[pos] + delta;

	// Predictive sweep box spanning the full trajectory of the step.
	// Inset on the perpendicular axis by the tolerance so a surface the box is
	// merely brushing alongside doesn't register as a blocker.
	const sweepBox: BoundingBox = {
		...box,
		[perpPos]: box[perpPos] + offset,
		[perpSize]: box[perpSize] - offset * 2,
		[pos]: delta > 0 ? box[pos] : target,
		[size]: box[size] + Math.abs(delta),
	} as BoundingBox;

	for (const obstacle of obstacles) {
		// Stuck (overlapping beyond tolerance): only an upward jump is allowed.
		if (checkAABBCollision(box, obstacle, offset)) {
			// No horizontal movement and no falling deeper
			if (axis === 'x' || delta > 0) return box[pos];
			continue;
		}

		if (checkAABBCollision(sweepBox, obstacle)) {
			if (delta > 0) {
				// Leading edge already deeper than tolerance inside: ignore.
				if (box[pos] + box[size] > obstacle[pos] + offset) {
					continue;
				}
				// Clamp the leading edge flush to the obstacle's near face
				target = Math.min(target, obstacle[pos] - box[size]);
			} else {
				if (box[pos] < obstacle[pos] + obstacle[size] - offset) {
					continue;
				}
				target = Math.max(target, obstacle[pos] + obstacle[size]);
			}

			// Shrink the sweep envelope to the newly clamped boundary
			sweepBox[pos] = delta > 0 ? box[pos] : target;
			sweepBox[size] = box[size] + Math.abs(target - box[pos]);
		}
	}

	return target;
}

export function resolveHorizontalMovement(
	box: BoundingBox,
	dx: number,
	obstacles: BoundingBox[]
): number {
	return resolveMovement(box, dx, obstacles, 'x');
}

export function resolveVerticalMovement(
	box: BoundingBox,
	dy: number,
	obstacles: BoundingBox[]
): number {
	return resolveMovement(box, dy, obstacles, 'y');
}
