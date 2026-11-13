import { describe, expect, it } from 'vitest';
import {
	checkAABBCollision,
	resolveHorizontalMovement,
	resolveMovement,
	resolveVerticalMovement,
	type BoundingBox,
} from '../../src/systems/collision';

describe('Collision System - checkAABBCollision', () => {
	const baseBox: BoundingBox = { x: 100, y: 100, width: 50, height: 100 };

	it('detects standard overlapping bounding boxes', () => {
		const overlapping: BoundingBox = { x: 120, y: 120, width: 50, height: 50 };
		expect(checkAABBCollision(baseBox, overlapping)).toBe(true);
	});

	it('returns false for completely separated boxes', () => {
		const separated: BoundingBox = { x: 300, y: 300, width: 50, height: 50 };
		expect(checkAABBCollision(baseBox, separated)).toBe(false);
	});

	it('returns false when box edges merely touch without penetration', () => {
		const touchingRight: BoundingBox = { x: 150, y: 100, width: 50, height: 100 };
		expect(checkAABBCollision(baseBox, touchingRight)).toBe(false);
	});

	it('returns false for diagonal corner-touching boxes', () => {
		const touchingCorner: BoundingBox = { x: 150, y: 200, width: 50, height: 50 };
		expect(checkAABBCollision(baseBox, touchingCorner)).toBe(false);
	});

	it('returns false when boxes overlap in X but are separated in Y', () => {
		const above: BoundingBox = { x: 100, y: 0, width: 50, height: 50 };
		expect(checkAABBCollision(baseBox, above)).toBe(false);
	});

	it('detects collision when one box completely encloses another', () => {
		const enclosingBox: BoundingBox = { x: 50, y: 50, width: 200, height: 200 };
		expect(checkAABBCollision(baseBox, enclosingBox)).toBe(true);
	});
});

