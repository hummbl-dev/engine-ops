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
exports.MLOptimizationPlugin = void 0;
const base_plugin_js_1 = require("./base-plugin.js");
/**
 * ML-driven optimization plugin
 */
class MLOptimizationPlugin extends base_plugin_js_1.BaseOptimizationPlugin {
    metadata = {
        name: 'ml-optimization',
        version: '1.0.0',
        description: 'ML-driven optimization using custom models',
        author: 'HUMMBL, LLC',
        supportedTypes: ['ml-driven', 'resource', 'scheduling']
    };
    model;
    /**
     * Set ML model
     */
    setModel(model) {
        this.model = model;
    }
    canHandle(request) {
        // Can handle ml-driven type or if model is available
        return request.type === 'ml-driven' || (this.model !== undefined);
    }
    async optimize(request, historicalData) {
        this.checkInitialized();
        const startTime = Date.now();
        try {
            if (!this.model) {
                throw new Error('No ML model configured');
            }
            // Train model if we have sufficient historical data
            if (historicalData && historicalData.length >= 10) {
                await this.model.train(historicalData);
            }
            // Make prediction
            const prediction = await this.model.predict(request.data);
            const durationMs = Date.now() - startTime;
            return {
                requestId: request.id,
                success: true,
                result: {
                    prediction,
                    modelId: this.model.modelId,
                    historicalDataSize: historicalData?.length || 0
                },
                metrics: {
                    durationMs,
                    score: this.calculateScore(prediction)
                }
            };
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                requestId: request.id,
                success: false,
                error: errorMessage,
                metrics: {
                    durationMs,
                    score: 0
                }
            };
        }
    }
    calculateScore(prediction) {
        // Simple scoring based on prediction confidence
        if (typeof prediction.confidence === 'number') {
            return prediction.confidence;
        }
        return 0.5; // Default score
    }
}
exports.MLOptimizationPlugin = MLOptimizationPlugin;
