// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import '../../helpers/canvasStub.ts';
import Input from '../../../src/systems/input.ts';
import Slope from '../../../src/entities/slope/slope.ts';
import SlopeController from '../../../src/entities/slope/slopeController.ts';
import SlopeModel from '../../../src/entities/slope/slopeModel.ts';
import Player from '../../../src/entities/player/player.ts';
import Konva from 'konva';
import { LineConfig } from 'konva/lib/shapes/Line';

describe('Slope', () => {
    it("gets instantiated and shows sprite correctly", () => {
        const slope = new Slope(new Input(), 100, 100, 600, 300);
        expect(slope.getSprite().x()).toBe(100);
        expect(slope.getSprite().y()).toBe(100);
        let endpoints = slope.getSprite().getChildren(function(node){
            return node.getClassName() === 'Ellipse';
        });
        expect(Math.abs(endpoints[0].x() - endpoints[1].x())).toBe(600);
        expect(Math.abs(endpoints[0].y() - endpoints[1].y())).toBe(300);
        let line = slope.getSprite().getChildren(function(node){
            return node.getClassName() === 'Line';
        });
        expect(line[0].getAttrs()["points"]).toStrictEqual([0, 0, 600, 300]);
        expect(slope.AABB).toStrictEqual({x: -1, y: -1, width: -1, height: -1});
    });
});

describe('SlopeModel', () => {
    it("returns the same sprite every time", () => {
        const slopeModel = new SlopeModel(0, 0, 100, 100);
        expect(slopeModel.getSprite()).toBe(slopeModel.getSprite());
    });
});