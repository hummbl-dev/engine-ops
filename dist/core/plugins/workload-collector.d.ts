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
export declare class WorkloadCollector {
    private dataPoints;
    private config;
    constructor(config?: WorkloadCollectorConfig);
    /**
     * Record a workload data point
     */
    record(request: OptimizationRequest, result: OptimizationResult): void;
    /**
     * Get all historical data
     */
    getAllData(): WorkloadDataPoint[];
    /**
     * Get data filtered by type
     */
    getDataByType(requestType: string): WorkloadDataPoint[];
    /**
     * Get data within time range
     */
    getDataByTimeRange(startTime: number, endTime: number): WorkloadDataPoint[];
    /**
     * Get recent data points
     */
    getRecentData(count: number): WorkloadDataPoint[];
    /**
     * Get aggregated statistics
     */
    getStats(): {
        totalRequests: number;
        successRate: number;
        avgDuration: number;
        byType: Record<string, {
            count: number;
            successRate: number;
            avgDuration: number;
        }>;
    };
    /**
     * Clear all data
     */
    clear(): void;
    /**
     * Export data for ML training
     */
    exportForTraining(): {
        features: number[][];
        labels: number[];
        metadata: {
            featureNames: string[];
            size: number;
        };
    };
    private extractResourceUsage;
}
export declare const workloadCollector: WorkloadCollector;
//# sourceMappingURL=workload-collector.d.ts.map