// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../helpers/canvasStub.ts';
import Input from '../../../src/systems/input.ts';
import Spikes from '../../../src/entities/spikes/spikes.ts';
import SpikesController from '../../../src/entities/spikes/spikesController.ts';
import SpikesModel from '../../../src/entities/spikes/spikesModel.ts';
import Player from '../../../src/entities/player/player.ts';

describe('Spikes', () => {
    it("gets instantiated and shows sprite correctly", () => {
        const spikes = new Spikes(500, 800, 500);
        expect(spikes.getSprite().x()).toBe(500);
        expect(spikes.getSprite().y()).toBe(800);
        expect(spikes.AABB).toStrictEqual({
            x: 500, 
            y: 800,
            width: 500, 
            height: Spikes.HEIGHT_UNIT
        });
    });
});

describe('SpikesModel', () => {
    it("returns the same sprite every time", () => {
        const spikesModel = new SpikesModel(0, 0, 100);
        expect(spikesModel.getSprite()).toBe(spikesModel.getSprite());
    });
});