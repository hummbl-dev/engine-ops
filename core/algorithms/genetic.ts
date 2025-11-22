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

export interface GeneticAlgorithmConfig {
    populationSize: number;
    generations: number;
    mutationRate: number;
    crossoverRate: number;
    elitismCount: number;
}

export interface Individual<T> {
    genes: T;
    fitness: number;
}

/**
 * Genetic Algorithm for optimization
 */
export class GeneticAlgorithm<T> {
    private config: GeneticAlgorithmConfig;
    private population: Individual<T>[] = [];

    constructor(config: Partial<GeneticAlgorithmConfig> = {}) {
        this.config = {
            populationSize: config.populationSize ?? 50,
            generations: config.generations ?? 100,
            mutationRate: config.mutationRate ?? 0.01,
            crossoverRate: config.crossoverRate ?? 0.7,
            elitismCount: config.elitismCount ?? 2
        };
    }

    /**
     * Run genetic algorithm
     */
    public evolve(
        initializeIndividual: () => T,
        fitnessFunction: (genes: T) => number,
        crossover: (parent1: T, parent2: T) => T,
        mutate: (genes: T) => T
    ): Individual<T> {
        // Initialize population
        this.population = Array.from({ length: this.config.populationSize }, () => ({
            genes: initializeIndividual(),
            fitness: 0
        }));

        // Handle edge case of empty population
        if (this.population.length === 0) {
            return {
                genes: initializeIndividual(),
                fitness: fitnessFunction(initializeIndividual())
            };
        }

        // Evaluate initial population
        this.evaluatePopulation(fitnessFunction);

        // Evolution loop
        for (let gen = 0; gen < this.config.generations; gen++) {
            const newPopulation: Individual<T>[] = [];

            // Elitism - keep best individuals
            const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
            for (let i = 0; i < this.config.elitismCount; i++) {
                newPopulation.push(sorted[i]);
            }

            // Generate rest of population
            while (newPopulation.length < this.config.populationSize) {
                const parent1 = this.tournamentSelection();
                const parent2 = this.tournamentSelection();

                let offspring: T;
                if (Math.random() < this.config.crossoverRate) {
                    offspring = crossover(parent1.genes, parent2.genes);
                } else {
                    offspring = parent1.genes;
                }

                if (Math.random() < this.config.mutationRate) {
                    offspring = mutate(offspring);
                }

                newPopulation.push({
                    genes: offspring,
                    fitness: 0
                });
            }

            this.population = newPopulation;
            this.evaluatePopulation(fitnessFunction);
        }

        // Return best individual
        if (this.population.length === 0) {
            // Handle edge case of empty population
            return {
                genes: initializeIndividual(),
                fitness: fitnessFunction(initializeIndividual())
            };
        }
        return this.population.reduce((best, ind) =>
            ind.fitness > best.fitness ? ind : best
        );
    }

    private evaluatePopulation(fitnessFunction: (genes: T) => number): void {
        for (const individual of this.population) {
            individual.fitness = fitnessFunction(individual.genes);
        }
    }

    private tournamentSelection(tournamentSize: number = 3): Individual<T> {
        const tournament: Individual<T>[] = [];
        for (let i = 0; i < tournamentSize; i++) {
            const randomIndex = Math.floor(Math.random() * this.population.length);
            tournament.push(this.population[randomIndex]);
        }
        return tournament.reduce((best, ind) =>
            ind.fitness > best.fitness ? ind : best
        );
    }
}
