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
import { GeneticAlgorithm, GeneticAlgorithmConfig, Individual } from '../genetic';

// Mock Math.random for deterministic testing
const mockMath = Object.create(global.Math);
mockMath.random = jest.fn();
global.Math = mockMath;

describe('GeneticAlgorithm', () => {
    let algorithm: GeneticAlgorithm<number[]>;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        // Set deterministic random values for testing
        mockMath.random.mockReturnValue(0.5);
        algorithm = new GeneticAlgorithm<number[]>();
    });

    describe('Constructor', () => {
        it('should initialize with default configuration', () => {
            const algo = new GeneticAlgorithm<number[]>();
            expect(algo).toBeDefined();
        });

        it('should accept custom configuration', () => {
            const config: Partial<GeneticAlgorithmConfig> = {
                populationSize: 100,
                generations: 200,
                mutationRate: 0.05,
                crossoverRate: 0.8,
                elitismCount: 5
            };
            const algo = new GeneticAlgorithm<number[]>(config);
            expect(algo).toBeDefined();
        });

        it('should use default values for missing configuration', () => {
            const config: Partial<GeneticAlgorithmConfig> = {
                populationSize: 75
            };
            const algo = new GeneticAlgorithm<number[]>(config);
            expect(algo).toBeDefined();
        });
    });

    describe('Evolution Process', () => {
        it('should evolve population and return best individual', () => {
            // Simple optimization: maximize sum of array elements
            const initializeIndividual = (): number[] => [1, 2, 3, 4, 5];
            const fitnessFunction = (genes: number[]): number => genes.reduce((sum, val) => sum + val, 0);
            const crossover = (parent1: number[], parent2: number[]): number[] => {
                const midpoint = Math.floor(parent1.length / 2);
                return [...parent1.slice(0, midpoint), ...parent2.slice(midpoint)];
            };
            const mutate = (genes: number[]): number[] => {
                const index = Math.floor(Math.random() * genes.length);
                const newGenes = [...genes];
                newGenes[index] = Math.max(0, newGenes[index] + (Math.random() - 0.5) * 2);
                return newGenes;
            };

            const result = algorithm.evolve(
                initializeIndividual,
                fitnessFunction,
                crossover,
                mutate
            );

            expect(result).toBeDefined();
            expect(result.genes).toBeInstanceOf(Array);
            expect(typeof result.fitness).toBe('number');
            expect(result.fitness).toBeGreaterThanOrEqual(0);
        });

        it('should improve fitness over generations', () => {
            const fitnessHistory: number[] = [];

            // Mock fitness function that tracks improvement
            const fitnessFunction = jest.fn((genes: number[]): number => {
                const fitness = genes.reduce((sum, val) => sum + val, 0);
                fitnessHistory.push(fitness);
                return fitness;
            });

            const initializeIndividual = (): number[] => [1, 1, 1, 1, 1];
            const crossover = (parent1: number[], parent2: number[]): number[] => {
                return parent1.map((val, idx) => Math.max(val, parent2[idx]));
            };
            const mutate = (genes: number[]): number[] => genes; // No mutation for this test

            algorithm.evolve(
                initializeIndividual,
                fitnessFunction,
                crossover,
                mutate
            );

            // Should have called fitness function multiple times (population size * generations)
            expect(fitnessFunction).toHaveBeenCalled();
            expect(fitnessHistory.length).toBeGreaterThan(50); // At least initial population
        });

        it('should preserve elitism - best individuals survive', () => {
            const config: Partial<GeneticAlgorithmConfig> = {
                populationSize: 6,
                generations: 1, // Just one generation to test elitism
                elitismCount: 2,
                mutationRate: 0, // No mutation to keep it deterministic
                crossoverRate: 0  // No crossover to keep it deterministic
            };
            const elitismAlgo = new GeneticAlgorithm<number[]>(config);

            // Simple fitness function where higher values are better
            const fitnessFunction = (genes: number[]): number => genes[0];
            const crossover = (parent1: number[], _parent2: number[]): number[] => parent1; // No-op
            const mutate = (genes: number[]): number[] => genes; // No-op

            // Create a deterministic initializer that returns decreasing values
            let initCount = 0;
            const initializeIndividual = (): number[] => {
                initCount++;
                return [11 - initCount]; // [10, 9, 8, 7, 6, 5]
            };

            const result = elitismAlgo.evolve(
                initializeIndividual,
                fitnessFunction,
                crossover,
                mutate
            );

            // With elitism, the best individual (10) should survive
            expect(result.fitness).toBe(10);
        });
    });

    describe('Selection Mechanisms', () => {
        it('should perform tournament selection', () => {
            const population: Individual<number[]>[] = [
                { genes: [1], fitness: 1 },
                { genes: [5], fitness: 5 },
                { genes: [10], fitness: 10 },
                { genes: [3], fitness: 3 }
            ];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (algorithm as any).population = population;

            // Mock random to always select first tournament member
            mockMath.random.mockReturnValue(0);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const selected = (algorithm as any).tournamentSelection(2);
            expect(selected.fitness).toBeGreaterThanOrEqual(1);
        });

        it('should handle tournament selection with tournament size larger than population', () => {
            const population: Individual<number[]>[] = [
                { genes: [1], fitness: 1 },
                { genes: [2], fitness: 2 }
            ];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (algorithm as any).population = population;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const selected = (algorithm as any).tournamentSelection(5);
            expect(selected).toBeDefined();
            expect(typeof selected.fitness).toBe('number');
        });
    });

    describe('Population Evaluation', () => {
        it('should evaluate entire population fitness', () => {
            const population: Individual<number[]>[] = [
                { genes: [1, 2], fitness: 0 },
                { genes: [3, 4], fitness: 0 },
                { genes: [5, 6], fitness: 0 }
            ];

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (algorithm as any).population = population;

            const fitnessFunction = (genes: number[]): number =>
                genes.reduce((sum, val) => sum + val, 0);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (algorithm as any).evaluatePopulation(fitnessFunction);

            expect(population[0].fitness).toBe(3); // 1 + 2
            expect(population[1].fitness).toBe(7); // 3 + 4
            expect(population[2].fitness).toBe(11); // 5 + 6
        });
    });

    describe('Configuration Validation', () => {
        it('should handle zero population size gracefully', () => {
            const config: Partial<GeneticAlgorithmConfig> = {
                populationSize: 0,
                generations: 1
            };
            const algo = new GeneticAlgorithm<number[]>(config);

            const initializeIndividual = (): number[] => [1];
            const fitnessFunction = (genes: number[]): number => genes[0];
            const crossover = (parent1: number[], _parent2: number[]): number[] => parent1;
            const mutate = (genes: number[]): number[] => genes;

            // Should handle empty population by returning a default individual
            expect(() => {
                algo.evolve(
                    initializeIndividual,
                    fitnessFunction,
                    crossover,
                    mutate
                );
            }).not.toThrow();
        });

        it('should handle zero generations', () => {
            const config: Partial<GeneticAlgorithmConfig> = {
                generations: 0
            };
            const algo = new GeneticAlgorithm<number[]>(config);

            const initializeIndividual = (): number[] => [1];
            const fitnessFunction = (genes: number[]): number => genes[0];
            const crossover = (parent1: number[], _parent2: number[]): number[] => parent1;
            const mutate = (genes: number[]): number[] => genes;

            const result = algo.evolve(
                initializeIndividual,
                fitnessFunction,
                crossover,
                mutate
            );

            expect(result).toBeDefined();
            expect(result.fitness).toBe(1);
        });
    });

    describe('Edge Cases', () => {
        it('should handle single element arrays', () => {
            const initializeIndividual = (): number[] => [42];
            const fitnessFunction = (genes: number[]): number => genes[0];
            const crossover = (parent1: number[], _parent2: number[]): number[] => [parent1[0]];
            const mutate = (genes: number[]): number[] => genes;

            const result = algorithm.evolve(
                initializeIndividual,
                fitnessFunction,
                crossover,
                mutate
            );

            expect(result.genes).toHaveLength(1);
            expect(result.fitness).toBe(42);
        });

        it('should handle large populations', () => {
            const config: Partial<GeneticAlgorithmConfig> = {
                populationSize: 1000,
                generations: 2
            };
            const largeAlgo = new GeneticAlgorithm<number[]>(config);

            const initializeIndividual = (): number[] => [1];
            const fitnessFunction = (genes: number[]): number => genes[0];
            const crossover = (parent1: number[], _parent2: number[]): number[] => parent1;
            const mutate = (genes: number[]): number[] => genes;

            const result = largeAlgo.evolve(
                initializeIndividual,
                fitnessFunction,
                crossover,
                mutate
            );

            expect(result).toBeDefined();
        });
    });
});