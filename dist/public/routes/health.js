'use strict';
/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.healthRouter = void 0;
const express_1 = require('express');
const health_tracker_js_1 = require('../../core/monitoring/health-tracker.js');
exports.healthRouter = (0, express_1.Router)();
// Initialize health tracker
const healthTracker = new health_tracker_js_1.HealthTracker();
/**
 * GET /api/v1/health
 * Comprehensive health check endpoint with detailed diagnostics
 */
exports.healthRouter.get('/', async (_req, res) => {
  try {
    const healthStatus = await healthTracker.checkHealth();
    const summary = healthTracker.getStatusSummary();
    const statusCode = healthStatus.overall === 'unhealthy' ? 503 : 200;
    res.status(statusCode).json({
      status: healthStatus.overall,
      uptime: healthStatus.uptime,
      timestamp: healthStatus.timestamp,
      service: 'engine-ops',
      version: '0.3.0',
      checks: healthStatus.checks,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
/**
 * GET /api/v1/health/live
 * Liveness probe - checks if the application is running
 * This should only fail if the process is deadlocked or unresponsive
 */
exports.healthRouter.get('/live', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});
/**
 * GET /api/v1/health/ready
 * Readiness probe - checks if the application is ready to serve traffic
 * Returns 503 if system is unhealthy or degraded
 */
exports.healthRouter.get('/ready', async (_req, res) => {
  try {
    const healthStatus = await healthTracker.checkHealth();
    // Only ready if healthy (not degraded or unhealthy)
    const isReady = healthStatus.overall === 'healthy';
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: healthStatus.timestamp,
        checks: healthStatus.checks,
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        reason: healthStatus.overall,
        timestamp: healthStatus.timestamp,
        checks: healthStatus.checks,
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
/**
 * GET /api/v1/health/history
 * Get recent health check history
 */
exports.healthRouter.get('/history', (_req, res) => {
  const limitParam = parseInt(_req.query.limit) || 50;
  // Bound limit to prevent DoS attacks (min: 1, max: 500)
  const limit = Math.max(1, Math.min(limitParam, 500));
  const history = healthTracker.getHealthHistory(limit);
  res.status(200).json({
    history,
    count: history.length,
    timestamp: new Date().toISOString(),
  });
});
/**
 * GET /api/v1/health/remediation
 * Get remediation event log
 */
exports.healthRouter.get('/remediation', (_req, res) => {
  const limitParam = parseInt(_req.query.limit) || 50;
  // Bound limit to prevent DoS attacks (min: 1, max: 500)
  const limit = Math.max(1, Math.min(limitParam, 500));
  const events = healthTracker.getRemediationLog(limit);
  res.status(200).json({
    events,
    count: events.length,
    timestamp: new Date().toISOString(),
  });
});
/**
 * POST /api/v1/health/remediation
 * Log a remediation action (for external systems like k8s controllers)
 */
exports.healthRouter.post('/remediation', (req, res) => {
  try {
    const { id, component, issue, action, outcome, metadata } = req.body;
    if (!id || !component || !issue || !action || !outcome) {
      return res.status(400).json({
        error: 'Missing required fields: id, component, issue, action, outcome',
      });
    }
    healthTracker.logRemediation({
      id,
      component,
      issue,
      action,
      outcome,
      metadata,
    });
    res.status(201).json({
      message: 'Remediation event logged',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