describe('Collision System - resolveHorizontalMovement', () => {
	// Player spans from x: 100 to 150, y: 100 to 200
	const playerBox: BoundingBox = { x: 100, y: 100, width: 50, height: 100 };

	it('allows unhindered movement when there are no obstacles', () => {
		const dx = 25;
		const resolvedX = resolveHorizontalMovement(playerBox, dx, []);
		expect(resolvedX).toBe(125);
	});

	it('returns current X immediately when displacement dx is 0', () => {
		const wall: BoundingBox = { x: 130, y: 100, width: 40, height: 100 };
		const resolvedX = resolveHorizontalMovement(playerBox, 0, [wall]);
		expect(resolvedX).toBe(100);
	});

	it('allows movement when an obstacle is ahead but beyond the step reach', () => {
		const farWall: BoundingBox = { x: 200, y: 100, width: 30, height: 100 };
		const dx = 20; // reaches x: 120 (right edge: 170, does not reach 200)
		const resolvedX = resolveHorizontalMovement(playerBox, dx, [farWall]);
		expect(resolvedX).toBe(120);
	});

	it('stops player when moving right into a solid obstacle', () => {
		const wall: BoundingBox = { x: 170, y: 100, width: 40, height: 100 };
		const dx = 50; // would reach x: 150 (right edge 200, intersects wall at 170)
		const resolvedX = resolveHorizontalMovement(playerBox, dx, [wall]);
		// Clamped: wall.x - player.width = 170 - 50 = 120
		expect(resolvedX).toBe(120);
	});

	it('stops player when moving left into a solid obstacle', () => {
		const wall: BoundingBox = { x: 20, y: 100, width: 60, height: 100 };
		const dx = -40; // would reach x: 60 (intersects right face of wall at 80)
		const resolvedX = resolveHorizontalMovement(playerBox, dx, [wall]);
		// Clamped: wall.x + wall.width = 20 + 60 = 80
		expect(resolvedX).toBe(80);
	});

	it('stops at the closest obstacle when multiple obstacles lie along the path', () => {
		const wall1: BoundingBox = { x: 160, y: 100, width: 30, height: 100 };
		const wall2: BoundingBox = { x: 220, y: 100, width: 30, height: 100 };
		const dx = 100; // tries to leap past both

		const resolvedX = resolveHorizontalMovement(playerBox, dx, [wall1, wall2]);
		// Stopped by wall1: 160 - 50 = 110
		expect(resolvedX).toBe(110);
	});

	it('prevents tunneling through thin obstacles during high-speed movement', () => {
		// Thin wall at x: 200 with width: 5
		const thinWall: BoundingBox = { x: 200, y: 100, width: 5, height: 100 };
		const dx = 200; // Large step that would overshoot the wall to x: 300
		const resolvedX = resolveHorizontalMovement(playerBox, dx, [thinWall]);
		expect(resolvedX).toBe(150); // 200 - 50 = 150
	});

	it('ignores obstacles that align horizontally on X but are separated on Y', () => {
		const groundBelow: BoundingBox = { x: 120, y: 250, width: 50, height: 50 };
		const dx = 30;
		const resolvedX = resolveHorizontalMovement(playerBox, dx, [groundBelow]);
		expect(resolvedX).toBe(130);
	});

	it('blocks walking right while stuck inside an obstacle (only jumping is allowed)', () => {
		// Player starts at 100..150; obstacle is behind/enclosing left half: 50..120
		const overlappedWall: BoundingBox = { x: 50, y: 100, width: 70, height: 100 };
		const dx = 10;
		const resolvedX = resolveHorizontalMovement(playerBox, dx, [overlappedWall]);
		expect(resolvedX).toBe(100);
	});

	it('blocks walking left while stuck inside an obstacle (only jumping is allowed)', () => {
		// Player starts at 100..150; obstacle overlaps right half: 120..220
		const overlappedWall: BoundingBox = { x: 120, y: 100, width: 100, height: 100 };
		const dx = -10;
		const resolvedX = resolveHorizontalMovement(playerBox, dx, [overlappedWall]);
		expect(resolvedX).toBe(100);
	});

	it('blocks player when trying to push deeper into an already-overlapped obstacle', () => {
		// Player starts at 100..150; obstacle is in front at 120..220
		const overlappedWall: BoundingBox = { x: 120, y: 100, width: 100, height: 100 };
		const dx = 20; // tries to push further right into the obstacle
		const resolvedX = resolveHorizontalMovement(playerBox, dx, [overlappedWall]);
		// Stuck: horizontal movement is blocked entirely, stays at 100
		expect(resolvedX).toBe(100);
	});

	// --- FLOATING-POINT PRECISION & VARIANCE EDGE CASES ---

	it('prevents phasing through a wall when stopped a microscopic fraction inside it', () => {
		// Player width is 50, stopped with right edge at 150.0000001 (x = 100.0000001)
		const microscopicPenetrationBox: BoundingBox = {
			x: 100.0000001,
			y: 100,
			width: 50,
			height: 100,
		};
		// Wall begins at x: 150
		const wall: BoundingBox = { x: 150, y: 100, width: 40, height: 100 };
		const dx = 10; // Player continues pushing right into the wall

		const resolvedX = resolveHorizontalMovement(microscopicPenetrationBox, dx, [wall]);

		// Must remain clamped to 150 - 50 = 100 instead of advancing to 110.0000001
		expect(resolvedX).toBe(100);
	});

	it('consistently blocks movement across 1,000 fractional floating-point steps', () => {
		const wall: BoundingBox = { x: 150, y: 100, width: 40, height: 100 };
		const playerWidth = 50;

		for (let i = 0; i < 1000; i++) {
			// Generate fractional positions near the contact boundary: [149.999999 to 150.000001] - width
			const randomFraction = 150 + (Math.random() * 0.000002 - 0.000001) - playerWidth;
			const box: BoundingBox = {
				x: randomFraction,
				y: 100,
				width: playerWidth,
				height: 100,
			};

			const randomDx = 5 + Math.random() * 10; // Random positive push (speed * deltaTime)
			const resolvedX = resolveHorizontalMovement(box, randomDx, [wall]);

			// If the entity ever phases through, resolvedX exceeds wall.x - playerWidth (100)
			expect(resolvedX).toBeLessThanOrEqual(100);
		}
	});
});

