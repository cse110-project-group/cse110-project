// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../helpers/canvasStub.ts';
import Input from '../../../src/systems/input.ts';
import Platform from '../../../src/entities/platform/platform.ts';
import Platformontroller from '../../../src/entities/platform/platformController.ts';
import PlatformModel from '../../../src/entities/platform/platformModel.ts';
import Player from '../../../src/entities/player/player.ts';
import { resolveHorizontalMovement } from '../../../src/systems/collision.ts';

describe('Platform', () => {

    it("gets instantiated and shows sprite correctly", () => {
        const platform = new Platform(500, 800, 500, 200);
        expect(platform.getSprite().x()).toBe(500);
        expect(platform.getSprite().y()).toBe(800);
        expect(platform.getSprite().width()).toBe(500);
        expect(platform.getSprite().height()).toBe(200);
        expect(platform.AABB).toStrictEqual({
            x: 500, 
            y: 800, 
            width: 500, 
            height: 200
        });
    });

    it("stops players if they hit the side", () => {
        const platform = new Platform(300, 500, 200, 500);
        const player = new Player(new Input(), 600, 800);
        const dx = -150;
        const resolvedX = resolveHorizontalMovement(player.AABB, dx, [platform.AABB]);
        expect(resolvedX).toBe(500);
    });

    it("throws an error when either width or height is non-positive", () => {
        expect(() => {new Platform(0, 0, -100, 100)}).toThrow(
                        "Invalid width, should be positive.");
        expect(() => {new Platform(0, 0, 100, -100)}).toThrow(
                        "Invalid height, should be positive.");
    });
});

describe('PlatformModel', () => {
    it("returns the same sprite every time", () => {
        const platformModel = new PlatformModel(0, 0, 100, 100);
        expect(platformModel.getSprite()).toBe(platformModel.getSprite());
    });
});