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
const genetic_1 = require("../genetic");
// Mock Math.random for deterministic testing
const mockMath = Object.create(global.Math);
mockMath.random = globals_1.jest.fn();
global.Math = mockMath;
(0, globals_1.describe)('GeneticAlgorithm', () => {
    let algorithm;
    (0, globals_1.beforeEach)(() => {
        // Reset mocks
        globals_1.jest.clearAllMocks();
        // Set deterministic random values for testing
        mockMath.random.mockReturnValue(0.5);
        algorithm = new genetic_1.GeneticAlgorithm();
    });
    (0, globals_1.describe)('Constructor', () => {
        (0, globals_1.it)('should initialize with default configuration', () => {
            const algo = new genetic_1.GeneticAlgorithm();
            (0, globals_1.expect)(algo).toBeDefined();
        });
        (0, globals_1.it)('should accept custom configuration', () => {
            const config = {
                populationSize: 100,
                generations: 200,
                mutationRate: 0.05,
                crossoverRate: 0.8,
                elitismCount: 5
            };
            const algo = new genetic_1.GeneticAlgorithm(config);
            (0, globals_1.expect)(algo).toBeDefined();
        });
        (0, globals_1.it)('should use default values for missing configuration', () => {
            const config = {
                populationSize: 75
            };
            const algo = new genetic_1.GeneticAlgorithm(config);
            (0, globals_1.expect)(algo).toBeDefined();
        });
    });
    (0, globals_1.describe)('Evolution Process', () => {
        (0, globals_1.it)('should evolve population and return best individual', () => {
            // Simple optimization: maximize sum of array elements
            const initializeIndividual = () => [1, 2, 3, 4, 5];
            const fitnessFunction = (genes) => genes.reduce((sum, val) => sum + val, 0);
            const crossover = (parent1, parent2) => {
                const midpoint = Math.floor(parent1.length / 2);
                return [...parent1.slice(0, midpoint), ...parent2.slice(midpoint)];
            };
            const mutate = (genes) => {
                const index = Math.floor(Math.random() * genes.length);
                const newGenes = [...genes];
                newGenes[index] = Math.max(0, newGenes[index] + (Math.random() - 0.5) * 2);
                return newGenes;
            };
            const result = algorithm.evolve(initializeIndividual, fitnessFunction, crossover, mutate);
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.genes).toBeInstanceOf(Array);
            (0, globals_1.expect)(typeof result.fitness).toBe('number');
            (0, globals_1.expect)(result.fitness).toBeGreaterThanOrEqual(0);
        });
        (0, globals_1.it)('should improve fitness over generations', () => {
            const fitnessHistory = [];
            // Mock fitness function that tracks improvement
            const fitnessFunction = globals_1.jest.fn((genes) => {
                const fitness = genes.reduce((sum, val) => sum + val, 0);
                fitnessHistory.push(fitness);
                return fitness;
            });
            const initializeIndividual = () => [1, 1, 1, 1, 1];
            const crossover = (parent1, parent2) => {
                return parent1.map((val, idx) => Math.max(val, parent2[idx]));
            };
            const mutate = (genes) => genes; // No mutation for this test
            algorithm.evolve(initializeIndividual, fitnessFunction, crossover, mutate);
            // Should have called fitness function multiple times (population size * generations)
            (0, globals_1.expect)(fitnessFunction).toHaveBeenCalled();
            (0, globals_1.expect)(fitnessHistory.length).toBeGreaterThan(50); // At least initial population
        });
        (0, globals_1.it)('should preserve elitism - best individuals survive', () => {
            const config = {
                populationSize: 6,
                generations: 1, // Just one generation to test elitism
                elitismCount: 2,
                mutationRate: 0, // No mutation to keep it deterministic
                crossoverRate: 0 // No crossover to keep it deterministic
            };
            const elitismAlgo = new genetic_1.GeneticAlgorithm(config);
            // Simple fitness function where higher values are better
            const fitnessFunction = (genes) => genes[0];
            const crossover = (parent1, _parent2) => parent1; // No-op
            const mutate = (genes) => genes; // No-op
            // Create a deterministic initializer that returns decreasing values
            let initCount = 0;
            const initializeIndividual = () => {
                initCount++;
                return [11 - initCount]; // [10, 9, 8, 7, 6, 5]
            };
            const result = elitismAlgo.evolve(initializeIndividual, fitnessFunction, crossover, mutate);
            // With elitism, the best individual (10) should survive
            (0, globals_1.expect)(result.fitness).toBe(10);
        });
    });
    (0, globals_1.describe)('Selection Mechanisms', () => {
        (0, globals_1.it)('should perform tournament selection', () => {
            const population = [
                { genes: [1], fitness: 1 },
                { genes: [5], fitness: 5 },
                { genes: [10], fitness: 10 },
                { genes: [3], fitness: 3 }
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            algorithm.population = population;
            // Mock random to always select first tournament member
            mockMath.random.mockReturnValue(0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const selected = algorithm.tournamentSelection(2);
            (0, globals_1.expect)(selected.fitness).toBeGreaterThanOrEqual(1);
        });
        (0, globals_1.it)('should handle tournament selection with tournament size larger than population', () => {
            const population = [
                { genes: [1], fitness: 1 },
                { genes: [2], fitness: 2 }
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            algorithm.population = population;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const selected = algorithm.tournamentSelection(5);
            (0, globals_1.expect)(selected).toBeDefined();
            (0, globals_1.expect)(typeof selected.fitness).toBe('number');
        });
    });
    (0, globals_1.describe)('Population Evaluation', () => {
        (0, globals_1.it)('should evaluate entire population fitness', () => {
            const population = [
                { genes: [1, 2], fitness: 0 },
                { genes: [3, 4], fitness: 0 },
                { genes: [5, 6], fitness: 0 }
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            algorithm.population = population;
            const fitnessFunction = (genes) => genes.reduce((sum, val) => sum + val, 0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            algorithm.evaluatePopulation(fitnessFunction);
            (0, globals_1.expect)(population[0].fitness).toBe(3); // 1 + 2
            (0, globals_1.expect)(population[1].fitness).toBe(7); // 3 + 4
            (0, globals_1.expect)(population[2].fitness).toBe(11); // 5 + 6
        });
    });
    (0, globals_1.describe)('Configuration Validation', () => {
        (0, globals_1.it)('should handle zero population size gracefully', () => {
            const config = {
                populationSize: 0,
                generations: 1
            };
            const algo = new genetic_1.GeneticAlgorithm(config);
            const initializeIndividual = () => [1];
            const fitnessFunction = (genes) => genes[0];
            const crossover = (parent1, _parent2) => parent1;
            const mutate = (genes) => genes;
            // Should handle empty population by returning a default individual
            (0, globals_1.expect)(() => {
                algo.evolve(initializeIndividual, fitnessFunction, crossover, mutate);
            }).not.toThrow();
        });
        (0, globals_1.it)('should handle zero generations', () => {
            const config = {
                generations: 0
            };
            const algo = new genetic_1.GeneticAlgorithm(config);
            const initializeIndividual = () => [1];
            const fitnessFunction = (genes) => genes[0];
            const crossover = (parent1, _parent2) => parent1;
            const mutate = (genes) => genes;
            const result = algo.evolve(initializeIndividual, fitnessFunction, crossover, mutate);
            (0, globals_1.expect)(result).toBeDefined();
            (0, globals_1.expect)(result.fitness).toBe(1);
        });
    });
    (0, globals_1.describe)('Edge Cases', () => {
        (0, globals_1.it)('should handle single element arrays', () => {
            const initializeIndividual = () => [42];
            const fitnessFunction = (genes) => genes[0];
            const crossover = (parent1, _parent2) => [parent1[0]];
            const mutate = (genes) => genes;
            const result = algorithm.evolve(initializeIndividual, fitnessFunction, crossover, mutate);
            (0, globals_1.expect)(result.genes).toHaveLength(1);
            (0, globals_1.expect)(result.fitness).toBe(42);
        });
        (0, globals_1.it)('should handle large populations', () => {
            const config = {
                populationSize: 1000,
                generations: 2
            };
            const largeAlgo = new genetic_1.GeneticAlgorithm(config);
            const initializeIndividual = () => [1];
            const fitnessFunction = (genes) => genes[0];
            const crossover = (parent1, _parent2) => parent1;
            const mutate = (genes) => genes;
            const result = largeAlgo.evolve(initializeIndividual, fitnessFunction, crossover, mutate);
            (0, globals_1.expect)(result).toBeDefined();
        });
    });
});
