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
(0, globals_1.describe)('Agent Sessions API', () => {
    let app;
    (0, globals_1.beforeAll)(() => {
        app = (0, app_js_1.createApp)();
    });
    (0, globals_1.describe)('POST /api/v1/agent-sessions', () => {
        (0, globals_1.it)('should create a new metrics session', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({
                sessionType: 'metrics',
                sessionId: 'metrics-api-001',
                context: {
                    agents: ['MetricsAgent'],
                    objective: 'Monitor system metrics',
                },
            })
                .expect(201);
            (0, globals_1.expect)(response.body.sessionId).toBe('metrics-api-001');
            (0, globals_1.expect)(response.body.sessionType).toBe('metrics');
            (0, globals_1.expect)(response.body.state).toBe('init');
        });
        (0, globals_1.it)('should create a simulation session', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({
                sessionType: 'simulation',
                sessionId: 'sim-api-001',
                context: {
                    agents: ['DetectionAgent', 'TriageAgent', 'ResolutionAgent', 'AuditAgent'],
                    state: { status: 'init' },
                    policy: 'ops_policy.json',
                    dataSource: 'recent_ops_logs.json',
                    objective: 'Simulate incident detection and resolution',
                    additionalSettings: { maxSteps: 10, enableAudit: true },
                },
            })
                .expect(201);
            (0, globals_1.expect)(response.body.sessionType).toBe('simulation');
            (0, globals_1.expect)(response.body.context.agents).toHaveLength(4);
        });
        (0, globals_1.it)('should return 400 for invalid session type', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({
                sessionType: 'invalid-type',
                sessionId: 'invalid-001',
            })
                .expect(400);
            (0, globals_1.expect)(response.body.error).toBe('Invalid request');
        });
        (0, globals_1.it)('should return 409 for duplicate session ID', async () => {
            const sessionData = {
                sessionType: 'policy',
                sessionId: 'duplicate-api-001',
            };
            await (0, supertest_1.default)(app).post('/api/v1/agent-sessions').send(sessionData).expect(201);
            const response = await (0, supertest_1.default)(app).post('/api/v1/agent-sessions').send(sessionData).expect(409);
            (0, globals_1.expect)(response.body.error).toContain('already exists');
        });
    });
    (0, globals_1.describe)('GET /api/v1/agent-sessions', () => {
        (0, globals_1.beforeAll)(async () => {
            await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({ sessionType: 'metrics', sessionId: 'list-metrics-001' });
            await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({ sessionType: 'policy', sessionId: 'list-policy-001' });
        });
        (0, globals_1.it)('should list all sessions', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/v1/agent-sessions').expect(200);
            (0, globals_1.expect)(response.body.count).toBeGreaterThanOrEqual(2);
            (0, globals_1.expect)(response.body.sessions).toBeDefined();
            (0, globals_1.expect)(Array.isArray(response.body.sessions)).toBe(true);
        });
        (0, globals_1.it)('should filter sessions by type', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/v1/agent-sessions?sessionType=metrics').expect(200);
            (0, globals_1.expect)(response.body.sessions.every((s) => s.sessionType === 'metrics')).toBe(true);
        });
        (0, globals_1.it)('should filter sessions by state', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/v1/agent-sessions?state=init').expect(200);
            (0, globals_1.expect)(response.body.sessions.every((s) => s.state === 'init')).toBe(true);
        });
    });
    (0, globals_1.describe)('GET /api/v1/agent-sessions/stats', () => {
        (0, globals_1.it)('should return session statistics', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/v1/agent-sessions/stats').expect(200);
            (0, globals_1.expect)(response.body.total).toBeGreaterThanOrEqual(0);
            (0, globals_1.expect)(response.body.byType).toBeDefined();
            (0, globals_1.expect)(response.body.byState).toBeDefined();
        });
    });
    (0, globals_1.describe)('GET /api/v1/agent-sessions/:sessionId', () => {
        (0, globals_1.it)('should get a specific session', async () => {
            await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({ sessionType: 'audit', sessionId: 'get-audit-001' });
            const response = await (0, supertest_1.default)(app).get('/api/v1/agent-sessions/get-audit-001').expect(200);
            (0, globals_1.expect)(response.body.sessionId).toBe('get-audit-001');
            (0, globals_1.expect)(response.body.sessionType).toBe('audit');
        });
        (0, globals_1.it)('should return 404 for non-existent session', async () => {
            const response = await (0, supertest_1.default)(app).get('/api/v1/agent-sessions/non-existent').expect(404);
            (0, globals_1.expect)(response.body.error).toContain('not found');
        });
    });
    (0, globals_1.describe)('PATCH /api/v1/agent-sessions/:sessionId', () => {
        (0, globals_1.it)('should update session state', async () => {
            await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({ sessionType: 'custom', sessionId: 'update-custom-001' });
            const response = await (0, supertest_1.default)(app)
                .patch('/api/v1/agent-sessions/update-custom-001')
                .send({ state: 'running' })
                .expect(200);
            (0, globals_1.expect)(response.body.state).toBe('running');
        });
        (0, globals_1.it)('should update session with result', async () => {
            await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({ sessionType: 'metrics', sessionId: 'update-metrics-002' });
            const result = { metricsCollected: 100, errors: 0 };
            const response = await (0, supertest_1.default)(app)
                .patch('/api/v1/agent-sessions/update-metrics-002')
                .send({ state: 'completed', result })
                .expect(200);
            (0, globals_1.expect)(response.body.state).toBe('completed');
            (0, globals_1.expect)(response.body.result).toEqual(result);
        });
        (0, globals_1.it)('should return 400 if state is missing', async () => {
            await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({ sessionType: 'policy', sessionId: 'update-policy-001' });
            const response = await (0, supertest_1.default)(app)
                .patch('/api/v1/agent-sessions/update-policy-001')
                .send({})
                .expect(400);
            (0, globals_1.expect)(response.body.error).toBe('State is required');
        });
        (0, globals_1.it)('should return 404 for non-existent session', async () => {
            const response = await (0, supertest_1.default)(app)
                .patch('/api/v1/agent-sessions/non-existent')
                .send({ state: 'running' })
                .expect(404);
            (0, globals_1.expect)(response.body.error).toContain('not found');
        });
    });
    (0, globals_1.describe)('DELETE /api/v1/agent-sessions/:sessionId', () => {
        (0, globals_1.it)('should delete a session', async () => {
            await (0, supertest_1.default)(app)
                .post('/api/v1/agent-sessions')
                .send({ sessionType: 'audit', sessionId: 'delete-audit-001' });
            await (0, supertest_1.default)(app).delete('/api/v1/agent-sessions/delete-audit-001').expect(204);
            await (0, supertest_1.default)(app).get('/api/v1/agent-sessions/delete-audit-001').expect(404);
        });
        (0, globals_1.it)('should return 404 for non-existent session', async () => {
            const response = await (0, supertest_1.default)(app).delete('/api/v1/agent-sessions/non-existent').expect(404);
            (0, globals_1.expect)(response.body.error).toContain('not found');
        });
    });
});
