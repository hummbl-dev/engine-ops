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

import { OptimizationRequest, OptimizationResult } from '../interfaces.js';
import { BaseOptimizationPlugin } from './base-plugin.js';
import { PluginMetadata, WorkloadDataPoint, IMLModel } from './interfaces.js';

/**
 * ML-driven optimization plugin
 */
export class MLOptimizationPlugin extends BaseOptimizationPlugin {
    public readonly metadata: PluginMetadata = {
        name: 'ml-optimization',
        version: '1.0.0',
        description: 'ML-driven optimization using custom models',
        author: 'HUMMBL, LLC',
        supportedTypes: ['ml-driven', 'resource', 'scheduling']
    };

    private model?: IMLModel;

    /**
     * Set ML model
     */
    public setModel(model: IMLModel): void {
        this.model = model;
    }

    public canHandle(request: OptimizationRequest): boolean {
        // Can handle ml-driven type or if model is available
        return request.type === 'ml-driven' || (this.model !== undefined);
    }

    public async optimize(
        request: OptimizationRequest,
        historicalData?: WorkloadDataPoint[]
    ): Promise<OptimizationResult> {
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
        } catch (error) {
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

    private calculateScore(prediction: Record<string, unknown>): number {
        // Simple scoring based on prediction confidence
        if (typeof prediction.confidence === 'number') {
            return prediction.confidence;
        }
        return 0.5; // Default score
    }
}
