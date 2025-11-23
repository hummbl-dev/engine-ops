"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const detector_js_1 = require("../detector.js");
(0, globals_1.describe)('AnomalyDetector', () => {
    let detector;
    (0, globals_1.beforeEach)(() => {
        detector = new detector_js_1.AnomalyDetector({
            windowSize: 20,
            threshold: 3,
            minSamples: 5,
            verbose: false
        });
    });
    (0, globals_1.it)('should record metrics', () => {
        detector.recordMetric('response_time', 100);
        detector.recordMetric('response_time', 110);
        detector.recordMetric('response_time', 95);
        const history = detector.getMetricHistory('response_time');
        (0, globals_1.expect)(history.length).toBe(3);
        (0, globals_1.expect)(history[0].value).toBe(100);
    });
    (0, globals_1.it)('should not detect anomalies with insufficient samples', () => {
        detector.recordMetric('response_time', 100);
        detector.recordMetric('response_time', 110);
        detector.recordMetric('response_time', 1000); // anomalous value
        const alerts = detector.getAlerts();
        (0, globals_1.expect)(alerts.length).toBe(0);
    });
    (0, globals_1.it)('should detect anomalies after sufficient samples', () => {
        // Record normal values
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('response_time', 100 + Math.random() * 10);
        }
        // Record anomalous value
        detector.recordMetric('response_time', 500);
        const alerts = detector.getAlerts();
        (0, globals_1.expect)(alerts.length).toBeGreaterThan(0);
        (0, globals_1.expect)(alerts[0].metricName).toBe('response_time');
        (0, globals_1.expect)(alerts[0].value).toBe(500);
    });
    (0, globals_1.it)('should calculate correct statistics', () => {
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('test_metric', i * 10);
        }
        const stats = detector.getMetricStats('test_metric');
        (0, globals_1.expect)(stats).not.toBeNull();
        (0, globals_1.expect)(stats.mean).toBeCloseTo(45, 1);
        (0, globals_1.expect)(stats.min).toBe(0);
        (0, globals_1.expect)(stats.max).toBe(90);
    });
    (0, globals_1.it)('should clear alerts', () => {
        // Generate some anomalies
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('response_time', 100);
        }
        detector.recordMetric('response_time', 500);
        (0, globals_1.expect)(detector.getAlerts().length).toBeGreaterThan(0);
        detector.clearAlerts();
        (0, globals_1.expect)(detector.getAlerts().length).toBe(0);
    });
    (0, globals_1.it)('should get recent alerts', () => {
        // Generate some anomalies
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('response_time', 100);
        }
        detector.recordMetric('response_time', 500);
        const now = Date.now();
        const recent = detector.getRecentAlerts(now - 1000);
        (0, globals_1.expect)(recent.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('should maintain window size', () => {
        const windowSize = 20;
        const detector = new detector_js_1.AnomalyDetector({ windowSize });
        // Record more than window size
        for (let i = 0; i < 30; i++) {
            detector.recordMetric('test', i);
        }
        const history = detector.getMetricHistory('test');
        (0, globals_1.expect)(history.length).toBe(windowSize);
    });
    (0, globals_1.it)('should classify severity correctly', () => {
        // Record normal values with some variance
        for (let i = 0; i < 10; i++) {
            detector.recordMetric('test', 100 + i);
        }
        // Record critically anomalous value
        detector.recordMetric('test', 1000);
        const alerts = detector.getAlerts();
        (0, globals_1.expect)(alerts.length).toBeGreaterThan(0);
        (0, globals_1.expect)(['critical', 'high', 'medium', 'low']).toContain(alerts[0].severity);
    });
    (0, globals_1.it)('should return null stats for non-existent metric', () => {
        const stats = detector.getMetricStats('non_existent');
        (0, globals_1.expect)(stats).toBeNull();
    });
    (0, globals_1.it)('should track multiple metrics independently', () => {
        detector.recordMetric('metric1', 100);
        detector.recordMetric('metric2', 200);
        const names = detector.getMetricNames();
        (0, globals_1.expect)(names).toContain('metric1');
        (0, globals_1.expect)(names).toContain('metric2');
        const history1 = detector.getMetricHistory('metric1');
        const history2 = detector.getMetricHistory('metric2');
        (0, globals_1.expect)(history1[0].value).toBe(100);
        (0, globals_1.expect)(history2[0].value).toBe(200);
    });
});
