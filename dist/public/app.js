"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const optimize_js_1 = require("./routes/optimize.js");
const health_js_1 = require("./routes/health.js");
const performance_metrics_js_1 = require("./routes/performance-metrics.js"); // Performance metrics
const cache_routes_js_1 = require("./routes/cache-routes.js");
const prometheus_js_1 = require("./routes/prometheus.js");
const swagger_js_1 = require("./routes/swagger.js");
const anomaly_js_1 = require("./routes/anomaly.js");
const cost_js_1 = require("./routes/cost.js");
const plugins_js_1 = require("./routes/plugins.js");
const agent_sessions_js_1 = require("./routes/agent-sessions.js");
const error_handler_js_1 = require("./middleware/error-handler.js");
const request_logger_js_1 = require("./middleware/request-logger.js");
const metrics_js_1 = require("../core/observability/metrics.js");
/**
 * Create and configure Express application
 */
function createApp() {
    const app = (0, express_1.default)();
    // Security middleware
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)());
    // Body parsing
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // Limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.'
    });
    app.use('/api/', limiter);
    // Request logging
    app.use(request_logger_js_1.requestLogger);
    // Prometheus metrics
    app.use(metrics_js_1.metricsMiddleware);
    // API routes
    app.use('/api/v1/optimize', optimize_js_1.optimizeRouter);
    app.use('/api/v1/health', health_js_1.healthRouter);
    app.use('/api/v1/metrics', performance_metrics_js_1.metricsRouter);
    app.use('/api/v1/cache', cache_routes_js_1.cacheRouter);
    app.use('/api/v1/anomaly', anomaly_js_1.anomalyRouter);
    app.use('/api/v1/plugins', plugins_js_1.pluginsRouter);
    app.use('/api/v1/agent-sessions', agent_sessions_js_1.agentSessionsRouter);
    app.use('/metrics', prometheus_js_1.prometheusRouter);
    app.use('/api-docs', swagger_js_1.swaggerRouter);
    app.use('/cost', cost_js_1.costRouter);
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
    app.use(error_handler_js_1.errorHandler);
    return app;
}
