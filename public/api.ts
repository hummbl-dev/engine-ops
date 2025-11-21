/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { OptimizationEngine, EngineConfig, OptimizationRequest, OptimizationResult } from '../core/index.js';

/**
 * EngineOps: The public facade for the Engine Optimization Platform.
 * 
 * This class provides a stable, high-level interface for interacting with the
 * core optimization engine. It handles initialization, request validation (via Core),
 * and resource management.
 */
export class EngineOps {
  private engine: OptimizationEngine;

  constructor(config?: EngineConfig) {
    this.engine = new OptimizationEngine(config);
  }

  /**
   * Initialize the engine.
   * Must be called before submitting any requests.
   */
  public async init(): Promise<void> {
    await this.engine.init();
  }

  /**
   * Submit an optimization request.
   * 
   * @param request The optimization request containing type and data.
   * @returns The optimization result.
   */
  public async optimize(request: OptimizationRequest): Promise<OptimizationResult> {
    return this.engine.optimize(request);
  }

  /**
   * Shutdown the engine and release resources.
   */
  public async shutdown(): Promise<void> {
    await this.engine.shutdown();
  }

  /**
   * Get cache statistics
   */
  public getCacheStats() {
    return this.engine.getCacheStats();
  }
}

// Re-export types for public consumption
export { EngineConfig, OptimizationRequest, OptimizationResult };
