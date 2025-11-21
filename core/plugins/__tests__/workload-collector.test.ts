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

import { describe, it, expect, beforeEach } from '@jest/globals';
import { WorkloadCollector } from '../workload-collector.js';
import { OptimizationRequest, OptimizationResult } from '../../interfaces.js';

describe('WorkloadCollector', () => {
    let collector: WorkloadCollector;

    beforeEach(() => {
        collector = new WorkloadCollector();
    });

    it('should record workload data', () => {
        const request: OptimizationRequest = {
            id: 'test-1',
            type: 'resource',
            data: { nodeCapacity: { cpu: 4, memory: 8192 } }
        };

        const result: OptimizationResult = {
            requestId: 'test-1',
            success: true,
            result: {},
            metrics: { durationMs: 100, score: 0.9 }
        };

        collector.record(request, result);
        const data = collector.getAllData();

        expect(data).toHaveLength(1);
        expect(data[0].requestType).toBe('resource');
        expect(data[0].success).toBe(true);
    });

    it('should filter data by type', () => {
        const requests: OptimizationRequest[] = [
            { id: 'test-1', type: 'resource', data: {} },
            { id: 'test-2', type: 'scheduling', data: {} },
            { id: 'test-3', type: 'resource', data: {} }
        ];

        requests.forEach(req => {
            collector.record(req, {
                requestId: req.id,
                success: true,
                metrics: { durationMs: 100, score: 1 }
            });
        });

        const resourceData = collector.getDataByType('resource');
        expect(resourceData).toHaveLength(2);
        expect(resourceData.every(d => d.requestType === 'resource')).toBe(true);
    });

    it('should filter data by time range', () => {
        const now = Date.now();
        const request: OptimizationRequest = {
            id: 'test-1',
            type: 'resource',
            data: {}
        };

        collector.record(request, {
            requestId: 'test-1',
            success: true,
            metrics: { durationMs: 100, score: 1 }
        });

        const data = collector.getDataByTimeRange(now - 1000, now + 1000);
        expect(data).toHaveLength(1);

        const emptyData = collector.getDataByTimeRange(now + 2000, now + 3000);
        expect(emptyData).toHaveLength(0);
    });

    it('should get recent data', () => {
        for (let i = 0; i < 5; i++) {
            collector.record(
                { id: `test-${i}`, type: 'resource', data: {} },
                { requestId: `test-${i}`, success: true, metrics: { durationMs: 100, score: 1 } }
            );
        }

        const recent = collector.getRecentData(3);
        expect(recent).toHaveLength(3);
    });

    it('should calculate statistics', () => {
        const requests: OptimizationRequest[] = [
            { id: 'test-1', type: 'resource', data: {} },
            { id: 'test-2', type: 'resource', data: {} },
            { id: 'test-3', type: 'scheduling', data: {} }
        ];

        collector.record(requests[0], {
            requestId: 'test-1',
            success: true,
            metrics: { durationMs: 100, score: 1 }
        });

        collector.record(requests[1], {
            requestId: 'test-2',
            success: false,
            metrics: { durationMs: 200, score: 0 }
        });

        collector.record(requests[2], {
            requestId: 'test-3',
            success: true,
            metrics: { durationMs: 150, score: 1 }
        });

        const stats = collector.getStats();
        expect(stats.totalRequests).toBe(3);
        expect(stats.successRate).toBeCloseTo(2 / 3);
        expect(stats.avgDuration).toBeCloseTo(150);
        expect(stats.byType['resource']).toBeDefined();
        expect(stats.byType['resource'].count).toBe(2);
    });

    it('should export data for training', () => {
        const request: OptimizationRequest = {
            id: 'test-1',
            type: 'resource',
            data: {}
        };

        collector.record(request, {
            requestId: 'test-1',
            success: true,
            metrics: { durationMs: 100, score: 1 }
        });

        const exported = collector.exportForTraining();
        expect(exported.features).toHaveLength(1);
        expect(exported.labels).toHaveLength(1);
        expect(exported.metadata.size).toBe(1);
    });

    it('should maintain max size', () => {
        const smallCollector = new WorkloadCollector({ maxDataPoints: 5 });

        for (let i = 0; i < 10; i++) {
            smallCollector.record(
                { id: `test-${i}`, type: 'resource', data: {} },
                { requestId: `test-${i}`, success: true, metrics: { durationMs: 100, score: 1 } }
            );
        }

        const data = smallCollector.getAllData();
        expect(data).toHaveLength(5);
    });

    it('should clear all data', () => {
        collector.record(
            { id: 'test-1', type: 'resource', data: {} },
            { requestId: 'test-1', success: true, metrics: { durationMs: 100, score: 1 } }
        );

        collector.clear();
        expect(collector.getAllData()).toHaveLength(0);
    });
});
