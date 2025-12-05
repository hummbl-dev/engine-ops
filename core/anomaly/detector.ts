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

export class AnomalyDetector {
  private config: Required<AnomalyDetectorConfig>;
  private metrics: Map<string, MetricValue[]>;
  private alerts: AnomalyAlert[];
  private analysisProvider?: AnalysisProvider;

  constructor(config: AnomalyDetectorConfig = {}, analysisProvider?: AnalysisProvider) {
    this.config = {
      windowSize: config.windowSize || 100,
      threshold: config.threshold || 3,
      minSamples: config.minSamples || 10,
      verbose: config.verbose || false,
    };
    this.metrics = new Map();
    this.alerts = [];
    this.analysisProvider = analysisProvider;
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, metadata?: Record<string, unknown>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricValues = this.metrics.get(name)!;
    metricValues.push({
      timestamp: Date.now(),
      value,
      metadata,
    });

    // Keep only the last windowSize values
    if (metricValues.length > this.config.windowSize) {
      metricValues.shift();
    }

    // Check for anomalies
    this.detectAnomaly(name, value);
  }

  /**
   * Detect if a value is anomalous
   */
  private detectAnomaly(metricName: string, value: number): void {
    const metricValues = this.metrics.get(metricName)!;

    // Need minimum samples
    if (metricValues.length < this.config.minSamples) {
      return;
    }

    const values = metricValues.map((m) => m.value);
    const stats = this.calculateStats(values);

    // Check if value is anomalous (outside threshold * stddev)
    // When stddev is 0 (all values identical), any different value is highly anomalous
    let deviation: number;
    if (stats.stddev === 0) {
      deviation = value === stats.mean ? 0 : Number.MAX_SAFE_INTEGER;
    } else {
      deviation = Math.abs(value - stats.mean) / stats.stddev;
    }

    if (deviation > this.config.threshold) {
      const severity = this.determineSeverity(deviation);
      const alert: AnomalyAlert = {
        timestamp: Date.now(),
        metricName,
        value,
        expectedValue: stats.mean,
        deviation,
        severity,
        message: `Anomaly detected in ${metricName}: value=${value.toFixed(2)}, expected=${stats.mean.toFixed(2)}, deviation=${deviation === Number.MAX_SAFE_INTEGER ? 'infinite' : deviation.toFixed(2)}σ`,
      };

      this.alerts.push(alert);

      if (this.config.verbose) {
        console.warn(`[ANOMALY] ${alert.message}`);
      }

      // Emit event (could be extended to use event emitter)
      this.onAnomalyDetected(alert);

      // Trigger AI analysis if provider is available
      if (this.analysisProvider) {
        // Mock logs for now - in real system would fetch from logger
        const mockLogs = ['[INFO] Processing request', '[WARN] High load detected'];
        this.analysisProvider.analyze(alert, mockLogs).then((analysis) => {
          if (this.config.verbose) {
            console.log(`[AI ANALYSIS] ${analysis.rootCauseHypothesis}`);
          }
          // Attach analysis to alert or emit new event
          // (For now just logging it)
        });
      }
    }
  }

  /**
   * Calculate statistical measures
   */
  private calculateStats(values: number[]): { mean: number; stddev: number } {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stddev = Math.sqrt(variance);

    return { mean, stddev };
  }

  /**
   * Determine severity based on deviation
   */
  private determineSeverity(deviation: number): 'low' | 'medium' | 'high' | 'critical' {
    if (deviation > 5) return 'critical';
    if (deviation > 4) return 'high';
    if (deviation > 3.5) return 'medium';
    return 'low';
  }

  /**
   * Hook for anomaly detection events
   */
  protected onAnomalyDetected(_alert: AnomalyAlert): void {
    // Override this method to handle anomaly alerts
    // Default: no-op
  }

  /**
   * Get all alerts
   */
  getAlerts(): AnomalyAlert[] {
    return [...this.alerts];
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(since: number): AnomalyAlert[] {
    return this.alerts.filter((a) => a.timestamp >= since);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }

  /**
   * Get metric history
   */
  getMetricHistory(name: string): MetricValue[] {
    return this.metrics.get(name) || [];
  }

  /**
   * Get all metric names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  /**
   * Get summary statistics for a metric
   */
  getMetricStats(name: string): { mean: number; stddev: number; min: number; max: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const numericValues = values.map((v) => v.value);
    const stats = this.calculateStats(numericValues);

    return {
      ...stats,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
    };
  }
}
