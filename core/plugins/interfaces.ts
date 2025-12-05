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

/**
 * Historical workload data point
 */
export interface WorkloadDataPoint {
  timestamp: number;
  requestType: string;
  resourceUsage: Record<string, number>;
  duration: number;
  success: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  supportedTypes: string[];
}

/**
 * Plugin configuration
 */
export interface PluginConfig {
  enabled: boolean;
  priority: number;
  config?: Record<string, unknown>;
}

/**
 * Base interface for optimization plugins
 */
export interface IOptimizationPlugin {
  /**
   * Plugin metadata
   */
  readonly metadata: PluginMetadata;

  /**
   * Initialize the plugin
   */
  init(config?: PluginConfig): Promise<void>;

  /**
   * Check if plugin can handle a request
   */
  canHandle(request: OptimizationRequest): boolean;

  /**
   * Execute optimization
   */
  optimize(
    request: OptimizationRequest,
    historicalData?: WorkloadDataPoint[],
  ): Promise<OptimizationResult>;

  /**
   * Cleanup and release resources
   */
  shutdown(): Promise<void>;
}

/**
 * ML Model interface for custom models
 */
export interface IMLModel {
  /**
   * Model identifier
   */
  readonly modelId: string;

  /**
   * Train the model with historical data
   */
  train(data: WorkloadDataPoint[]): Promise<void>;

  /**
   * Make predictions based on input
   */
  predict(input: Record<string, unknown>): Promise<Record<string, unknown>>;

  /**
   * Get model metadata
   */
  getMetadata(): Record<string, unknown>;
}

/**
 * Plugin registry event types
 */
export enum PluginEvent {
  REGISTERED = 'plugin:registered',
  UNREGISTERED = 'plugin:unregistered',
  ENABLED = 'plugin:enabled',
  DISABLED = 'plugin:disabled',
  ERROR = 'plugin:error',
}

/**
 * Plugin event data
 */
export interface PluginEventData {
  pluginName: string;
  timestamp: number;
  data?: unknown;
  error?: Error;
}
