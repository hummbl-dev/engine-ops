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
import {
  IOptimizationPlugin,
  PluginMetadata,
  PluginConfig,
  WorkloadDataPoint,
} from './interfaces.js';

/**
 * Base abstract class for optimization plugins
 */
export abstract class BaseOptimizationPlugin implements IOptimizationPlugin {
  public abstract readonly metadata: PluginMetadata;
  protected config?: PluginConfig;
  protected isInitialized: boolean = false;

  public async init(config?: PluginConfig): Promise<void> {
    this.config = config;
    this.isInitialized = true;
  }

  public abstract canHandle(request: OptimizationRequest): boolean;

  public abstract optimize(
    request: OptimizationRequest,
    historicalData?: WorkloadDataPoint[],
  ): Promise<OptimizationResult>;

  public async shutdown(): Promise<void> {
    this.isInitialized = false;
  }

  protected checkInitialized(): void {
    if (!this.isInitialized) {
      throw new Error(`Plugin ${this.metadata.name} not initialized`);
    }
  }
}
