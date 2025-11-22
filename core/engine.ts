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

import { IEngine, EngineConfig, OptimizationRequest, OptimizationResult } from './interfaces.js';
import { OptimizationRequestSchema } from '../schemas/validation.js';
import { BinPackingOptimizer } from './algorithms/bin-packing.js';
import { LeastLoadedScheduler } from './algorithms/least-loaded.js';
import { LRUCache } from './caching/lru-cache.js';
import { Logger, LogLevel } from './monitoring/logger.js';
import { metricsCollector } from './monitoring/metrics.js';
import { pluginRegistry } from './plugins/registry.js';
import { workloadCollector } from './plugins/workload-collector.js';

export class OptimizationEngine implements IEngine {
    private config: EngineConfig;
    private isInitialized: boolean = false;
    private cache: LRUCache<string, OptimizationResult>;
    private logger: Logger;

    constructor(config: EngineConfig = {}) {
        this.config = {
            maxConcurrentTasks: 5,
            timeoutMs: 30000,
            verbose: false,
            enablePlugins: false,
            enableWorkloadCollection: false,
            ...config
        };

        // Initialize cache
        this.cache = new LRUCache({
            maxSize: 100,
            ttlMs: 300000, // 5 minutes
            enableStats: true
        });

        // Initialize logger
        this.logger = new Logger({
            level: this.config.verbose ? LogLevel.DEBUG : LogLevel.INFO,
            enableConsole: true,
            enableTimestamps: true
        });
    }

    public async init(config?: EngineConfig): Promise<void> {
        if (config) {
            this.config = { ...this.config, ...config };
            this.logger.setLevel(this.config.verbose ? LogLevel.DEBUG : LogLevel.INFO);
        }

        this.isInitialized = true;
        this.logger.info('Optimization Engine initialized', this.config as unknown as Record<string, unknown>);
    }

    public async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
        if (!this.isInitialized) {
            throw new Error('Engine not initialized. Call init() first.');
        }

        const startTime = Date.now();
        const cacheKey = JSON.stringify(request);

        // Check cache first
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
            this.logger.debug(`Cache hit for request ${request.id}`);
            metricsCollector.record({
                requestId: request.id,
                type: request.type,
                durationMs: Date.now() - startTime,
                cacheHit: true,
                timestamp: Date.now()
            });
            return cachedResult;
        }

        try {
            // Validate request using Zod schema
            const validation = OptimizationRequestSchema.safeParse(request);
            if (!validation.success) {
                throw new Error(`Validation failed: ${validation.error.message}`);
            }

            this.logger.info(`Processing request ${request.id} of type ${request.type}`);

            // Try plugin system first if enabled
            if (this.config.enablePlugins) {
                const plugin = pluginRegistry.findPlugin(request);
                if (plugin) {
                    this.logger.debug(`Using plugin ${plugin.metadata.name} for request ${request.id}`);
                    const historicalData = this.config.enableWorkloadCollection 
                        ? workloadCollector.getDataByType(request.type)
                        : undefined;
                    const result = await plugin.optimize(request, historicalData);
                    
                    // Record workload data
                    if (this.config.enableWorkloadCollection) {
                        workloadCollector.record(request, result);
                    }
                    
                    return result;
                }
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

            const optimizationResult: OptimizationResult = {
                requestId: request.id,
                success: true,
                result: resultData,
                metrics: {
                    durationMs,
                    score: 1.0
                }
            };

            // Cache the result
            this.cache.set(cacheKey, optimizationResult);

            // Record workload data
            if (this.config.enableWorkloadCollection) {
                workloadCollector.record(request, optimizationResult);
            }

            // Record metrics
            metricsCollector.record({
                requestId: request.id,
                type: request.type,
                durationMs,
                cacheHit: false,
                timestamp: Date.now()
            });

            this.logger.info(`Request ${request.id} completed in ${durationMs}ms`);

            return optimizationResult;
        } catch (error) {
            const durationMs = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            this.logger.error(`Request ${request.id} failed`, { durationMs }, error instanceof Error ? error : undefined);

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

    public async shutdown(): Promise<void> {
        this.isInitialized = false;
        this.cache.clear();
        this.logger.info('Optimization Engine shutdown');
    }

    /**
     * Get cache statistics
     */
    public getCacheStats() {
        return this.cache.getStats();
    }

    /**
     * Get workload collector
     */
    public getWorkloadCollector() {
        return workloadCollector;
    }

    /**
     * Get plugin registry
     */
    public getPluginRegistry() {
        return pluginRegistry;
    }
}
