'use strict';
/*
 * Copyright (c) 2025, HUMMBL, LLC
 * SPDX-License-Identifier: BSL-1.1
 * Business Source License 1.1 | Change Date: 2029-01-01 | Change License: Apache-2.0
 *
 * This file is licensed under the Business Source License 1.1.
 * See LICENSE in the repository root for full license text.
 */
Object.defineProperty(exports, '__esModule', { value: true });
const globals_1 = require('@jest/globals');
const health_tracker_js_1 = require('../health-tracker.js');
(0, globals_1.describe)('HealthTracker', () => {
  let tracker;
  (0, globals_1.beforeEach)(() => {
    tracker = new health_tracker_js_1.HealthTracker();
  });
  (0, globals_1.describe)('checkHealth', () => {
    (0, globals_1.it)('should return health status with checks', async () => {
      const status = await tracker.checkHealth();
      (0, globals_1.expect)(status).toHaveProperty('overall');
      (0, globals_1.expect)(status).toHaveProperty('checks');
      (0, globals_1.expect)(status).toHaveProperty('timestamp');
      (0, globals_1.expect)(status).toHaveProperty('uptime');
      (0, globals_1.expect)(Array.isArray(status.checks)).toBe(true);
      (0, globals_1.expect)(status.checks.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('should check CPU status', async () => {
      const status = await tracker.checkHealth();
      const cpuCheck = status.checks.find((c) => c.component === 'cpu');
      (0, globals_1.expect)(cpuCheck).toBeDefined();
      (0, globals_1.expect)(cpuCheck?.status).toMatch(/healthy|degraded|unhealthy/);
      (0, globals_1.expect)(cpuCheck?.metadata).toHaveProperty('usage');
      (0, globals_1.expect)(cpuCheck?.metadata).toHaveProperty('cores');
    });
    (0, globals_1.it)('should check memory status', async () => {
      const status = await tracker.checkHealth();
      const memCheck = status.checks.find((c) => c.component === 'memory');
      (0, globals_1.expect)(memCheck).toBeDefined();
      (0, globals_1.expect)(memCheck?.status).toMatch(/healthy|degraded|unhealthy/);
      (0, globals_1.expect)(memCheck?.metadata).toHaveProperty('usage');
      (0, globals_1.expect)(memCheck?.metadata).toHaveProperty('total');
    });
    (0, globals_1.it)('should check uptime status', async () => {
      const status = await tracker.checkHealth();
      const uptimeCheck = status.checks.find((c) => c.component === 'uptime');
      (0, globals_1.expect)(uptimeCheck).toBeDefined();
      (0, globals_1.expect)(uptimeCheck?.status).toMatch(/healthy|degraded|unhealthy/);
      (0, globals_1.expect)(uptimeCheck?.metadata).toHaveProperty('uptime');
    });
    (0, globals_1.it)('should mark new service as degraded initially', async () => {
      tracker.resetStartTime();
      const status = await tracker.checkHealth();
      const uptimeCheck = status.checks.find((c) => c.component === 'uptime');
      (0, globals_1.expect)(uptimeCheck?.status).toBe('degraded');
    });
  });
  (0, globals_1.describe)('logRemediation', () => {
    (0, globals_1.it)('should log remediation event', () => {
      tracker.logRemediation({
        id: 'test-1',
        component: 'test-component',
        issue: 'test issue',
        action: 'test action',
        outcome: 'success',
      });
      const log = tracker.getRemediationLog();
      (0, globals_1.expect)(log.length).toBe(1);
      (0, globals_1.expect)(log[0].id).toBe('test-1');
      (0, globals_1.expect)(log[0].outcome).toBe('success');
    });
    (0, globals_1.it)('should include timestamp in logged events', () => {
      tracker.logRemediation({
        id: 'test-2',
        component: 'test',
        issue: 'issue',
        action: 'action',
        outcome: 'failure',
      });
      const log = tracker.getRemediationLog();
      (0, globals_1.expect)(log[0]).toHaveProperty('timestamp');
      (0, globals_1.expect)(log[0].timestamp).toBeTruthy();
    });
    (0, globals_1.it)('should store metadata when provided', () => {
      tracker.logRemediation({
        id: 'test-3',
        component: 'test',
        issue: 'issue',
        action: 'action',
        outcome: 'success',
        metadata: { key: 'value' },
      });
      const log = tracker.getRemediationLog();
      (0, globals_1.expect)(log[0].metadata).toEqual({ key: 'value' });
    });
    (0, globals_1.it)('should limit remediation log size', () => {
      // Log more than max size
      for (let i = 0; i < 600; i++) {
        tracker.logRemediation({
          id: `test-${i}`,
          component: 'test',
          issue: 'issue',
          action: 'action',
          outcome: 'success',
        });
      }
      const log = tracker.getRemediationLog(1000);
      (0, globals_1.expect)(log.length).toBeLessThanOrEqual(500);
    });
  });
  (0, globals_1.describe)('getRemediationLog', () => {
    (0, globals_1.beforeEach)(() => {
      for (let i = 0; i < 10; i++) {
        tracker.logRemediation({
          id: `event-${i}`,
          component: 'test',
          issue: 'issue',
          action: 'action',
          outcome: 'success',
        });
      }
    });
    (0, globals_1.it)('should return limited number of events', () => {
      const log = tracker.getRemediationLog(5);
      (0, globals_1.expect)(log.length).toBe(5);
    });
    (0, globals_1.it)('should return most recent events', () => {
      const log = tracker.getRemediationLog(3);
      (0, globals_1.expect)(log[2].id).toBe('event-9');
      (0, globals_1.expect)(log[1].id).toBe('event-8');
      (0, globals_1.expect)(log[0].id).toBe('event-7');
    });
  });
  (0, globals_1.describe)('getHealthHistory', () => {
    (0, globals_1.it)('should store health check results', async () => {
      await tracker.checkHealth();
      await tracker.checkHealth();
      const history = tracker.getHealthHistory();
      (0, globals_1.expect)(history.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('should limit history size', () => {
      const history = tracker.getHealthHistory(5);
      (0, globals_1.expect)(history.length).toBeLessThanOrEqual(5);
    });
  });
  (0, globals_1.describe)('getStatusSummary', () => {
    (0, globals_1.it)('should return status summary', async () => {
      await tracker.checkHealth();
      const summary = tracker.getStatusSummary();
      (0, globals_1.expect)(summary).toHaveProperty('uptime');
      (0, globals_1.expect)(summary).toHaveProperty('healthChecks');
      (0, globals_1.expect)(summary).toHaveProperty('remediationEvents');
      (0, globals_1.expect)(summary).toHaveProperty('recentIssues');
      (0, globals_1.expect)(typeof summary.uptime).toBe('number');
      (0, globals_1.expect)(typeof summary.healthChecks).toBe('number');
    });
    (0, globals_1.it)('should track remediation events in summary', () => {
      tracker.logRemediation({
        id: 'test',
        component: 'test',
        issue: 'issue',
        action: 'action',
        outcome: 'success',
      });
      const summary = tracker.getStatusSummary();
      (0, globals_1.expect)(summary.remediationEvents).toBe(1);
    });
  });
});
