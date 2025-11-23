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
exports.GeneticAlgorithm = void 0;
/**
 * Genetic Algorithm for optimization
 */
class GeneticAlgorithm {
    config;
    population = [];
    constructor(config = {}) {
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
    evolve(initializeIndividual, fitnessFunction, crossover, mutate) {
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
            const newPopulation = [];
            // Elitism - keep best individuals
            const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
            for (let i = 0; i < this.config.elitismCount; i++) {
                newPopulation.push(sorted[i]);
            }
            // Generate rest of population
            while (newPopulation.length < this.config.populationSize) {
                const parent1 = this.tournamentSelection();
                const parent2 = this.tournamentSelection();
                let offspring;
                if (Math.random() < this.config.crossoverRate) {
                    offspring = crossover(parent1.genes, parent2.genes);
                }
                else {
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
        return this.population.reduce((best, ind) => ind.fitness > best.fitness ? ind : best);
    }
    evaluatePopulation(fitnessFunction) {
        for (const individual of this.population) {
            individual.fitness = fitnessFunction(individual.genes);
        }
    }
    tournamentSelection(tournamentSize = 3) {
        const tournament = [];
        for (let i = 0; i < tournamentSize; i++) {
            const randomIndex = Math.floor(Math.random() * this.population.length);
            tournament.push(this.population[randomIndex]);
        }
        return tournament.reduce((best, ind) => ind.fitness > best.fitness ? ind : best);
    }
}
exports.GeneticAlgorithm = GeneticAlgorithm;
