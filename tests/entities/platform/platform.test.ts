// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../helpers/canvasStub.ts';
import Game from '../../../src/game.ts';
import Input from '../../../src/systems/input.ts';
import Platform from '../../../src/entities/platform/platform.ts';
import Platformontroller from '../../../src/entities/platform/platformController.ts';
import PlatformModel from '../../../src/entities/platform/platformModel.ts';
import Player from '../../../src/entities/player/player.ts';
import { resolveHorizontalMovement } from '../../../src/systems/collision.ts';

describe('Platform', () => {

    it("gets instantiated and shows sprite correctly", () => {
        const platform = new Platform(510, 810, 510, 210);
        expect(platform.getSprite().x()).toBe(510 + PlatformModel.PLAT_STROKE_WIDTH / 2);
        expect(platform.getSprite().y()).toBe(810 + PlatformModel.PLAT_STROKE_WIDTH / 2);
        expect(platform.getSprite().width()).toBe(510 - PlatformModel.PLAT_STROKE_WIDTH);
        expect(platform.getSprite().height()).toBe(210 - PlatformModel.PLAT_STROKE_WIDTH);
        expect(platform.AABB).toStrictEqual({
            x: 510, 
            y: 810, 
            width: 510, 
            height: 210
        });
    });

    it("stops players if they hit the side", () => {
        const platform = new Platform(300, 510, 210, 600);
        const player = new Player(new Input(), 600, 800);
        const dx = -150;
        const resolvedX = resolveHorizontalMovement(player.AABB, dx, [platform.AABB]);
        expect(resolvedX).toBe(510);
    });

    it("throws an error when either width or height is non-positive", () => {
        expect(() => {new Platform(0, 0, -120, 120)}).toThrow(
                        "Invalid width, should be positive.");
        expect(() => {new Platform(0, 0, 120, -120)}).toThrow(
                        "Invalid height, should be positive.");
    });

    it("throws an error when x or y is not a multiple of grid unit length",
        () => {
            expect(() => {new Platform(10, 0, 120, 120)}).toThrow(
                "Invalid x, should be an integer multiple of grid unit length. (Maybe calculation error?)");
            expect(() => {new Platform(0, 10, 120, 120)}).toThrow(
                "Invalid y, should be an integer multiple of grid unit length. (Maybe calculation error?)");

        }
    );

    it("throws an error when the width or height is not a multiple of grid unit length",
        () => {
            expect(() => {new Platform(0, 0, 100, 120)}).toThrow(
                "Invalid width, should be an integer multiple of grid unit length. (Maybe calculation error?)");
            expect(() => {new Platform(0, 0, 120, 100)}).toThrow(
                "Invalid height, should be an integer multiple of grid unit length. (Maybe calculation error?)");

        }
    );
});

describe('PlatformModel', () => {
    it("returns the same sprite every time", () => {
        const platformModel = new PlatformModel(0, 0, 100, 100);
        expect(platformModel.getSprite()).toBe(platformModel.getSprite());
    });
});