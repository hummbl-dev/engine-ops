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
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const app_js_1 = require("../app.js");
(0, globals_1.describe)('API Integration Tests', () => {
    let app;
    (0, globals_1.beforeAll)(() => {
        app = (0, app_js_1.createApp)();
    });
    (0, globals_1.describe)('GET /', () => {
        (0, globals_1.it)('should return API information', async () => {
            const response = await (0, supertest_1.default)(app).get('/');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('name', 'Engine-Ops API');
            (0, globals_1.expect)(response.body).toHaveProperty('version');
            (0, globals_1.expect)(response.body).toHaveProperty('endpoints');
        });
    });
    (0, globals_1.describe)('GET /api/v1/health', () => {
        (0, globals_1.it)('should return health status', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/v1/health');
            // Health check might return 503 if service just started (uptime < 30s)
            (0, globals_1.expect)([200, 503]).toContain(response.status);
            (0, globals_1.expect)(response.body).toHaveProperty('status');
            (0, globals_1.expect)(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
            (0, globals_1.expect)(response.body).toHaveProperty('uptime');
            (0, globals_1.expect)(response.body).toHaveProperty('timestamp');
            (0, globals_1.expect)(response.body).toHaveProperty('checks');
            (0, globals_1.expect)(Array.isArray(response.body.checks)).toBe(true);
        });
    });
    (0, globals_1.describe)('GET /api/v1/metrics', () => {
        (0, globals_1.it)('should return metrics', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/v1/metrics');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('aggregated');
            (0, globals_1.expect)(response.body).toHaveProperty('recent');
        });
    });
    (0, globals_1.describe)('GET /api/v1/cache/stats', () => {
        (0, globals_1.it)('should return cache statistics', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/v1/cache/stats');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('hits');
            (0, globals_1.expect)(response.body).toHaveProperty('misses');
        });
    });
    (0, globals_1.describe)('POST /api/v1/optimize', () => {
        (0, globals_1.it)('should optimize resource allocation', async () => {
            const request_data = {
                id: 'api-test-1',
                type: 'resource',
                data: {
                    items: [
                        { id: 'item-1', cpu: 50, memory: 500 },
                        { id: 'item-2', cpu: 30, memory: 300 }
                    ],
                    nodeCapacity: { cpu: 100, memory: 1000 }
                }
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/optimize')
                .send(request_data)
                .set('Content-Type', 'application/json');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('success', true);
            (0, globals_1.expect)(response.body).toHaveProperty('requestId', 'api-test-1');
            (0, globals_1.expect)(response.body).toHaveProperty('result');
        });
        (0, globals_1.it)('should handle scheduling optimization', async () => {
            const request_data = {
                id: 'api-test-2',
                type: 'scheduling',
                data: {
                    task: { id: 'task-1', cpuRequired: 10, memoryRequired: 10 },
                    nodes: [
                        { id: 'node-A', cpuLoad: 80, memoryLoad: 80 },
                        { id: 'node-B', cpuLoad: 20, memoryLoad: 20 }
                    ]
                }
            };
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/optimize')
                .send(request_data)
                .set('Content-Type', 'application/json');
            (0, globals_1.expect)(response.status).toBe(200);
            (0, globals_1.expect)(response.body).toHaveProperty('success', true);
        });
        (0, globals_1.it)('should return 400 for invalid request', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/optimize')
                .send({ invalid: 'data' })
                .set('Content-Type', 'application/json');
            (0, globals_1.expect)(response.status).toBe(400);
            (0, globals_1.expect)(response.body).toHaveProperty('error');
        });
        (0, globals_1.it)('should return 400 for missing required fields', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/optimize')
                .send({ id: 'test', type: 'resource' })
                .set('Content-Type', 'application/json');
            (0, globals_1.expect)(response.status).toBe(400);
        });
    });
});
