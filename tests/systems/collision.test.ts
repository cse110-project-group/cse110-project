import { describe, expect, it } from 'vitest';
import {
    checkAABBCollision,
    resolveHorizontalMovement,
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


    it('allows player to walk out freely when moving right from an overlapping obstacle behind them', () => {
        // Player starts at 100..150; obstacle is behind/enclosing left half: 50..120
        const overlappedWall: BoundingBox = { x: 50, y: 100, width: 70, height: 100 };
        const dx = 10;
        const resolvedX = resolveHorizontalMovement(playerBox, dx, [overlappedWall]);
        // Steps forward into open air without snapping backward
        expect(resolvedX).toBe(110);
    });

    it('allows player to walk out freely when moving left from an overlapping obstacle ahead of them', () => {
        // Player starts at 100..150; obstacle overlaps right half: 120..220
        const overlappedWall: BoundingBox = { x: 120, y: 100, width: 100, height: 100 };
        const dx = -10;
        const resolvedX = resolveHorizontalMovement(playerBox, dx, [overlappedWall]);
        // Steps back into open air without teleporting across to 220
        expect(resolvedX).toBe(90);
    });

    it('blocks player when trying to push deeper into an already-overlapped obstacle', () => {
        // Player starts at 100..150; obstacle is in front at 120..220
        const overlappedWall: BoundingBox = { x: 120, y: 100, width: 100, height: 100 };
        const dx = 20; // tries to push further right into the obstacle
        const resolvedX = resolveHorizontalMovement(playerBox, dx, [overlappedWall]);
        // Clamped back flush against outer face: 120 - 50 = 70
        expect(resolvedX).toBe(70);
    });
});