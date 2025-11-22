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

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';
import { Express } from 'express';

describe('API Integration Tests', () => {
    let app: Express;

    beforeAll(() => {
        app = createApp();
    });

    describe('GET /', () => {
        it('should return API information', async () => {
            const response = await request(app).get('/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('name', 'Engine-Ops API');
            expect(response.body).toHaveProperty('version');
            expect(response.body).toHaveProperty('endpoints');
        });
    });

    describe('GET /api/v1/health', () => {
        it('should return health status', async () => {
            const response = await request(app).get('/api/v1/health');

            // Health check might return 503 if service just started (uptime < 30s)
            expect([200, 503]).toContain(response.status);
            expect(response.body).toHaveProperty('status');
            expect(['healthy', 'degraded', 'unhealthy']).toContain(response.body.status);
            expect(response.body).toHaveProperty('uptime');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('checks');
            expect(Array.isArray(response.body.checks)).toBe(true);
        });
    });

    describe('GET /api/v1/metrics', () => {
        it('should return metrics', async () => {
            const response = await request(app).get('/api/v1/metrics');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('aggregated');
            expect(response.body).toHaveProperty('recent');
        });
    });

    describe('GET /api/v1/cache/stats', () => {
        it('should return cache statistics', async () => {
            const response = await request(app).get('/api/v1/cache/stats');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('hits');
            expect(response.body).toHaveProperty('misses');
        });
    });

    describe('POST /api/v1/optimize', () => {
        it('should optimize resource allocation', async () => {
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

            const response = await request(app)
                .post('/api/v1/optimize')
                .send(request_data)
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('requestId', 'api-test-1');
            expect(response.body).toHaveProperty('result');
        });

        it('should handle scheduling optimization', async () => {
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

            const response = await request(app)
                .post('/api/v1/optimize')
                .send(request_data)
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
        });

        it('should return 400 for invalid request', async () => {
            const response = await request(app)
                .post('/api/v1/optimize')
                .send({ invalid: 'data' })
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/v1/optimize')
                .send({ id: 'test', type: 'resource' })
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
        });
    });
});
