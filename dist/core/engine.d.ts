import { IEngine, EngineConfig, OptimizationRequest, OptimizationResult } from './interfaces.js';
import { CacheStats } from './caching/lru-cache.js';
import { AnomalyDetector } from './anomaly/detector.js';
import { MultiCloudResourceManager } from './providers/resource-manager.js';
import type { Workload } from './providers/interfaces.js';
import { PluginRegistry } from './plugins/registry.js';
import { WorkloadCollector } from './plugins/workload-collector.js';
export declare class OptimizationEngine implements IEngine {
  private config;
  private isInitialized;
  private cache;
  private logger;
  private anomalyDetector;
  private multiCloudManager?;
  constructor(config?: EngineConfig);
  init(config?: EngineConfig): Promise<void>;
  private initializeMultiCloud;
  optimize(request: OptimizationRequest): Promise<OptimizationResult>;
  shutdown(): Promise<void>;
  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats;
  /**
   * Get anomaly detector instance
   */
  getAnomalyDetector(): AnomalyDetector;
  /**
   * Get the multi-cloud resource manager instance
   */
  getMultiCloudManager(): MultiCloudResourceManager | undefined;
  /**
   * Schedule workloads across multiple cloud providers
   */
  scheduleMultiCloudWorkloads(
    workloads: Workload[],
    enableGeoSharding?: boolean,
  ): Promise<OptimizationResult>;
  /**
   * Get plugin registry
   */
  getPluginRegistry(): PluginRegistry;
  /**
   * Get workload collector
   */
  getWorkloadCollector(): WorkloadCollector;
}
//# sourceMappingURL=engine.d.ts.map
