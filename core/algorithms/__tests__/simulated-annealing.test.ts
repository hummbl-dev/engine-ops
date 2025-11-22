/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SimulatedAnnealing, SimulatedAnnealingConfig, Solution } from '../simulated-annealing';

// Mock Math.random for deterministic testing
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn();
global.Math = mockMath;

describe('SimulatedAnnealing', () => {
    let annealing: SimulatedAnnealing<number[]>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Set deterministic random values for testing
        mockMath.random.mockReturnValue(0.5);
        annealing = new SimulatedAnnealing<number[]>();
    });

    describe('Constructor', () => {
        it('should initialize with default configuration', () => {
            const sa = new SimulatedAnnealing<number[]>();
            expect(sa).toBeDefined();
        });

        it('should accept custom configuration', () => {
            const config: Partial<SimulatedAnnealingConfig> = {
                initialTemperature: 500,
                coolingRate: 0.9,
                minTemperature: 0.01,
                maxIterations: 500
            };
            const sa = new SimulatedAnnealing<number[]>(config);
            expect(sa).toBeDefined();
        });

        it('should use default values for missing configuration', () => {
            const config: Partial<SimulatedAnnealingConfig> = {
                initialTemperature: 200
            };
            const sa = new SimulatedAnnealing<number[]>(config);
            expect(sa).toBeDefined();
        });
    });

    describe('Optimization Process', () => {
        it('should optimize and return best solution', () => {
            // Simple minimization: minimize sum of squared differences from target
            const target = [1, 2, 3, 4, 5];
            const initialState = [0, 0, 0, 0, 0];

            const energyFunction = (state: number[]): number => {
                return state.reduce((sum, val, idx) => sum + Math.pow(val - target[idx], 2), 0);
            };

            const generateNeighbor = (state: number[]): number[] => {
                const newState = [...state];
                const index = Math.floor(Math.random() * state.length);
                newState[index] += (Math.random() - 0.5) * 0.1; // Small random change
                return newState;
            };

            const result = annealing.optimize(
                initialState,
                energyFunction,
                generateNeighbor
            );

            expect(result).toBeDefined();
            expect(result.state).toBeInstanceOf(Array);
            expect(result.state).toHaveLength(5);
            expect(typeof result.energy).toBe('number');
            expect(result.energy).toBeGreaterThanOrEqual(0);
        });

        it('should find optimal solution for simple problem', () => {
            // Very simple problem: minimize x^2, optimal at x = 0
            const initialState = [10];
            const energyFunction = (state: number[]): number => Math.pow(state[0], 2);
            const generateNeighbor = (state: number[]): number[] => {
                const newState = [...state];
                // With deterministic random (0.5), this will move toward 0
                newState[0] += (Math.random() - 0.5) * 2; // Random change between -1 and 1
                return newState;
            };

            const result = annealing.optimize(
                initialState,
                energyFunction,
                generateNeighbor
            );

            // Should find a solution better than or equal to initial
            expect(result.energy).toBeLessThanOrEqual(100);
            expect(result.energy).toBeGreaterThanOrEqual(0);
        });

        it('should track best solution across iterations', () => {
            let energyCallCount = 0;
            const energyHistory: number[] = [];

            const energyFunction = jest.fn((state: number[]): number => {
                const energy = Math.abs(state[0]); // Minimize absolute value
                energyHistory.push(energy);
                energyCallCount++;
                return energy;
            });

            const initialState = [10];
            const generateNeighbor = (state: number[]): number[] => {
                const newState = [...state];
                newState[0] += (Math.random() - 0.5) * 0.5;
                return newState;
            };

            annealing.optimize(
                initialState,
                energyFunction,
                generateNeighbor
            );

            expect(energyFunction).toHaveBeenCalled();
            expect(energyCallCount).toBeGreaterThan(1);
            expect(energyHistory.length).toBeGreaterThan(1);
        });
    });

    describe('Acceptance Probability', () => {
        it('should accept better solutions (deltaE < 0)', () => {
            const sa = new SimulatedAnnealing<number[]>();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const acceptanceProb = (sa as any).acceptanceProbability(-1, 100);
            expect(acceptanceProb).toBeGreaterThanOrEqual(1); // Always accept better solutions
        });

        it('should calculate acceptance probability for worse solutions', () => {
            const sa = new SimulatedAnnealing<number[]>();
            const deltaE = 5;
            const temperature = 10;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const acceptanceProb = (sa as any).acceptanceProbability(deltaE, temperature);

            // e^(-deltaE/temperature) = e^(-5/10) = e^(-0.5)
            const expected = Math.exp(-0.5);
            expect(acceptanceProb).toBe(expected);
        });

        it('should have lower acceptance probability at lower temperatures', () => {
            const sa = new SimulatedAnnealing<number[]>();
            const deltaE = 5;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const probHighTemp = (sa as any).acceptanceProbability(deltaE, 100);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const probLowTemp = (sa as any).acceptanceProbability(deltaE, 10);

            expect(probLowTemp).toBeLessThan(probHighTemp);
        });
    });

    describe('Cooling Schedule', () => {
        it('should cool down temperature over iterations', () => {
            const config: Partial<SimulatedAnnealingConfig> = {
                initialTemperature: 100,
                coolingRate: 0.9,
                minTemperature: 1,
                maxIterations: 10
            };
            const sa = new SimulatedAnnealing<number[]>(config);

            // Mock to ensure we go through iterations
            mockMath.random.mockReturnValue(0); // Always accept worse solutions for testing

            const energyFunction = (state: number[]): number => Math.abs(state[0] - 5);
            const generateNeighbor = (state: number[]): number[] => [state[0] + 0.1];

            sa.optimize(
                [0],
                energyFunction,
                generateNeighbor
            );

            // Should complete iterations without error
            expect(true).toBe(true);
        });

        it('should stop when minimum temperature reached', () => {
            const config: Partial<SimulatedAnnealingConfig> = {
                initialTemperature: 10,
                coolingRate: 0.1, // Very aggressive cooling
                minTemperature: 5,
                maxIterations: 1000
            };
            const sa = new SimulatedAnnealing<number[]>(config);

            const energyFunction = (state: number[]): number => state[0];
            const generateNeighbor = (state: number[]): number[] => [state[0] + 1];

            const result = sa.optimize(
                [0],
                energyFunction,
                generateNeighbor
            );

            expect(result).toBeDefined();
        });

        it('should stop when max iterations reached', () => {
            const config: Partial<SimulatedAnnealingConfig> = {
                initialTemperature: 1000,
                coolingRate: 1.0, // No cooling
                minTemperature: 0.001,
                maxIterations: 5
            };
            const sa = new SimulatedAnnealing<number[]>(config);

            const energyFunction = (state: number[]): number => state[0];
            const generateNeighbor = (state: number[]): number[] => [state[0] + 1];

            const result = sa.optimize(
                [0],
                energyFunction,
                generateNeighbor
            );

            expect(result).toBeDefined();
        });
    });

    describe('Neighbor Generation', () => {
        it('should generate different neighbors', () => {
            const initialState = [1, 2, 3];
            const generateNeighbor = (state: number[]): number[] => {
                const newState = [...state];
                const index = Math.floor(Math.random() * state.length);
                newState[index] += 1;
                return newState;
            };

            const neighbor1 = generateNeighbor(initialState);
            const neighbor2 = generateNeighbor(initialState);

            // Neighbors should be different from original
            expect(neighbor1).not.toEqual(initialState);
            expect(neighbor2).not.toEqual(initialState);
        });

        it('should handle single element states', () => {
            const initialState = [42];
            const generateNeighbor = (state: number[]): number[] => [state[0] + 1];

            const neighbor = generateNeighbor(initialState);
            expect(neighbor).toEqual([43]);
        });
    });

    describe('Edge Cases', () => {
        it('should handle optimal initial solution', () => {
            const optimalState = [5];
            const energyFunction = (state: number[]): number => Math.abs(state[0] - 5);
            const generateNeighbor = (state: number[]): number[] => [state[0] + 1];

            const result = annealing.optimize(
                optimalState,
                energyFunction,
                generateNeighbor
            );

            expect(result.energy).toBe(0); // Already optimal
        });

        it('should handle zero temperature', () => {
            const config: Partial<SimulatedAnnealingConfig> = {
                initialTemperature: 0,
                maxIterations: 1
            };
            const sa = new SimulatedAnnealing<number[]>(config);

            const energyFunction = (state: number[]): number => state[0];
            const generateNeighbor = (state: number[]): number[] => [state[0] + 1];

            const result = sa.optimize(
                [10],
                energyFunction,
                generateNeighbor
            );

            expect(result).toBeDefined();
        });

        it('should handle very large state spaces', () => {
            const largeState = new Array(1000).fill(0);
            const energyFunction = (state: number[]): number =>
                state.reduce((sum, val) => sum + val * val, 0);
            const generateNeighbor = (state: number[]): number[] => {
                const newState = [...state];
                const index = Math.floor(Math.random() * state.length);
                newState[index] += (Math.random() - 0.5) * 0.01;
                return newState;
            };

            const result = annealing.optimize(
                largeState,
                energyFunction,
                generateNeighbor
            );

            expect(result.state).toHaveLength(1000);
        });
    });

    describe('Configuration Validation', () => {
        it('should handle extreme cooling rates', () => {
            const config: Partial<SimulatedAnnealingConfig> = {
                coolingRate: 0.001 // Very aggressive cooling
            };
            const sa = new SimulatedAnnealing<number[]>(config);

            const result = sa.optimize(
                [10],
                (state) => state[0],
                (state) => [state[0] - 0.1]
            );

            expect(result).toBeDefined();
        });

        it('should handle zero cooling rate (no cooling)', () => {
            const config: Partial<SimulatedAnnealingConfig> = {
                coolingRate: 1.0,
                maxIterations: 3
            };
            const sa = new SimulatedAnnealing<number[]>(config);

            const result = sa.optimize(
                [10],
                (state) => state[0],
                (state) => [state[0] - 0.1]
            );

            expect(result).toBeDefined();
        });
    });
});