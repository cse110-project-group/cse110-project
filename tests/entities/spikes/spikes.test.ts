// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../helpers/canvasStub.ts';
import Input from '../../../src/systems/input.ts';
import Spikes from '../../../src/entities/spikes/spikes.ts';
import SpikesController from '../../../src/entities/spikes/spikesController.ts';
import SpikesModel from '../../../src/entities/spikes/spikesModel.ts';
import Player from '../../../src/entities/player/player.ts';
import Game from '../../../src/game.ts';

describe('Spikes', () => {
    it("gets instantiated and shows sprite correctly", () => {
        const spikes = new Spikes(510, 810, 510);
        expect(spikes.getSprite().x()).toBe(510);
        expect(spikes.getSprite().y()).toBe(810);
        expect(spikes.AABB).toStrictEqual({
            x: 510, 
            y: 810,
            width: 510, 
            height: Game.GRID_UNIT
        });
    });

    it("throws an error when width is non-positive", () => {
        expect(() => {new Spikes(0, 0, -210)}).toThrow(
            "Invalid width, should be positive.");
    });

    it("throws an error when x or y is not a multiple of grid unit length",
            () => {
                expect(() => {new Spikes(10, 0, 120)}).toThrow(
                    "Invalid x, should be an integer multiple of grid unit length. (Maybe calculation error?)");
                expect(() => {new Spikes(0, 10, 120)}).toThrow(
                    "Invalid y, should be an integer multiple of grid unit length. (Maybe calculation error?)");
    
            }
    );

    it("throws an error when width is not a multiple of grid unit length",
            () => {
                expect(() => {new Spikes(0, 0, 10)}).toThrow(
                    "Invalid width, should be an integer multiple of grid unit length. (Maybe calculation error?)");    
            }
    ); 
});

describe('SpikesModel', () => {
    it("returns the same sprite every time", () => {
        const spikesModel = new SpikesModel(0, 0, 100);
        expect(spikesModel.getSprite()).toBe(spikesModel.getSprite());
    });
});