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

export interface PerformanceMetrics {
  requestId: string;
  type: string;
  durationMs: number;
  cacheHit: boolean;
  memoryUsageMB?: number;
  timestamp: number;
}

export interface AggregatedMetrics {
  totalRequests: number;
  averageDurationMs: number;
  cacheHitRate: number;
  requestsByType: Record<string, number>;
  p50DurationMs: number;
  p95DurationMs: number;
  p99DurationMs: number;
}

/**
 * Performance metrics collector
 */
export class MetricsCollector {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics: number;

  constructor(maxMetrics: number = 1000) {
    this.maxMetrics = maxMetrics;
  }

  /**
   * Record a performance metric
   */
  public record(metric: PerformanceMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Get aggregated metrics
   */
  public getAggregated(): AggregatedMetrics {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageDurationMs: 0,
        cacheHitRate: 0,
        requestsByType: {},
        p50DurationMs: 0,
        p95DurationMs: 0,
        p99DurationMs: 0,
      };
    }

    const durations = this.metrics.map((m) => m.durationMs).sort((a, b) => a - b);
    const cacheHits = this.metrics.filter((m) => m.cacheHit).length;
    const requestsByType: Record<string, number> = {};

    for (const metric of this.metrics) {
      requestsByType[metric.type] = (requestsByType[metric.type] || 0) + 1;
    }

    return {
      totalRequests: this.metrics.length,
      averageDurationMs: durations.reduce((a, b) => a + b, 0) / durations.length,
      cacheHitRate: cacheHits / this.metrics.length,
      requestsByType,
      p50DurationMs: this.percentile(durations, 0.5),
      p95DurationMs: this.percentile(durations, 0.95),
      p99DurationMs: this.percentile(durations, 0.99),
    };
  }

  /**
   * Get recent metrics
   */
  public getRecent(count: number = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  /**
   * Clear all metrics
   */
  public clear(): void {
    this.metrics = [];
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)] || 0;
  }
}

// Global metrics collector
export const metricsCollector = new MetricsCollector();
