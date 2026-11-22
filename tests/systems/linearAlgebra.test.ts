// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as linAlg from "../../src/systems/linearAlgebra"

describe("LinAlg - dot", () => {
    it("throws an error if input dimensions don't match", () => {
        let a: number[] = [0, 0, 0];
        let b: number[] = [0, 0];
        expect(() => {linAlg.dot(a, b)}).toThrow("Inputs must have same length.");
    });

    it("throws an error if inputs have no length", () => {
        let a: number[] = [];
        let b: number[] = [];
        expect(() => {linAlg.dot(a, b)}).toThrow("Inputs must not be empty.");
    });

    it("correctly returns the dot product of two vectors", () => {
        let a: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        let b: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        
        let sum = 0;
        for(let i = 0; i < a.length; ++i) sum += a[i] * b[i];
        expect(linAlg.dot(a, b)).toBeCloseTo(sum);
    });
});

describe("LinAlg - vecNorm", () => {
    it("throws an error if input has no length", () => {
        let a: number[] = [];
        expect(() => {linAlg.vecNorm(a)}).toThrow("Input must not be empty.");
    });

    it("correctly returns the norm of a vector", () => {
        let a: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        
        let sum = 0;
        for(let i = 0; i < a.length; ++i) sum += Math.pow(a[i], 2);
        expect(linAlg.vecNorm(a)).toBeCloseTo(Math.sqrt(sum));
    });
});

describe("LinAlg - normalize", () => {
    it("throws an error if input has no length", () => {
        let a: number[] = [];
        expect(() => {linAlg.normalize(a)}).toThrow("Input must not be empty.");
    });

    it("correctly returns the normalized vector", () => {
        let a: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        let b: number[] = [0, 0, 0];
        
        let sum = 0;
        for(let i = 0; i < a.length; ++i) sum += Math.pow(a[i], 2);
        for(let j = 0; j < a.length; ++j) b[j] = a[j] / Math.sqrt(sum);
        expect(linAlg.normalize(a)).toStrictEqual(b);
    });
});

describe("LinAlg - vecSum", () => {
    it("throws an error if input dimensions don't match", () => {
        let a: number[] = [0, 0, 0];
        let b: number[] = [0, 0];
        expect(() => {linAlg.vecSum(a, b)}).toThrow("Inputs must have same length.");
    });

    it("throws an error if inputs have no length", () => {
        let a: number[] = [];
        let b: number[] = [];
        expect(() => {linAlg.vecSum(a, b)}).toThrow("Inputs must not be empty.");
    });

    it("correctly returns the element-wise sum of two vectors", () => {
        let a: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        let b: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        let c: number[] = [0, 0, 0];
    
        for(let i = 0; i < a.length; ++i) c[i] = a[i] + b[i];
        expect(linAlg.vecSum(a, b)).toStrictEqual(c);
    });
});

describe("LinAlg - vecDiff", () => {
    it("throws an error if input dimensions don't match", () => {
        let a: number[] = [0, 0, 0];
        let b: number[] = [0, 0];
        expect(() => {linAlg.vecDiff(a, b)}).toThrow("Inputs must have same length.");
    });

    it("throws an error if inputs have no length", () => {
        let a: number[] = [];
        let b: number[] = [];
        expect(() => {linAlg.vecDiff(a, b)}).toThrow("Inputs must not be empty.");
    });

    it("correctly returns the element-wise difference of two vectors", () => {
        let a: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        let b: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        let c: number[] = [0, 0, 0];
    
        for(let i = 0; i < a.length; ++i) c[i] = a[i] - b[i];
        expect(linAlg.vecDiff(a, b)).toStrictEqual(c);
    });
});

describe("LinAlg - vecScale", () => {
    it("throws an error if input has no length", () => {
        let a: number[] = [];
        expect(() => {linAlg.vecScale(a, 1)}).toThrow("Input must not be empty.");
    });

    it("correctly returns the normalized vector", () => {
        let a: number[] = [(Math.random() - 0.5) * 1e4,
                           (Math.random() - 0.5) * 1e4, 
                           (Math.random() - 0.5) * 1e4];
        let b: number[] = [0, 0, 0];
        
        let c = (Math.random() - 0.5) * 1e4;
        for(let i = 0; i < a.length; ++i) b[i] = a[i] * c;
        expect(linAlg.vecScale(a, c)).toStrictEqual(b);
    });
});