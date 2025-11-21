/*
 * Copyright (c) 2024-present, Hummbl Dev
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

import { IEngine, EngineConfig, OptimizationRequest, OptimizationResult } from './interfaces.js';
import { OptimizationRequestSchema } from '../schemas/validation.js';
import { BinPackingOptimizer } from './algorithms/bin-packing.js';
import { LeastLoadedScheduler } from './algorithms/least-loaded.js';

export class OptimizationEngine implements IEngine {
    private config: EngineConfig;
    private isInitialized: boolean = false;

    constructor(config: EngineConfig = {}) {
        this.config = {
            maxConcurrentTasks: 5,
            timeoutMs: 30000,
            verbose: false,
            ...config
        };
    }

    public async init(config?: EngineConfig): Promise<void> {
        if (config) {
            this.config = { ...this.config, ...config };
        }

        this.isInitialized = true;

        if (this.config.verbose) {
            console.log('Optimization Engine initialized', this.config);
        }
    }

    public async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
        if (!this.isInitialized) {
            throw new Error('Engine not initialized. Call init() first.');
        }

        const startTime = Date.now();

        try {
            // Validate request using Zod schema
            const validation = OptimizationRequestSchema.safeParse(request);
            if (!validation.success) {
                throw new Error(`Validation failed: ${validation.error.message}`);
            }

            if (this.config.verbose) {
                console.log(`Processing request ${request.id} of type ${request.type}`);
            }

            let resultData: Record<string, unknown> = {};

            if (request.type === 'resource') {
                const items = request.data.items as any[];
                const nodeCapacity = request.data.nodeCapacity as any;

                if (!items || !nodeCapacity) {
                    throw new Error('Missing items or nodeCapacity for resource optimization');
                }

                const optimizer = new BinPackingOptimizer();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                resultData = optimizer.optimize(items, nodeCapacity) as unknown as Record<string, unknown>;
            } else if (request.type === 'scheduling') {
                const task = request.data.task as any;
                const nodes = request.data.nodes as any[];

                if (!task || !nodes) {
                    throw new Error('Missing task or nodes for scheduling optimization');
                }

                const scheduler = new LeastLoadedScheduler();
                const result = scheduler.schedule(task, nodes);

                if (!result) {
                    throw new Error('Scheduling failed: No suitable node found');
                }

                resultData = result as unknown as Record<string, unknown>;
            } else {
                // Mock for other types
                resultData = { optimized: true, originalData: request.data };
            }

            const durationMs = Date.now() - startTime;

            return {
                requestId: request.id,
                success: true,
                result: resultData,
                metrics: {
                    durationMs,
                    score: 1.0
                }
            };
        } catch (error) {
            const durationMs = Date.now() - startTime;

            return {
                requestId: request.id,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                metrics: {
                    durationMs
                }
            };
        }
    }

    public async shutdown(): Promise<void> {
        this.isInitialized = false;
        if (this.config.verbose) {
            console.log('Optimization Engine shutdown');
        }
    }
}
