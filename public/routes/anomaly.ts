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

import { Router } from 'express';
import { EngineOps } from '../api.js';

const router = Router();

// Singleton engine instance
const engine = new EngineOps({ verbose: false });
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
        const detector = (engine as any).engine.getAnomalyDetector();
        const alerts = detector.getAlerts();
        
        res.json({
            count: alerts.length,
            alerts
        });
    } catch (error) {
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
        const detector = (engine as any).engine.getAnomalyDetector();
        const hoursAgo = parseInt(req.query.hours as string) || 1;
        const since = Date.now() - (hoursAgo * 60 * 60 * 1000);
        const alerts = detector.getRecentAlerts(since);
        
        res.json({
            count: alerts.length,
            since: new Date(since).toISOString(),
            alerts
        });
    } catch (error) {
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
        const detector = (engine as any).engine.getAnomalyDetector();
        const metricNames = detector.getMetricNames();
        
        const metrics = metricNames.map((name: string) => {
            const stats = detector.getMetricStats(name);
            return {
                name,
                stats
            };
        });

        res.json({
            count: metrics.length,
            metrics
        });
    } catch (error) {
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
        const detector = (engine as any).engine.getAnomalyDetector();
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
            recentValues: history.slice(-10)
        });
    } catch (error) {
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
        const detector = (engine as any).engine.getAnomalyDetector();
        detector.clearAlerts();
        
        res.json({
            message: 'Alerts cleared successfully'
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear alerts' });
    }
});

export { router as anomalyRouter };
