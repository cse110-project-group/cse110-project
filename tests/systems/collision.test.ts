// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import '../helpers/canvasStub.ts';
import kv from 'konva';
import {
  checkAABBCollision,
  resolveHorizontalMovement,
  type BoundingBox,
} from '../../src/systems/collision.ts';

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
  it('allows unhindered movement when there are no obstacles', () => {
    const sprite = new kv.Ellipse({ x: 125, y: 150, radiusX: 25, radiusY: 50 });
    const resolvedX = resolveHorizontalMovement(sprite, 25, []);
    expect(resolvedX).toBe(150);
  });

  it('stops player when moving right into a solid obstacle', () => {
    // Player ellipse center at (125, 150) -> box is [100, 100, 50, 100]
    const sprite = new kv.Ellipse({ x: 125, y: 150, radiusX: 25, radiusY: 50 });
    // Obstacle from x: 130 to x: 170
    const wall = new kv.Rect({ x: 130, y: 100, width: 40, height: 100 });

    const resolvedX = resolveHorizontalMovement(sprite, 50, [wall]);
    // Clamped top-left is 80 (130 - 50); center is 80 + 25 = 105
    expect(resolvedX).toBe(105);
  });

  it('stops player when moving left into a solid obstacle', () => {
    const sprite = new kv.Ellipse({ x: 125, y: 150, radiusX: 25, radiusY: 50 });
    // Obstacle from x: 20 to x: 80
    const wall = new kv.Rect({ x: 20, y: 100, width: 60, height: 100 });

    const resolvedX = resolveHorizontalMovement(sprite, -40, [wall]);
    // Clamped top-left is 80 (20 + 60); center is 80 + 25 = 105
    expect(resolvedX).toBe(105);
  });

  it('stops at closest obstacle when multiple obstacles are in path', () => {
    const sprite = new kv.Ellipse({ x: 125, y: 150, radiusX: 25, radiusY: 50 });
    const wall1 = new kv.Rect({ x: 130, y: 100, width: 30, height: 100 });
    const wall2 = new kv.Rect({ x: 180, y: 100, width: 30, height: 100 });

    const resolvedX = resolveHorizontalMovement(sprite, 100, [wall1, wall2]);
    expect(resolvedX).toBe(105);
  });
});