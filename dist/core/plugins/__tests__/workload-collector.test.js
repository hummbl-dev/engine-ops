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
const globals_1 = require('@jest/globals');
const workload_collector_js_1 = require('../workload-collector.js');
(0, globals_1.describe)('WorkloadCollector', () => {
  let collector;
  (0, globals_1.beforeEach)(() => {
    collector = new workload_collector_js_1.WorkloadCollector();
  });
  (0, globals_1.it)('should record workload data', () => {
    const request = {
      id: 'test-1',
      type: 'resource',
      data: { nodeCapacity: { cpu: 4, memory: 8192 } },
    };
    const result = {
      requestId: 'test-1',
      success: true,
      result: {},
      metrics: { durationMs: 100, score: 0.9 },
    };
    collector.record(request, result);
    const data = collector.getAllData();
    (0, globals_1.expect)(data).toHaveLength(1);
    (0, globals_1.expect)(data[0].requestType).toBe('resource');
    (0, globals_1.expect)(data[0].success).toBe(true);
  });
  (0, globals_1.it)('should filter data by type', () => {
    const requests = [
      { id: 'test-1', type: 'resource', data: {} },
      { id: 'test-2', type: 'scheduling', data: {} },
      { id: 'test-3', type: 'resource', data: {} },
    ];
    requests.forEach((req) => {
      collector.record(req, {
        requestId: req.id,
        success: true,
        metrics: { durationMs: 100, score: 1 },
      });
    });
    const resourceData = collector.getDataByType('resource');
    (0, globals_1.expect)(resourceData).toHaveLength(2);
    (0, globals_1.expect)(resourceData.every((d) => d.requestType === 'resource')).toBe(true);
  });
  (0, globals_1.it)('should filter data by time range', () => {
    const now = Date.now();
    const request = {
      id: 'test-1',
      type: 'resource',
      data: {},
    };
    collector.record(request, {
      requestId: 'test-1',
      success: true,
      metrics: { durationMs: 100, score: 1 },
    });
    const data = collector.getDataByTimeRange(now - 1000, now + 1000);
    (0, globals_1.expect)(data).toHaveLength(1);
    const emptyData = collector.getDataByTimeRange(now + 2000, now + 3000);
    (0, globals_1.expect)(emptyData).toHaveLength(0);
  });
  (0, globals_1.it)('should get recent data', () => {
    for (let i = 0; i < 5; i++) {
      collector.record(
        { id: `test-${i}`, type: 'resource', data: {} },
        { requestId: `test-${i}`, success: true, metrics: { durationMs: 100, score: 1 } },
      );
    }
    const recent = collector.getRecentData(3);
    (0, globals_1.expect)(recent).toHaveLength(3);
  });
  (0, globals_1.it)('should calculate statistics', () => {
    const requests = [
      { id: 'test-1', type: 'resource', data: {} },
      { id: 'test-2', type: 'resource', data: {} },
      { id: 'test-3', type: 'scheduling', data: {} },
    ];
    collector.record(requests[0], {
      requestId: 'test-1',
      success: true,
      metrics: { durationMs: 100, score: 1 },
    });
    collector.record(requests[1], {
      requestId: 'test-2',
      success: false,
      metrics: { durationMs: 200, score: 0 },
    });
    collector.record(requests[2], {
      requestId: 'test-3',
      success: true,
      metrics: { durationMs: 150, score: 1 },
    });
    const stats = collector.getStats();
    (0, globals_1.expect)(stats.totalRequests).toBe(3);
    (0, globals_1.expect)(stats.successRate).toBeCloseTo(2 / 3);
    (0, globals_1.expect)(stats.avgDuration).toBeCloseTo(150);
    (0, globals_1.expect)(stats.byType['resource']).toBeDefined();
    (0, globals_1.expect)(stats.byType['resource'].count).toBe(2);
  });
  (0, globals_1.it)('should export data for training', () => {
    const request = {
      id: 'test-1',
      type: 'resource',
      data: {},
    };
    collector.record(request, {
      requestId: 'test-1',
      success: true,
      metrics: { durationMs: 100, score: 1 },
    });
    const exported = collector.exportForTraining();
    (0, globals_1.expect)(exported.features).toHaveLength(1);
    (0, globals_1.expect)(exported.labels).toHaveLength(1);
    (0, globals_1.expect)(exported.metadata.size).toBe(1);
  });
  (0, globals_1.it)('should maintain max size', () => {
    const smallCollector = new workload_collector_js_1.WorkloadCollector({ maxDataPoints: 5 });
    for (let i = 0; i < 10; i++) {
      smallCollector.record(
        { id: `test-${i}`, type: 'resource', data: {} },
        { requestId: `test-${i}`, success: true, metrics: { durationMs: 100, score: 1 } },
      );
    }
    const data = smallCollector.getAllData();
    (0, globals_1.expect)(data).toHaveLength(5);
  });
  (0, globals_1.it)('should clear all data', () => {
    collector.record(
      { id: 'test-1', type: 'resource', data: {} },
      { requestId: 'test-1', success: true, metrics: { durationMs: 100, score: 1 } },
    );
    collector.clear();
    (0, globals_1.expect)(collector.getAllData()).toHaveLength(0);
  });
});
