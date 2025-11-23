import { EngineConfig, OptimizationRequest, OptimizationResult } from '../core/index.js';
import { AnomalyDetector } from '../core/anomaly/detector.js';
import { CacheStats } from '../core/caching/lru-cache.js';
import { PluginRegistry } from '../core/plugins/registry.js';
import { WorkloadCollector } from '../core/plugins/workload-collector.js';
/**
 * EngineOps: The public facade for the Engine Optimization Platform.
 *
 * This class provides a stable, high-level interface for interacting with the
 * core optimization engine. It handles initialization, request validation (via Core),
 * and resource management.
 */
export declare class EngineOps {
    private engine;
    constructor(config?: EngineConfig);
    /**
     * Initialize the engine.
     * Must be called before submitting any requests.
     */
    init(): Promise<void>;
    /**
     * Submit an optimization request.
     *
     * @param request The optimization request containing type and data.
     * @returns The optimization result.
     */
    optimize(request: OptimizationRequest): Promise<OptimizationResult>;
    /**
     * Shutdown the engine and release resources.
     */
    shutdown(): Promise<void>;
    /**
     * Get cache statistics
     */
    getCacheStats(): CacheStats;
    /**
     * Get anomaly detector for monitoring
     */
    getAnomalyDetector(): AnomalyDetector;
    /**
     * Get plugin registry
     */
    getPluginRegistry(): PluginRegistry;
    /**
     * Get workload collector
     */
    getWorkloadCollector(): WorkloadCollector;
}
export type { EngineConfig, OptimizationRequest, OptimizationResult };
//# sourceMappingURL=api.d.ts.map