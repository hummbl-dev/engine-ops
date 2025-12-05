'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.workloadCollector = exports.WorkloadCollector = void 0;
// Constants
const DEFAULT_MAX_DATA_POINTS = 10000;
const DEFAULT_AGGREGATION_WINDOW_MS = 60000; // 1 minute
/**
 * Collects and manages historical workload data
 */
class WorkloadCollector {
  dataPoints = [];
  config;
  constructor(config = {}) {
    this.config = {
      maxDataPoints: config.maxDataPoints ?? DEFAULT_MAX_DATA_POINTS,
      enablePersistence: config.enablePersistence ?? false,
      aggregationWindowMs: config.aggregationWindowMs ?? DEFAULT_AGGREGATION_WINDOW_MS,
    };
  }
  /**
   * Record a workload data point
   */
  record(request, result) {
    const dataPoint = {
      timestamp: Date.now(),
      requestType: request.type,
      resourceUsage: this.extractResourceUsage(request, result),
      duration: result.metrics?.durationMs || 0,
      success: result.success,
      metadata: {
        requestId: request.id,
        score: result.metrics?.score,
      },
    };
    this.dataPoints.push(dataPoint);
    // Maintain max size
    if (this.dataPoints.length > this.config.maxDataPoints) {
      this.dataPoints.shift();
    }
  }
  /**
   * Get all historical data
   */
  getAllData() {
    return [...this.dataPoints];
  }
  /**
   * Get data filtered by type
   */
  getDataByType(requestType) {
    return this.dataPoints.filter((dp) => dp.requestType === requestType);
  }
  /**
   * Get data within time range
   */
  getDataByTimeRange(startTime, endTime) {
    return this.dataPoints.filter((dp) => dp.timestamp >= startTime && dp.timestamp <= endTime);
  }
  /**
   * Get recent data points
   */
  getRecentData(count) {
    return this.dataPoints.slice(-count);
  }
  /**
   * Get aggregated statistics
   */
  getStats() {
    if (this.dataPoints.length === 0) {
      return {
        totalRequests: 0,
        successRate: 0,
        avgDuration: 0,
        byType: {},
      };
    }
    const totalRequests = this.dataPoints.length;
    const successCount = this.dataPoints.filter((dp) => dp.success).length;
    const totalDuration = this.dataPoints.reduce((sum, dp) => sum + dp.duration, 0);
    // Stats by type
    const typeMap = {};
    for (const dp of this.dataPoints) {
      if (!typeMap[dp.requestType]) {
        typeMap[dp.requestType] = [];
      }
      typeMap[dp.requestType].push(dp);
    }
    const byType = {};
    for (const [type, points] of Object.entries(typeMap)) {
      const typeSuccessCount = points.filter((dp) => dp.success).length;
      const typeTotalDuration = points.reduce((sum, dp) => sum + dp.duration, 0);
      byType[type] = {
        count: points.length,
        successRate: typeSuccessCount / points.length,
        avgDuration: typeTotalDuration / points.length,
      };
    }
    return {
      totalRequests,
      successRate: successCount / totalRequests,
      avgDuration: totalDuration / totalRequests,
      byType,
    };
  }
  /**
   * Clear all data
   */
  clear() {
    this.dataPoints = [];
  }
  /**
   * Export data for ML training
   */
  exportForTraining() {
    const featureNames = ['timestamp', 'duration', 'success'];
    const features = [];
    const labels = [];
    for (const dp of this.dataPoints) {
      features.push([dp.timestamp, dp.duration, dp.success ? 1 : 0]);
      labels.push(dp.success ? 1 : 0);
    }
    return {
      features,
      labels,
      metadata: {
        featureNames,
        size: this.dataPoints.length,
      },
    };
  }
  extractResourceUsage(request, result) {
    const usage = {};
    // Extract from request data
    if (request.data.nodeCapacity) {
      const capacity = request.data.nodeCapacity;
      if (typeof capacity.cpu === 'number') usage.cpu = capacity.cpu;
      if (typeof capacity.memory === 'number') usage.memory = capacity.memory;
    }
    // Extract from result
    if (result.metrics?.score) {
      usage.score = result.metrics.score;
    }
    return usage;
  }
}
exports.WorkloadCollector = WorkloadCollector;
// Singleton instance
exports.workloadCollector = new WorkloadCollector();
