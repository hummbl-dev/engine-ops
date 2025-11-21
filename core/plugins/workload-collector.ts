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

import { WorkloadDataPoint } from './interfaces.js';
import { OptimizationRequest, OptimizationResult } from '../interfaces.js';

/**
 * Configuration for workload collector
 */
export interface WorkloadCollectorConfig {
    maxDataPoints?: number;
    enablePersistence?: boolean;
    aggregationWindowMs?: number;
}

/**
 * Collects and manages historical workload data
 */
export class WorkloadCollector {
    private dataPoints: WorkloadDataPoint[] = [];
    private config: Required<WorkloadCollectorConfig>;

    constructor(config: WorkloadCollectorConfig = {}) {
        this.config = {
            maxDataPoints: config.maxDataPoints ?? 10000,
            enablePersistence: config.enablePersistence ?? false,
            aggregationWindowMs: config.aggregationWindowMs ?? 60000 // 1 minute
        };
    }

    /**
     * Record a workload data point
     */
    public record(request: OptimizationRequest, result: OptimizationResult): void {
        const dataPoint: WorkloadDataPoint = {
            timestamp: Date.now(),
            requestType: request.type,
            resourceUsage: this.extractResourceUsage(request, result),
            duration: result.metrics?.durationMs || 0,
            success: result.success,
            metadata: {
                requestId: request.id,
                score: result.metrics?.score
            }
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
    public getAllData(): WorkloadDataPoint[] {
        return [...this.dataPoints];
    }

    /**
     * Get data filtered by type
     */
    public getDataByType(requestType: string): WorkloadDataPoint[] {
        return this.dataPoints.filter(dp => dp.requestType === requestType);
    }

    /**
     * Get data within time range
     */
    public getDataByTimeRange(startTime: number, endTime: number): WorkloadDataPoint[] {
        return this.dataPoints.filter(
            dp => dp.timestamp >= startTime && dp.timestamp <= endTime
        );
    }

    /**
     * Get recent data points
     */
    public getRecentData(count: number): WorkloadDataPoint[] {
        return this.dataPoints.slice(-count);
    }

    /**
     * Get aggregated statistics
     */
    public getStats(): {
        totalRequests: number;
        successRate: number;
        avgDuration: number;
        byType: Record<string, { count: number; successRate: number; avgDuration: number }>;
    } {
        if (this.dataPoints.length === 0) {
            return {
                totalRequests: 0,
                successRate: 0,
                avgDuration: 0,
                byType: {}
            };
        }

        const totalRequests = this.dataPoints.length;
        const successCount = this.dataPoints.filter(dp => dp.success).length;
        const totalDuration = this.dataPoints.reduce((sum, dp) => sum + dp.duration, 0);

        // Stats by type
        const typeMap: Record<string, WorkloadDataPoint[]> = {};
        for (const dp of this.dataPoints) {
            if (!typeMap[dp.requestType]) {
                typeMap[dp.requestType] = [];
            }
            typeMap[dp.requestType].push(dp);
        }

        const byType: Record<string, { count: number; successRate: number; avgDuration: number }> = {};
        for (const [type, points] of Object.entries(typeMap)) {
            const typeSuccessCount = points.filter(dp => dp.success).length;
            const typeTotalDuration = points.reduce((sum, dp) => sum + dp.duration, 0);
            byType[type] = {
                count: points.length,
                successRate: typeSuccessCount / points.length,
                avgDuration: typeTotalDuration / points.length
            };
        }

        return {
            totalRequests,
            successRate: successCount / totalRequests,
            avgDuration: totalDuration / totalRequests,
            byType
        };
    }

    /**
     * Clear all data
     */
    public clear(): void {
        this.dataPoints = [];
    }

    /**
     * Export data for ML training
     */
    public exportForTraining(): {
        features: number[][];
        labels: number[];
        metadata: { featureNames: string[]; size: number };
    } {
        const featureNames = ['timestamp', 'duration', 'success'];
        const features: number[][] = [];
        const labels: number[] = [];

        for (const dp of this.dataPoints) {
            features.push([dp.timestamp, dp.duration, dp.success ? 1 : 0]);
            labels.push(dp.success ? 1 : 0);
        }

        return {
            features,
            labels,
            metadata: {
                featureNames,
                size: this.dataPoints.length
            }
        };
    }

    private extractResourceUsage(
        request: OptimizationRequest,
        result: OptimizationResult
    ): Record<string, number> {
        const usage: Record<string, number> = {};

        // Extract from request data
        if (request.data.nodeCapacity) {
            const capacity = request.data.nodeCapacity as Record<string, unknown>;
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

// Singleton instance
export const workloadCollector = new WorkloadCollector();
