import { describe, expect, it } from 'vitest';
import {
  checkAABBCollision,
  resolveHorizontalMovement,
  checkLevelClear,
  isValidPlatformProjection,
  type BoundingBox,
  type PlatformConstraints,
} from '../../src/systems/collision';

describe('Collision System - checkAABBCollision', () => {
  const baseBox: BoundingBox = { x: 100, y: 100, width: 50, height: 100 };

  it('detects overlapping bounding boxes', () => {
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

  it('returns false when boxes overlap in X but are separated in Y', () => {
    const above: BoundingBox = { x: 100, y: 0, width: 50, height: 50 };
    expect(checkAABBCollision(baseBox, above)).toBe(false);
  });
});

describe('Collision System - resolveHorizontalMovement', () => {
  const playerBox: BoundingBox = { x: 100, y: 100, width: 50, height: 100 };

  it('allows unhindered movement when there are no obstacles', () => {
    const dx = 25;
    const resolvedX = resolveHorizontalMovement(playerBox, dx, []);
    expect(resolvedX).toBe(125);
  });

  it('stops player when moving right into a solid obstacle', () => {
    const wall: BoundingBox = { x: 130, y: 100, width: 40, height: 100 };
    const dx = 50;
    const resolvedX = resolveHorizontalMovement(playerBox, dx, [wall]);
    expect(resolvedX).toBe(80);
  });

  it('stops player when moving left into a solid obstacle', () => {
    const wall: BoundingBox = { x: 20, y: 100, width: 60, height: 100 };
    const dx = -40;
    const resolvedX = resolveHorizontalMovement(playerBox, dx, [wall]);
    expect(resolvedX).toBe(80);
  });

  it('stops at the closest obstacle when multiple obstacles are along the path', () => {
    const wall1: BoundingBox = { x: 130, y: 100, width: 30, height: 100 };
    const wall2: BoundingBox = { x: 180, y: 100, width: 30, height: 100 };
    const dx = 100;

    const resolvedX = resolveHorizontalMovement(playerBox, dx, [wall1, wall2]);
    expect(resolvedX).toBe(80);
  });

});

describe('Collision System - checkLevelClear', () => {
  const stageWidth = 800;

  it('returns false when player is still inside the screen', () => {
    const insideBox: BoundingBox = { x: 740, y: 100, width: 50, height: 100 };
    expect(checkLevelClear(insideBox, stageWidth)).toBe(false);
  });

  it('returns true when player has crossed the right edge of the stage', () => {
    const exitedBox: BoundingBox = { x: 800, y: 100, width: 50, height: 100 };
    expect(checkLevelClear(exitedBox, stageWidth)).toBe(true);
  });
});

describe('Collision System - isValidPlatformProjection', () => {
  const constraints: PlatformConstraints = {
    maxWidth: 300,
    startZoneRightEdge: 100,
    exitZoneLeftEdge: 700,
  };

  it('accepts valid platforms within puzzle limits', () => {
    const validPlatform: BoundingBox = { x: 200, y: 300, width: 150, height: 20 };
    expect(isValidPlatformProjection(validPlatform, constraints)).toBe(true);
  });

  it('rejects platforms exceeding maximum span width', () => {
    const tooLong: BoundingBox = { x: 200, y: 300, width: 350, height: 20 };
    expect(isValidPlatformProjection(tooLong, constraints)).toBe(false);
  });

  it('rejects platforms bridging directly from start zone to exit threshold', () => {
    const bridge: BoundingBox = { x: 50, y: 300, width: 700, height: 20 };
    expect(isValidPlatformProjection(bridge, constraints)).toBe(false);
  });
});