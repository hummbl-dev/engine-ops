/**
 * Anomaly detection for engine operations
 */
import { AnalysisProvider } from './analysis';
export interface AnomalyDetectorConfig {
  /**
   * Window size for statistical calculations (in data points)
   */
  windowSize?: number;
  /**
   * Threshold for anomaly detection (standard deviations)
   */
  threshold?: number;
  /**
   * Minimum samples required before detecting anomalies
   */
  minSamples?: number;
  /**
   * Enable debug logging
   */
  verbose?: boolean;
}
export interface MetricValue {
  timestamp: number;
  value: number;
  metadata?: Record<string, unknown>;
}
export interface AnomalyAlert {
  timestamp: number;
  metricName: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}
export declare class AnomalyDetector {
  private config;
  private metrics;
  private alerts;
  private analysisProvider?;
  constructor(config?: AnomalyDetectorConfig, analysisProvider?: AnalysisProvider);
  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void;
  /**
   * Detect if a value is anomalous
   */
  private detectAnomaly;
  /**
   * Calculate statistical measures
   */
  private calculateStats;
  /**
   * Determine severity based on deviation
   */
  private determineSeverity;
  /**
   * Hook for anomaly detection events
   */
  protected onAnomalyDetected(_alert: AnomalyAlert): void;
  /**
   * Get all alerts
   */
  getAlerts(): AnomalyAlert[];
  /**
   * Get recent alerts
   */
  getRecentAlerts(since: number): AnomalyAlert[];
  /**
   * Clear all alerts
   */
  clearAlerts(): void;
  /**
   * Get metric history
   */
  getMetricHistory(name: string): MetricValue[];
  /**
   * Get all metric names
   */
  getMetricNames(): string[];
  /**
   * Get summary statistics for a metric
   */
  getMetricStats(name: string): {
    mean: number;
    stddev: number;
    min: number;
    max: number;
  } | null;
}
//# sourceMappingURL=detector.d.ts.map
