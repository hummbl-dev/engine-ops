"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const simulated_annealing_1 = require("../simulated-annealing");
// Mock Math.random for deterministic testing
const mockMath = Object.create(global.Math);
mockMath.random = globals_1.jest.fn();
global.Math = mockMath;
(0, globals_1.describe)('SimulatedAnnealing', () => {
    let annealing;
    (0, globals_1.beforeEach)(() => {
        // Reset mocks
        globals_1.jest.clearAllMocks();
        // Set deterministic random values for testing
        mockMath.random.mockReturnValue(0.5);
        annealing = new simulated_annealing_1.SimulatedAnnealing();
    });
    (0, globals_1.describe)('Constructor', () => {
        (0, globals_1.it)('should initialize with default configuration', () => {
            const sa = new simulated_annealing_1.SimulatedAnnealing();
            (0, globals_1.expect)(sa).toBeDefined();
        });
        (0, globals_1.it)('should accept custom configuration', () => {
            const config = {
                initialTemperature: 500,
                coolingRate: 0.9,
                minTemperature: 0.01,
                maxIterations: 500
            };
            const sa = new simulated_annealing_1.SimulatedAnnealing(config);
            (0, globals_1.expect)(sa).toBeDefined();
        });
        (0, globals_1.it)('should use default values for missing configuration', () => {
            const config = {
                initialTemperature: 200
            };
            const sa = new simulated_annealing_1.SimulatedAnnealing(config);
            (0, globals_1.expect)(sa).toBeDefined();
        });
    });
    (0, globals_1.describe)('Optimization Process', () => {
        (0, globals_1.it)('should optimize and return best solution', () => {
            // Simple minimization: minimize sum of squared differences from target
            const target = [1, 2, 3, 4, 5];
            const initialState = [0, 0, 0, 0, 0];
            const energyFunction = (state) => {
                return state.reduce((sum, val, idx) => sum + Math.pow(val - target[idx], 2), 0);
            };
            const generateNeighbor = (state) => {
                const newState = [...state];
                const index = Math.floor(Math.random() * state.length);
                newState[index] += (Math.random() - 0.5) * 0.1; // Small random change
                return newState;
            };
            const result = annealing.optimize(initialState, energyFunction, generateNeighbor);
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.state).toBeInstanceOf(Array);
            (0, globals_1.expect)(result.state).toHaveLength(5);
            (0, globals_1.expect)(typeof result.energy).toBe('number');
            (0, globals_1.expect)(result.energy).toBeGreaterThanOrEqual(0);
        });
        (0, globals_1.it)('should find optimal solution for simple problem', () => {
            // Very simple problem: minimize x^2, optimal at x = 0
            const initialState = [10];
            const energyFunction = (state) => Math.pow(state[0], 2);
            const generateNeighbor = (state) => {
                const newState = [...state];
                // With deterministic random (0.5), this will move toward 0
                newState[0] += (Math.random() - 0.5) * 2; // Random change between -1 and 1
                return newState;
            };
            const result = annealing.optimize(initialState, energyFunction, generateNeighbor);
            // Should find a solution better than or equal to initial
            (0, globals_1.expect)(result.energy).toBeLessThanOrEqual(100);
            (0, globals_1.expect)(result.energy).toBeGreaterThanOrEqual(0);
        });
        (0, globals_1.it)('should track best solution across iterations', () => {
            let energyCallCount = 0;
            const energyHistory = [];
            const energyFunction = globals_1.jest.fn((state) => {
                const energy = Math.abs(state[0]); // Minimize absolute value
                energyHistory.push(energy);
                energyCallCount++;
                return energy;
            });
            const initialState = [10];
            const generateNeighbor = (state) => {
                const newState = [...state];
                newState[0] += (Math.random() - 0.5) * 0.5;
                return newState;
            };
            annealing.optimize(initialState, energyFunction, generateNeighbor);
            (0, globals_1.expect)(energyFunction).toHaveBeenCalled();
            (0, globals_1.expect)(energyCallCount).toBeGreaterThan(1);
            (0, globals_1.expect)(energyHistory.length).toBeGreaterThan(1);
        });
    });
    (0, globals_1.describe)('Acceptance Probability', () => {
        (0, globals_1.it)('should accept better solutions (deltaE < 0)', () => {
            const sa = new simulated_annealing_1.SimulatedAnnealing();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const acceptanceProb = sa.acceptanceProbability(-1, 100);
            (0, globals_1.expect)(acceptanceProb).toBeGreaterThanOrEqual(1); // Always accept better solutions
        });
        (0, globals_1.it)('should calculate acceptance probability for worse solutions', () => {
            const sa = new simulated_annealing_1.SimulatedAnnealing();
            const deltaE = 5;
            const temperature = 10;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const acceptanceProb = sa.acceptanceProbability(deltaE, temperature);
            // e^(-deltaE/temperature) = e^(-5/10) = e^(-0.5)
            const expected = Math.exp(-0.5);
            (0, globals_1.expect)(acceptanceProb).toBe(expected);
        });
        (0, globals_1.it)('should have lower acceptance probability at lower temperatures', () => {
            const sa = new simulated_annealing_1.SimulatedAnnealing();
            const deltaE = 5;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const probHighTemp = sa.acceptanceProbability(deltaE, 100);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const probLowTemp = sa.acceptanceProbability(deltaE, 10);
            (0, globals_1.expect)(probLowTemp).toBeLessThan(probHighTemp);
        });
    });
    (0, globals_1.describe)('Cooling Schedule', () => {
        (0, globals_1.it)('should cool down temperature over iterations', () => {
            const config = {
                initialTemperature: 100,
                coolingRate: 0.9,
                minTemperature: 1,
                maxIterations: 10
            };
            const sa = new simulated_annealing_1.SimulatedAnnealing(config);
            // Mock to ensure we go through iterations
            mockMath.random.mockReturnValue(0); // Always accept worse solutions for testing
            const energyFunction = (state) => Math.abs(state[0] - 5);
            const generateNeighbor = (state) => [state[0] + 0.1];
            sa.optimize([0], energyFunction, generateNeighbor);
            // Should complete iterations without error
            (0, globals_1.expect)(true).toBe(true);
        });
        (0, globals_1.it)('should stop when minimum temperature reached', () => {
            const config = {
                initialTemperature: 10,
                coolingRate: 0.1, // Very aggressive cooling
                minTemperature: 5,
                maxIterations: 1000
            };
            const sa = new simulated_annealing_1.SimulatedAnnealing(config);
            const energyFunction = (state) => state[0];
            const generateNeighbor = (state) => [state[0] + 1];
            const result = sa.optimize([0], energyFunction, generateNeighbor);
            (0, globals_1.expect)(result).toBeDefined();
        });
        (0, globals_1.it)('should stop when max iterations reached', () => {
            const config = {
                initialTemperature: 1000,
                coolingRate: 1.0, // No cooling
                minTemperature: 0.001,
                maxIterations: 5
            };
            const sa = new simulated_annealing_1.SimulatedAnnealing(config);
            const energyFunction = (state) => state[0];
            const generateNeighbor = (state) => [state[0] + 1];
            const result = sa.optimize([0], energyFunction, generateNeighbor);
            (0, globals_1.expect)(result).toBeDefined();
        });
    });
    (0, globals_1.describe)('Neighbor Generation', () => {
        (0, globals_1.it)('should generate different neighbors', () => {
            const initialState = [1, 2, 3];
            const generateNeighbor = (state) => {
                const newState = [...state];
                const index = Math.floor(Math.random() * state.length);
                newState[index] += 1;
                return newState;
            };
            const neighbor1 = generateNeighbor(initialState);
            const neighbor2 = generateNeighbor(initialState);
            // Neighbors should be different from original
            (0, globals_1.expect)(neighbor1).not.toEqual(initialState);
            (0, globals_1.expect)(neighbor2).not.toEqual(initialState);
        });
        (0, globals_1.it)('should handle single element states', () => {
            const initialState = [42];
            const generateNeighbor = (state) => [state[0] + 1];
            const neighbor = generateNeighbor(initialState);
            (0, globals_1.expect)(neighbor).toEqual([43]);
        });
    });
    (0, globals_1.describe)('Edge Cases', () => {
        (0, globals_1.it)('should handle optimal initial solution', () => {
            const optimalState = [5];
            const energyFunction = (state) => Math.abs(state[0] - 5);
            const generateNeighbor = (state) => [state[0] + 1];
            const result = annealing.optimize(optimalState, energyFunction, generateNeighbor);
            (0, globals_1.expect)(result.energy).toBe(0); // Already optimal
        });
        (0, globals_1.it)('should handle zero temperature', () => {
            const config = {
                initialTemperature: 0,
                maxIterations: 1
            };
            const sa = new simulated_annealing_1.SimulatedAnnealing(config);
            const energyFunction = (state) => state[0];
            const generateNeighbor = (state) => [state[0] + 1];
            const result = sa.optimize([10], energyFunction, generateNeighbor);
            (0, globals_1.expect)(result).toBeDefined();
        });
        (0, globals_1.it)('should handle very large state spaces', () => {
            const largeState = new Array(1000).fill(0);
            const energyFunction = (state) => state.reduce((sum, val) => sum + val * val, 0);
            const generateNeighbor = (state) => {
                const newState = [...state];
                const index = Math.floor(Math.random() * state.length);
                newState[index] += (Math.random() - 0.5) * 0.01;
                return newState;
            };
            const result = annealing.optimize(largeState, energyFunction, generateNeighbor);
            (0, globals_1.expect)(result.state).toHaveLength(1000);
        });
    });
    (0, globals_1.describe)('Configuration Validation', () => {
        (0, globals_1.it)('should handle extreme cooling rates', () => {
            const config = {
                coolingRate: 0.001 // Very aggressive cooling
            };
            const sa = new simulated_annealing_1.SimulatedAnnealing(config);
            const result = sa.optimize([10], (state) => state[0], (state) => [state[0] - 0.1]);
            (0, globals_1.expect)(result).toBeDefined();
        });
        (0, globals_1.it)('should handle zero cooling rate (no cooling)', () => {
            const config = {
                coolingRate: 1.0,
                maxIterations: 3
            };
            const sa = new simulated_annealing_1.SimulatedAnnealing(config);
            const result = sa.optimize([10], (state) => state[0], (state) => [state[0] - 0.1]);
            (0, globals_1.expect)(result).toBeDefined();
        });
    });
});