describe('Collision System - resolveVerticalMovement', () => {
	// Player spans from x: 100 to 150, y: 100 to 200
	const playerBox: BoundingBox = { x: 100, y: 100, width: 50, height: 100 };

	it('allows unhindered falling when there are no obstacles', () => {
		const dy = 25; // falling downwards
		const resolvedY = resolveVerticalMovement(playerBox, dy, []);
		expect(resolvedY).toBe(125);
	});

	it('allows unhindered upward movement when jumping into open space', () => {
		const dy = -25; // moving upwards
		const resolvedY = resolveVerticalMovement(playerBox, dy, []);
		expect(resolvedY).toBe(75);
	});

	it('returns current Y immediately when displacement dy is 0', () => {
		const floor: BoundingBox = { x: 80, y: 220, width: 100, height: 20 };
		const resolvedY = resolveVerticalMovement(playerBox, 0, [floor]);
		expect(resolvedY).toBe(100);
	});

	it('allows movement when an obstacle is below but beyond the step reach', () => {
		const farFloor: BoundingBox = { x: 80, y: 250, width: 100, height: 20 };
		const dy = 30; // reaches y: 130 (bottom edge: 230, does not reach 250)
		const resolvedY = resolveVerticalMovement(playerBox, dy, [farFloor]);
		expect(resolvedY).toBe(130);
	});

	it('stops falling player flush on top of a solid floor obstacle', () => {
		// Floor surface is at y: 220. Player bottom is at y: 200.
		const floor: BoundingBox = { x: 80, y: 220, width: 100, height: 40 };
		const dy = 50; // would reach y: 150 (bottom edge: 250, penetrates floor)

		const resolvedY = resolveVerticalMovement(playerBox, dy, [floor]);
		// Clamped: floor.y - player.height = 220 - 100 = 120
		expect(resolvedY).toBe(120);
	});

	it('stops jumping player flush against an overhead ceiling', () => {
		// Ceiling underside is at y: 60 (spans y: 20 to 60). Player top is at y: 100.
		const ceiling: BoundingBox = { x: 80, y: 20, width: 100, height: 40 };
		const dy = -60; // would reach y: 40 (penetrates ceiling underside)

		const resolvedY = resolveVerticalMovement(playerBox, dy, [ceiling]);
		// Clamped: ceiling.y + ceiling.height = 20 + 40 = 60
		expect(resolvedY).toBe(60);
	});

	it('lands on the closest floor when falling past multiple stacked platforms', () => {
		const highPlatform: BoundingBox = { x: 80, y: 230, width: 100, height: 20 };
		const lowPlatform: BoundingBox = { x: 80, y: 300, width: 100, height: 20 };
		const dy = 250; // High downward speed

		const resolvedY = resolveVerticalMovement(playerBox, dy, [highPlatform, lowPlatform]);
		// Must stop at the higher platform: 230 - 100 = 130
		expect(resolvedY).toBe(130);
	});

	it('prevents tunneling through thin horizontal platforms during high-speed drops', () => {
		// Thin platform (height: 5px) at y: 250
		const thinPlatform: BoundingBox = { x: 80, y: 250, width: 100, height: 5 };
		const dy = 300; // Leap that would overshoot past the platform to y: 400

		const resolvedY = resolveVerticalMovement(playerBox, dy, [thinPlatform]);
		// Clamps flush to top face: 250 - 100 = 150
		expect(resolvedY).toBe(150);
	});

	it('ignores obstacles that align on Y but are separated on X', () => {
		// Wall to the far right (x: 300) along the falling path
		const sideWall: BoundingBox = { x: 300, y: 150, width: 50, height: 100 };
		const dy = 40;

		const resolvedY = resolveVerticalMovement(playerBox, dy, [sideWall]);
		expect(resolvedY).toBe(140);
	});

	// --- OVERLAP & PRECISION EDGE CASES ---

	it('allows player to jump upward freely when already slightly overlapping a floor below', () => {
		// Floor partially overlaps bottom of player (floor top is at y: 190, player bottom at 200)
		const overlappedFloor: BoundingBox = { x: 80, y: 190, width: 100, height: 40 };
		const dy = -15; // Jumping up out of the floor

		const resolvedY = resolveVerticalMovement(playerBox, dy, [overlappedFloor]);
		// Steps up into open air without snapping downwards
		expect(resolvedY).toBe(85);
	});

	it('blocks falling while stuck inside a ceiling above (only jumping is allowed)', () => {
		// Ceiling overlaps top of player (ceiling underside at y: 110, player top at 100)
		const overlappedCeiling: BoundingBox = { x: 80, y: 50, width: 100, height: 60 };
		const dy = 15; // Trying to fall down

		const resolvedY = resolveVerticalMovement(playerBox, dy, [overlappedCeiling]);
		expect(resolvedY).toBe(100);
	});

	it('prevents phasing through a floor when stopped a microscopic fraction inside it', () => {
		// Player height is 100, stopped with bottom edge at 200.0000001 (y = 100.0000001)
		const microscopicPenetrationBox: BoundingBox = {
			x: 100,
			y: 100.0000001,
			width: 50,
			height: 100,
		};
		// Floor begins at y: 200
		const floor: BoundingBox = { x: 80, y: 200, width: 100, height: 40 };
		const dy = 10; // Continues pushing downward into the floor

		const resolvedY = resolveVerticalMovement(microscopicPenetrationBox, dy, [floor]);

		// Must remain clamped to 200 - 100 = 100 instead of advancing downward
		expect(resolvedY).toBe(100);
	});

	it('consistently blocks downward movement across 1,000 fractional floating-point steps', () => {
		const floor: BoundingBox = { x: 80, y: 200, width: 100, height: 40 };
		const playerHeight = 100;

		for (let i = 0; i < 1000; i++) {
			// Generate fractional positions near the floor contact boundary: [199.999999 to 200.000001] - height
			const randomFraction = 200 + (Math.random() * 0.000002 - 0.000001) - playerHeight;
			const box: BoundingBox = {
				x: 100,
				y: randomFraction,
				width: 50,
				height: playerHeight,
			};

			const randomDy = 5 + Math.random() * 10; // Random positive push downward
			const resolvedY = resolveVerticalMovement(box, randomDy, [floor]);

			// If the entity ever phases through, resolvedY exceeds floor.y - playerHeight (100)
			expect(resolvedY).toBeLessThanOrEqual(100);
		}
	});
});

