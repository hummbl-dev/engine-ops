/*
 * Copyright (c) 2025, HUMMBL, LLC
 * SPDX-License-Identifier: BSL-1.1
 * Business Source License 1.1 | Change Date: 2029-01-01 | Change License: Apache-2.0
 *
 * This file is licensed under the Business Source License 1.1.
 * See LICENSE in the repository root for full license text.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { HealthTracker } from '../health-tracker.js';

describe('HealthTracker', () => {
  let tracker: HealthTracker;

  beforeEach(() => {
    tracker = new HealthTracker();
  });

  describe('checkHealth', () => {
    it('should return health status with checks', async () => {
      const status = await tracker.checkHealth();

      expect(status).toHaveProperty('overall');
      expect(status).toHaveProperty('checks');
      expect(status).toHaveProperty('timestamp');
      expect(status).toHaveProperty('uptime');
      expect(Array.isArray(status.checks)).toBe(true);
      expect(status.checks.length).toBeGreaterThan(0);
    });

    it('should check CPU status', async () => {
      const status = await tracker.checkHealth();
      const cpuCheck = status.checks.find((c) => c.component === 'cpu');

      expect(cpuCheck).toBeDefined();
      expect(cpuCheck?.status).toMatch(/healthy|degraded|unhealthy/);
      expect(cpuCheck?.metadata).toHaveProperty('usage');
      expect(cpuCheck?.metadata).toHaveProperty('cores');
    });

    it('should check memory status', async () => {
      const status = await tracker.checkHealth();
      const memCheck = status.checks.find((c) => c.component === 'memory');

      expect(memCheck).toBeDefined();
      expect(memCheck?.status).toMatch(/healthy|degraded|unhealthy/);
      expect(memCheck?.metadata).toHaveProperty('usage');
      expect(memCheck?.metadata).toHaveProperty('total');
    });

    it('should check uptime status', async () => {
      const status = await tracker.checkHealth();
      const uptimeCheck = status.checks.find((c) => c.component === 'uptime');

      expect(uptimeCheck).toBeDefined();
      expect(uptimeCheck?.status).toMatch(/healthy|degraded|unhealthy/);
      expect(uptimeCheck?.metadata).toHaveProperty('uptime');
    });

    it('should mark new service as degraded initially', async () => {
      tracker.resetStartTime();
      const status = await tracker.checkHealth();
      const uptimeCheck = status.checks.find((c) => c.component === 'uptime');

      expect(uptimeCheck?.status).toBe('degraded');
    });
  });

  describe('logRemediation', () => {
    it('should log remediation event', () => {
      tracker.logRemediation({
        id: 'test-1',
        component: 'test-component',
        issue: 'test issue',
        action: 'test action',
        outcome: 'success',
      });

      const log = tracker.getRemediationLog();
      expect(log.length).toBe(1);
      expect(log[0].id).toBe('test-1');
      expect(log[0].outcome).toBe('success');
    });

    it('should include timestamp in logged events', () => {
      tracker.logRemediation({
        id: 'test-2',
        component: 'test',
        issue: 'issue',
        action: 'action',
        outcome: 'failure',
      });

      const log = tracker.getRemediationLog();
      expect(log[0]).toHaveProperty('timestamp');
      expect(log[0].timestamp).toBeTruthy();
    });

    it('should store metadata when provided', () => {
      tracker.logRemediation({
        id: 'test-3',
        component: 'test',
        issue: 'issue',
        action: 'action',
        outcome: 'success',
        metadata: { key: 'value' },
      });

      const log = tracker.getRemediationLog();
      expect(log[0].metadata).toEqual({ key: 'value' });
    });

    it('should limit remediation log size', () => {
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
      expect(log.length).toBeLessThanOrEqual(500);
    });
  });

  describe('getRemediationLog', () => {
    beforeEach(() => {
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

    it('should return limited number of events', () => {
      const log = tracker.getRemediationLog(5);
      expect(log.length).toBe(5);
    });

    it('should return most recent events', () => {
      const log = tracker.getRemediationLog(3);
      expect(log[2].id).toBe('event-9');
      expect(log[1].id).toBe('event-8');
      expect(log[0].id).toBe('event-7');
    });
  });

  describe('getHealthHistory', () => {
    it('should store health check results', async () => {
      await tracker.checkHealth();
      await tracker.checkHealth();

      const history = tracker.getHealthHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should limit history size', () => {
      const history = tracker.getHealthHistory(5);
      expect(history.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getStatusSummary', () => {
    it('should return status summary', async () => {
      await tracker.checkHealth();

      const summary = tracker.getStatusSummary();
      expect(summary).toHaveProperty('uptime');
      expect(summary).toHaveProperty('healthChecks');
      expect(summary).toHaveProperty('remediationEvents');
      expect(summary).toHaveProperty('recentIssues');
      expect(typeof summary.uptime).toBe('number');
      expect(typeof summary.healthChecks).toBe('number');
    });

    it('should track remediation events in summary', () => {
      tracker.logRemediation({
        id: 'test',
        component: 'test',
        issue: 'issue',
        action: 'action',
        outcome: 'success',
      });

      const summary = tracker.getStatusSummary();
      expect(summary.remediationEvents).toBe(1);
    });
  });
});
