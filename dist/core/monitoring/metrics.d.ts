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
export declare class MetricsCollector {
    private metrics;
    private maxMetrics;
    constructor(maxMetrics?: number);
    /**
     * Record a performance metric
     */
    record(metric: PerformanceMetrics): void;
    /**
     * Get aggregated metrics
     */
    getAggregated(): AggregatedMetrics;
    /**
     * Get recent metrics
     */
    getRecent(count?: number): PerformanceMetrics[];
    /**
     * Clear all metrics
     */
    clear(): void;
    /**
     * Calculate percentile
     */
    private percentile;
}
export declare const metricsCollector: MetricsCollector;
//# sourceMappingURL=metrics.d.ts.map