describe('Collision System - tolerance and straddle cases', () => {
	// Player spans x: 100..150, y: 100..200
	const playerBox: BoundingBox = { x: 100, y: 100, width: 50, height: 100 };

	it('checkAABBCollision ignores overlaps smaller than offset', () => {
		const shallow: BoundingBox = { x: 149.7, y: 100, width: 50, height: 100 }; // 0.3 overlap
		const deep: BoundingBox = { x: 149, y: 100, width: 50, height: 100 };      // 1.0 overlap
		expect(checkAABBCollision(playerBox, shallow, 0)).toBe(true);
		expect(checkAABBCollision(playerBox, shallow, 0.5)).toBe(false);
		expect(checkAABBCollision(playerBox, deep, 0.5)).toBe(true);
	});

	it('walks over a sliver that is inside the box x-range (moving right)', () => {
		const sliver: BoundingBox = { x: 115, y: 199.7, width: 20, height: 40 };
		expect(resolveHorizontalMovement(playerBox, 5, [sliver])).toBe(105);
	});

	it('walks over a sliver that is inside the box x-range (moving left)', () => {
		const sliver: BoundingBox = { x: 115, y: 199.7, width: 20, height: 40 };
		expect(resolveHorizontalMovement(playerBox, -5, [sliver])).toBe(95);
	});

	it('does not snap when straddling a right face and reversing back in', () => {
		// Obstacle right face at x: 110; box left edge is 10px inside, right edge outside
		const wide: BoundingBox = { x: 50, y: 199.7, width: 60, height: 40 };
		expect(resolveHorizontalMovement(playerBox, -5, [wide])).toBe(95);
		expect(resolveHorizontalMovement(playerBox, 5, [wide])).toBe(105);
	});

	it('stays put when exactly flush against a wall and pushing into it', () => {
		const wallRight: BoundingBox = { x: 150, y: 100, width: 40, height: 100 };
		const wallLeft: BoundingBox = { x: 50, y: 100, width: 50, height: 100 };
		expect(resolveHorizontalMovement(playerBox, 10, [wallRight])).toBe(100);
		expect(resolveHorizontalMovement(playerBox, -10, [wallLeft])).toBe(100);
	});

	it('is order independent when several walls are ahead (right)', () => {
		const wall1: BoundingBox = { x: 160, y: 100, width: 30, height: 100 };
		const wall2: BoundingBox = { x: 220, y: 100, width: 30, height: 100 };
		expect(resolveHorizontalMovement(playerBox, 100, [wall2, wall1])).toBe(110);
	});

	it('stops at the nearest wall when moving left with several walls', () => {
		const near: BoundingBox = { x: 60, y: 100, width: 30, height: 100 };  // right face 90
		const far: BoundingBox = { x: 10, y: 100, width: 30, height: 100 };
		expect(resolveHorizontalMovement(playerBox, -100, [near, far])).toBe(90);
		expect(resolveHorizontalMovement(playerBox, -100, [far, near])).toBe(90);
	});

	// REQUIRES the horizontal sweep inset (y: box.y + offset, height: box.height - offset * 2)
	it('does not snag on the seam between two slightly sunk floor tiles', () => {
		const tile1: BoundingBox = { x: 80, y: 199.7, width: 70, height: 40 };
		const tile2: BoundingBox = { x: 150, y: 199.7, width: 70, height: 40 };
		expect(resolveHorizontalMovement(playerBox, 5, [tile1, tile2])).toBe(105);
	});

	it('pushes the box up flush when resting with a sub-tolerance sink', () => {
		const floor: BoundingBox = { x: 80, y: 199.7, width: 100, height: 40 };
		expect(resolveVerticalMovement(playerBox, 5, [floor])).toBeCloseTo(99.7, 10);
	});

	it('stays put when exactly flush on a floor, and under a ceiling', () => {
		const floor: BoundingBox = { x: 80, y: 200, width: 100, height: 40 };
		const ceiling: BoundingBox = { x: 80, y: 60, width: 100, height: 40 }; // underside at 100
		expect(resolveVerticalMovement(playerBox, 5, [floor])).toBe(100);
		expect(resolveVerticalMovement(playerBox, -5, [ceiling])).toBe(100);
	});

	it('can jump straight off a floor it is standing flush on', () => {
		const floor: BoundingBox = { x: 80, y: 200, width: 100, height: 40 };
		expect(resolveVerticalMovement(playerBox, -5, [floor])).toBe(95);
	});

	// REQUIRES the vertical x inset (x: box.x + offset, width: box.width - offset * 2)
	it('does not land on the corner of a wall it only brushes by 0.3px', () => {
		const wall: BoundingBox = { x: 149.7, y: 200, width: 50, height: 100 };
		expect(resolveVerticalMovement(playerBox, 20, [wall])).toBe(120);
	});

	it('is order independent when falling past several floors', () => {
		const high: BoundingBox = { x: 80, y: 230, width: 100, height: 20 };
		const low: BoundingBox = { x: 80, y: 300, width: 100, height: 20 };
		expect(resolveVerticalMovement(playerBox, 250, [low, high])).toBe(130);
	});

	it('stops at the nearest ceiling when jumping with several overhead', () => {
		const near: BoundingBox = { x: 80, y: 40, width: 100, height: 20 };  // underside 60
		const far: BoundingBox = { x: 80, y: -50, width: 100, height: 20 };
		expect(resolveVerticalMovement(playerBox, -100, [far, near])).toBe(60);
	});
});

