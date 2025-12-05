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

export interface EngineConfig {
  /**
   * Maximum number of concurrent optimization tasks
   */
  maxConcurrentTasks?: number;

  /**
   * Timeout in milliseconds for optimization operations
   */
  timeoutMs?: number;

  /**
   * Whether to enable verbose logging
   */
  verbose?: boolean;

  /**
   * Enable multi-cloud resource management
   */
  enableMultiCloud?: boolean;

  /**
   * Cloud providers to enable (when multi-cloud is enabled)
   */
  cloudProviders?: Array<'aws' | 'gcp' | 'azure' | 'edge'>;
  /**
   * Whether to enable plugin system
   */
  enablePlugins?: boolean;

  /**
   * Whether to collect workload data for ML training
   */
  enableWorkloadCollection?: boolean;
}

export interface OptimizationRequest {
  /**
   * Unique identifier for the request
   */
  id: string;

  /**
   * Type of optimization to perform
   */
  type: 'resource' | 'scheduling' | 'performance' | 'ml-driven';

  /**
   * Input data for the optimization
   */
  data: Record<string, unknown>;

  /**
   * Optional constraints for the optimization
   */
  constraints?: Record<string, unknown>;
}

export interface OptimizationResult {
  /**
   * ID of the request this result corresponds to
   */
  requestId: string;

  /**
   * Whether the optimization was successful
   */
  success: boolean;

  /**
   * The optimized result data
   */
  result?: Record<string, unknown>;

  /**
   * Error message if optimization failed
   */
  error?: string;

  /**
   * Metrics related to the optimization process
   */
  metrics?: {
    durationMs: number;
    score?: number;
  };
}

export interface IEngine {
  /**
   * Initialize the engine with configuration
   */
  init(config: EngineConfig): Promise<void>;

  /**
   * Submit an optimization request
   */
  optimize(request: OptimizationRequest): Promise<OptimizationResult>;

  /**
   * Shutdown the engine and release resources
   */
  shutdown(): Promise<void>;
}
