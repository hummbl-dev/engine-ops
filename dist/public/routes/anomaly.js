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
exports.anomalyRouter = void 0;
const express_1 = require('express');
const api_js_1 = require('../api.js');
const router = (0, express_1.Router)();
exports.anomalyRouter = router;
// Singleton engine instance
const engine = new api_js_1.EngineOps({ verbose: false });
let engineInitialized = false;
// Ensure engine is initialized
async function ensureEngineInitialized() {
  if (!engineInitialized) {
    await engine.init();
    engineInitialized = true;
  }
}
/**
 * GET /api/v1/anomaly/alerts
 * Get all anomaly alerts
 */
router.get('/alerts', async (req, res) => {
  try {
    await ensureEngineInitialized();
    const detector = engine.getAnomalyDetector();
    const alerts = detector.getAlerts();
    res.json({
      count: alerts.length,
      alerts,
    });
  } catch {
    res.status(500).json({ error: 'Failed to get anomaly alerts' });
  }
});
/**
 * GET /api/v1/anomaly/alerts/recent
 * Get recent anomaly alerts (last hour by default)
 */
router.get('/alerts/recent', async (req, res) => {
  try {
    await ensureEngineInitialized();
    const detector = engine.getAnomalyDetector();
    const hoursAgo = parseInt(req.query.hours) || 1;
    const since = Date.now() - hoursAgo * 60 * 60 * 1000;
    const alerts = detector.getRecentAlerts(since);
    res.json({
      count: alerts.length,
      since: new Date(since).toISOString(),
      alerts,
    });
  } catch {
    res.status(500).json({ error: 'Failed to get recent anomaly alerts' });
  }
});
/**
 * GET /api/v1/anomaly/metrics
 * Get list of monitored metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    await ensureEngineInitialized();
    const detector = engine.getAnomalyDetector();
    const metricNames = detector.getMetricNames();
    const metrics = metricNames.map((name) => {
      const stats = detector.getMetricStats(name);
      return {
        name,
        stats,
      };
    });
    res.json({
      count: metrics.length,
      metrics,
    });
  } catch {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});
/**
 * GET /api/v1/anomaly/metrics/:name
 * Get details for a specific metric
 */
router.get('/metrics/:name', async (req, res) => {
  try {
    await ensureEngineInitialized();
    const detector = engine.getAnomalyDetector();
    const { name } = req.params;
    const stats = detector.getMetricStats(name);
    const history = detector.getMetricHistory(name);
    if (!stats) {
      return res.status(404).json({ error: 'Metric not found' });
    }
    res.json({
      name,
      stats,
      historySize: history.length,
      recentValues: history.slice(-10),
    });
  } catch {
    res.status(500).json({ error: 'Failed to get metric details' });
  }
});
/**
 * DELETE /api/v1/anomaly/alerts
 * Clear all anomaly alerts
 */
router.delete('/alerts', async (req, res) => {
  try {
    await ensureEngineInitialized();
    const detector = engine.getAnomalyDetector();
    detector.clearAlerts();
    res.json({
      message: 'Alerts cleared successfully',
    });
  } catch {
    res.status(500).json({ error: 'Failed to clear alerts' });
  }
});
