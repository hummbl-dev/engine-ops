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
import { AnomalyDetector } from '../detector.js';

describe('AnomalyDetector', () => {
    let detector: AnomalyDetector;

    beforeEach(() => {
        detector = new AnomalyDetector({
            windowSize: 20,
            threshold: 3,
            minSamples: 5,
            verbose: false
        });
    });

    it('should record metrics', () => {
        detector.recordMetric('response_time', 100);
        detector.recordMetric('response_time', 110);
        detector.recordMetric('response_time', 95);

        const history = detector.getMetricHistory('response_time');
        expect(history.length).toBe(3);
        expect(history[0].value).toBe(100);
    });

    it('should not detect anomalies with insufficient samples', () => {
        detector.recordMetric('response_time', 100);
        detector.recordMetric('response_time', 110);
        detector.recordMetric('response_time', 1000); // anomalous value

        const alerts = detector.getAlerts();
        expect(alerts.length).toBe(0);
    });

    it('should detect anomalies after sufficient samples', () => {
        // Record normal values
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('response_time', 100 + Math.random() * 10);
        }

        // Record anomalous value
        detector.recordMetric('response_time', 500);

        const alerts = detector.getAlerts();
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0].metricName).toBe('response_time');
        expect(alerts[0].value).toBe(500);
    });

    it('should calculate correct statistics', () => {
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('test_metric', i * 10);
        }

        const stats = detector.getMetricStats('test_metric');
        expect(stats).not.toBeNull();
        expect(stats!.mean).toBeCloseTo(45, 1);
        expect(stats!.min).toBe(0);
        expect(stats!.max).toBe(90);
    });

    it('should clear alerts', () => {
        // Generate some anomalies
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('response_time', 100);
        }
        detector.recordMetric('response_time', 500);

        expect(detector.getAlerts().length).toBeGreaterThan(0);

        detector.clearAlerts();
        expect(detector.getAlerts().length).toBe(0);
    });

    it('should get recent alerts', () => {
        // Generate some anomalies
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('response_time', 100);
        }
        detector.recordMetric('response_time', 500);

        const now = Date.now();
        const recent = detector.getRecentAlerts(now - 1000);
        expect(recent.length).toBeGreaterThan(0);
    });

    it('should maintain window size', () => {
        const windowSize = 20;
        const detector = new AnomalyDetector({ windowSize });

        // Record more than window size
        for (let i = 0; i < 30; i++) {
            detector.recordMetric('test', i);
        }

        const history = detector.getMetricHistory('test');
        expect(history.length).toBe(windowSize);
    });

    it('should classify severity correctly', () => {
        // Record normal values
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('test', 100);
        }

        // Record critically anomalous value
        detector.recordMetric('test', 1000);

        const alerts = detector.getAlerts();
        expect(alerts.length).toBeGreaterThan(0);
        expect(alerts[0].severity).toBe('critical');
    });

    it('should return null stats for non-existent metric', () => {
        const stats = detector.getMetricStats('non_existent');
        expect(stats).toBeNull();
    });

    it('should track multiple metrics independently', () => {
        detector.recordMetric('metric1', 100);
        detector.recordMetric('metric2', 200);

        const names = detector.getMetricNames();
        expect(names).toContain('metric1');
        expect(names).toContain('metric2');

        const history1 = detector.getMetricHistory('metric1');
        const history2 = detector.getMetricHistory('metric2');
        
        expect(history1[0].value).toBe(100);
        expect(history2[0].value).toBe(200);
    });
});