describe('Collision System - escape-only rules for overlapped obstacles', () => {
	// Player spans x: 100..150, y: 100..200
	const playerBox: BoundingBox = { x: 100, y: 100, width: 50, height: 100 };

	// Floor top at 199.4, so the player is sunk 0.6px (beyond the 0.5 offset)
	const sunkFloor: BoundingBox = { x: 80, y: 199.4, width: 100, height: 40 };

	it('blocks falling when sunk beyond the tolerance into a floor', () => {
		expect(resolveVerticalMovement(playerBox, 5, [sunkFloor])).toBe(100);
	});

	it('allows jumping out when sunk into a floor', () => {
		expect(resolveVerticalMovement(playerBox, -5, [sunkFloor])).toBe(95);
	});

	it('blocks walking sideways in both directions when sunk into a floor', () => {
		expect(resolveHorizontalMovement(playerBox, 5, [sunkFloor])).toBe(100);
		expect(resolveHorizontalMovement(playerBox, -5, [sunkFloor])).toBe(100);
	});

	it('when stuck in a corner overlap, only the upward jump is allowed', () => {
		const corner: BoundingBox = { x: 145, y: 190, width: 55, height: 40 };
		expect(resolveHorizontalMovement(playerBox, 5, [corner])).toBe(100);
		expect(resolveHorizontalMovement(playerBox, -5, [corner])).toBe(100);
		expect(resolveVerticalMovement(playerBox, 5, [corner])).toBe(100);
		expect(resolveVerticalMovement(playerBox, -5, [corner])).toBe(95);
	});

	it('resolveMovement matches the horizontal and vertical wrappers', () => {
		expect(resolveMovement(playerBox, 5, [sunkFloor], 'y')).toBe(
			resolveVerticalMovement(playerBox, 5, [sunkFloor])
		);
		expect(resolveMovement(playerBox, 5, [sunkFloor], 'x')).toBe(
			resolveHorizontalMovement(playerBox, 5, [sunkFloor])
		);
	});
});
