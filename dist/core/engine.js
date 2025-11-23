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
exports.OptimizationEngine = void 0;
const validation_js_1 = require("../schemas/validation.js");
const bin_packing_js_1 = require("./algorithms/bin-packing.js");
const least_loaded_js_1 = require("./algorithms/least-loaded.js");
const lru_cache_js_1 = require("./caching/lru-cache.js");
const logger_js_1 = require("./monitoring/logger.js");
const metrics_js_1 = require("./monitoring/metrics.js");
const detector_js_1 = require("./anomaly/detector.js");
const resource_manager_js_1 = require("./providers/resource-manager.js");
const aws_provider_js_1 = require("./providers/aws-provider.js");
const gcp_provider_js_1 = require("./providers/gcp-provider.js");
const azure_provider_js_1 = require("./providers/azure-provider.js");
const edge_provider_js_1 = require("./providers/edge-provider.js");
const registry_js_1 = require("./plugins/registry.js");
const workload_collector_js_1 = require("./plugins/workload-collector.js");
class OptimizationEngine {
    config;
    isInitialized = false;
    cache;
    logger;
    anomalyDetector;
    multiCloudManager;
    constructor(config = {}) {
        this.config = {
            maxConcurrentTasks: 5,
            timeoutMs: 30000,
            verbose: false,
            enableMultiCloud: false,
            enablePlugins: false,
            enableWorkloadCollection: false,
            ...config
        };
        // Initialize cache
        this.cache = new lru_cache_js_1.LRUCache({
            maxSize: 100,
            ttlMs: 300000, // 5 minutes
            enableStats: true
        });
        // Initialize logger
        this.logger = new logger_js_1.Logger({
            level: this.config.verbose ? logger_js_1.LogLevel.DEBUG : logger_js_1.LogLevel.INFO,
            enableConsole: true,
            enableTimestamps: true
        });
        // Initialize anomaly detector
        this.anomalyDetector = new detector_js_1.AnomalyDetector({
            windowSize: 100,
            threshold: 3,
            minSamples: 10,
            verbose: this.config.verbose
        });
    }
    async init(config) {
        if (config) {
            this.config = { ...this.config, ...config };
            this.logger.setLevel(this.config.verbose ? logger_js_1.LogLevel.DEBUG : logger_js_1.LogLevel.INFO);
        }
        // Initialize multi-cloud resource manager if enabled
        if (this.config.enableMultiCloud) {
            await this.initializeMultiCloud();
        }
        this.isInitialized = true;
        this.logger.info('Optimization Engine initialized', this.config);
    }
    async initializeMultiCloud() {
        this.multiCloudManager = new resource_manager_js_1.MultiCloudResourceManager();
        const providers = this.config.cloudProviders || ['aws', 'gcp', 'azure', 'edge'];
        for (const providerType of providers) {
            let provider;
            switch (providerType) {
                case 'aws':
                    provider = new aws_provider_js_1.AWSProvider();
                    break;
                case 'gcp':
                    provider = new gcp_provider_js_1.GCPProvider();
                    break;
                case 'azure':
                    provider = new azure_provider_js_1.AzureProvider();
                    break;
                case 'edge':
                    provider = new edge_provider_js_1.EdgeProvider();
                    break;
            }
            await provider.initialize({});
            this.multiCloudManager.registerProvider(provider);
            this.logger.info(`Registered ${providerType} provider`);
        }
    }
    async optimize(request) {
        if (!this.isInitialized) {
            throw new Error('Engine not initialized. Call init() first.');
        }
        const startTime = Date.now();
        const cacheKey = JSON.stringify(request);
        // Check cache first
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
            this.logger.debug(`Cache hit for request ${request.id}`);
            const duration = Date.now() - startTime;
            metrics_js_1.metricsCollector.record({
                requestId: request.id,
                type: request.type,
                durationMs: duration,
                cacheHit: true,
                timestamp: Date.now()
            });
            // Record metric for anomaly detection
            this.anomalyDetector.recordMetric('request_duration_ms', duration);
            return cachedResult;
        }
        try {
            // Validate request using Zod schema
            const validation = validation_js_1.OptimizationRequestSchema.safeParse(request);
            if (!validation.success) {
                throw new Error(`Validation failed: ${validation.error.message}`);
            }
            this.logger.info(`Processing request ${request.id} of type ${request.type}`);
            // Try plugin system first if enabled
            if (this.config.enablePlugins) {
                const plugin = registry_js_1.pluginRegistry.findPlugin(request);
                if (plugin) {
                    this.logger.debug(`Using plugin ${plugin.metadata.name} for request ${request.id}`);
                    const historicalData = this.config.enableWorkloadCollection
                        ? workload_collector_js_1.workloadCollector.getDataByType(request.type)
                        : undefined;
                    const result = await plugin.optimize(request, historicalData);
                    // Record workload data
                    if (this.config.enableWorkloadCollection) {
                        workload_collector_js_1.workloadCollector.record(request, result);
                    }
                    return result;
                }
            }
            let resultData = {};
            if (request.type === 'resource') {
                const items = request.data.items;
                const nodeCapacity = request.data.nodeCapacity;
                if (!items || !nodeCapacity) {
                    throw new Error('Missing items or nodeCapacity for resource optimization');
                }
                const optimizer = new bin_packing_js_1.BinPackingOptimizer();
                resultData = optimizer.optimize(items, nodeCapacity);
            }
            else if (request.type === 'scheduling') {
                const task = request.data.task;
                const nodes = request.data.nodes;
                if (!task || !nodes) {
                    throw new Error('Missing task or nodes for scheduling optimization');
                }
                const scheduler = new least_loaded_js_1.LeastLoadedScheduler();
                const result = scheduler.schedule(task, nodes);
                if (!result) {
                    throw new Error('Scheduling failed: No suitable node found');
                }
                resultData = result;
            }
            else {
                // Mock for other types
                resultData = { optimized: true, originalData: request.data };
            }
            const durationMs = Date.now() - startTime;
            const optimizationResult = {
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
                workload_collector_js_1.workloadCollector.record(request, optimizationResult);
            }
            // Record metrics
            metrics_js_1.metricsCollector.record({
                requestId: request.id,
                type: request.type,
                durationMs,
                cacheHit: false,
                timestamp: Date.now()
            });
            // Record for anomaly detection
            this.anomalyDetector.recordMetric('request_duration_ms', durationMs);
            this.logger.info(`Request ${request.id} completed in ${durationMs}ms`);
            return optimizationResult;
        }
        catch (error) {
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
    async shutdown() {
        this.isInitialized = false;
        this.cache.clear();
        this.logger.info('Optimization Engine shutdown');
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Get anomaly detector instance
     */
    getAnomalyDetector() {
        return this.anomalyDetector;
    }
    /**
     * Get the multi-cloud resource manager instance
     */
    getMultiCloudManager() {
        return this.multiCloudManager;
    }
    /**
     * Schedule workloads across multiple cloud providers
     */
    async scheduleMultiCloudWorkloads(workloads, enableGeoSharding = true) {
        if (!this.isInitialized) {
            throw new Error('Engine not initialized. Call init() first.');
        }
        if (!this.multiCloudManager) {
            throw new Error('Multi-cloud is not enabled. Set enableMultiCloud to true in config.');
        }
        const startTime = Date.now();
        try {
            let results;
            if (enableGeoSharding) {
                results = await this.multiCloudManager.scheduleWorkloadsWithGeoSharding(workloads);
            }
            else {
                // Schedule workloads individually without geo-sharding
                results = [];
                for (const workload of workloads) {
                    const result = await this.multiCloudManager.scheduleWorkload(workload);
                    if (result) {
                        results.push(result);
                    }
                }
            }
            const durationMs = Date.now() - startTime;
            return {
                requestId: `multi-cloud-${Date.now()}`,
                success: true,
                result: {
                    placements: results,
                    totalScheduled: results.length,
                    totalRequested: workloads.length,
                },
                metrics: {
                    durationMs,
                    score: results.length / workloads.length,
                },
            };
        }
        catch (error) {
            const durationMs = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Multi-cloud scheduling failed', { durationMs }, error instanceof Error ? error : undefined);
            return {
                requestId: `multi-cloud-${Date.now()}`,
                success: false,
                error: errorMessage,
                metrics: {
                    durationMs,
                    score: 0,
                },
            };
        }
    }
    /**
     * Get plugin registry
     */
    getPluginRegistry() {
        return registry_js_1.pluginRegistry;
    }
    /**
     * Get workload collector
     */
    getWorkloadCollector() {
        return workload_collector_js_1.workloadCollector;
    }
}
exports.OptimizationEngine = OptimizationEngine;
