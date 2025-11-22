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

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { optimizeRouter } from './routes/optimize.js';
import { healthRouter } from './routes/health.js';
import { metricsRouter } from './routes/performance-metrics.js'; // Performance metrics
import { cacheRouter } from './routes/cache-routes.js';
import { prometheusRouter } from './routes/prometheus.js';
import { swaggerRouter } from './routes/swagger.js';
import { anomalyRouter } from './routes/anomaly.js';
import { costRouter } from './routes/cost.js';
import { pluginsRouter } from './routes/plugins.js';
import { agentSessionsRouter } from './routes/agent-sessions.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { metricsMiddleware } from '../core/observability/metrics.js';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(cors());

    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use('/api/', limiter);

    // Request logging
    app.use(requestLogger);

    // Prometheus metrics
    app.use(metricsMiddleware);

    // API routes
    app.use('/api/v1/optimize', optimizeRouter);
    app.use('/api/v1/health', healthRouter);
    app.use('/api/v1/metrics', metricsRouter);
    app.use('/api/v1/cache', cacheRouter);
    app.use('/api/v1/anomaly', anomalyRouter);
    app.use('/api/v1/plugins', pluginsRouter);
    app.use('/api/v1/agent-sessions', agentSessionsRouter);
    app.use('/metrics', prometheusRouter);
    app.use('/api-docs', swaggerRouter);
    app.use('/cost', costRouter);

    // Root endpoint
    app.get('/', (_req, res) => {
        res.json({
            name: 'Engine-Ops API',
            version: '0.3.0',
            endpoints: {
                optimize: 'POST /api/v1/optimize',
                health: 'GET /api/v1/health',
                metrics: 'GET /api/v1/metrics',
                cache: 'GET /api/v1/cache/stats',
                anomaly: 'GET /api/v1/anomaly/alerts',
                plugins: 'GET /api/v1/plugins',
                workloadData: 'GET /api/v1/plugins/workload-data/stats',
                agentSessions: 'POST /api/v1/agent-sessions',
                prometheus: 'GET /metrics',
                docs: 'GET /api-docs'
            }
        });
    });

    // Error handling (must be last)
    app.use(errorHandler);

    return app;
}
