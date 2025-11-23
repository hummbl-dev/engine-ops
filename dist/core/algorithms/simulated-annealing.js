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
exports.SimulatedAnnealing = void 0;
/**
 * Simulated Annealing for optimization
 */
class SimulatedAnnealing {
    config;
    constructor(config = {}) {
        this.config = {
            initialTemperature: config.initialTemperature ?? 1000,
            coolingRate: config.coolingRate ?? 0.95,
            minTemperature: config.minTemperature ?? 0.1,
            maxIterations: config.maxIterations ?? 1000
        };
    }
    /**
     * Run simulated annealing
     */
    optimize(initialState, energyFunction, generateNeighbor) {
        let currentSolution = {
            state: initialState,
            energy: energyFunction(initialState)
        };
        let bestSolution = { ...currentSolution };
        let temperature = this.config.initialTemperature;
        let iteration = 0;
        while (temperature > this.config.minTemperature && iteration < this.config.maxIterations) {
            // Generate neighbor
            const neighborState = generateNeighbor(currentSolution.state);
            const neighborEnergy = energyFunction(neighborState);
            // Calculate energy difference
            const deltaE = neighborEnergy - currentSolution.energy;
            // Accept or reject neighbor
            if (deltaE < 0 || Math.random() < this.acceptanceProbability(deltaE, temperature)) {
                currentSolution = {
                    state: neighborState,
                    energy: neighborEnergy
                };
                // Update best solution
                if (currentSolution.energy < bestSolution.energy) {
                    bestSolution = { ...currentSolution };
                }
            }
            // Cool down
            temperature *= this.config.coolingRate;
            iteration++;
        }
        return bestSolution;
    }
    acceptanceProbability(deltaE, temperature) {
        return Math.exp(-deltaE / temperature);
    }
}
exports.SimulatedAnnealing = SimulatedAnnealing;
