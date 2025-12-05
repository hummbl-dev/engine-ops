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

describe('Agent Sessions API', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp();
  });

  describe('POST /api/v1/agent-sessions', () => {
    it('should create a new metrics session', async () => {
      const response = await request(app)
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

      expect(response.body.sessionId).toBe('metrics-api-001');
      expect(response.body.sessionType).toBe('metrics');
      expect(response.body.state).toBe('init');
    });

    it('should create a simulation session', async () => {
      const response = await request(app)
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

      expect(response.body.sessionType).toBe('simulation');
      expect(response.body.context.agents).toHaveLength(4);
    });

    it('should return 400 for invalid session type', async () => {
      const response = await request(app)
        .post('/api/v1/agent-sessions')
        .send({
          sessionType: 'invalid-type',
          sessionId: 'invalid-001',
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid request');
    });

    it('should return 409 for duplicate session ID', async () => {
      const sessionData = {
        sessionType: 'policy',
        sessionId: 'duplicate-api-001',
      };

      await request(app).post('/api/v1/agent-sessions').send(sessionData).expect(201);

      const response = await request(app)
        .post('/api/v1/agent-sessions')
        .send(sessionData)
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('GET /api/v1/agent-sessions', () => {
    beforeAll(async () => {
      await request(app)
        .post('/api/v1/agent-sessions')
        .send({ sessionType: 'metrics', sessionId: 'list-metrics-001' });
      await request(app)
        .post('/api/v1/agent-sessions')
        .send({ sessionType: 'policy', sessionId: 'list-policy-001' });
    });

    it('should list all sessions', async () => {
      const response = await request(app).get('/api/v1/agent-sessions').expect(200);

      expect(response.body.count).toBeGreaterThanOrEqual(2);
      expect(response.body.sessions).toBeDefined();
      expect(Array.isArray(response.body.sessions)).toBe(true);
    });

    it('should filter sessions by type', async () => {
      const response = await request(app)
        .get('/api/v1/agent-sessions?sessionType=metrics')
        .expect(200);

      expect(
        response.body.sessions.every((s: { sessionType: string }) => s.sessionType === 'metrics'),
      ).toBe(true);
    });

    it('should filter sessions by state', async () => {
      const response = await request(app).get('/api/v1/agent-sessions?state=init').expect(200);

      expect(response.body.sessions.every((s: { state: string }) => s.state === 'init')).toBe(true);
    });
  });

  describe('GET /api/v1/agent-sessions/stats', () => {
    it('should return session statistics', async () => {
      const response = await request(app).get('/api/v1/agent-sessions/stats').expect(200);

      expect(response.body.total).toBeGreaterThanOrEqual(0);
      expect(response.body.byType).toBeDefined();
      expect(response.body.byState).toBeDefined();
    });
  });

  describe('GET /api/v1/agent-sessions/:sessionId', () => {
    it('should get a specific session', async () => {
      await request(app)
        .post('/api/v1/agent-sessions')
        .send({ sessionType: 'audit', sessionId: 'get-audit-001' });

      const response = await request(app).get('/api/v1/agent-sessions/get-audit-001').expect(200);

      expect(response.body.sessionId).toBe('get-audit-001');
      expect(response.body.sessionType).toBe('audit');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app).get('/api/v1/agent-sessions/non-existent').expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('PATCH /api/v1/agent-sessions/:sessionId', () => {
    it('should update session state', async () => {
      await request(app)
        .post('/api/v1/agent-sessions')
        .send({ sessionType: 'custom', sessionId: 'update-custom-001' });

      const response = await request(app)
        .patch('/api/v1/agent-sessions/update-custom-001')
        .send({ state: 'running' })
        .expect(200);

      expect(response.body.state).toBe('running');
    });

    it('should update session with result', async () => {
      await request(app)
        .post('/api/v1/agent-sessions')
        .send({ sessionType: 'metrics', sessionId: 'update-metrics-002' });

      const result = { metricsCollected: 100, errors: 0 };
      const response = await request(app)
        .patch('/api/v1/agent-sessions/update-metrics-002')
        .send({ state: 'completed', result })
        .expect(200);

      expect(response.body.state).toBe('completed');
      expect(response.body.result).toEqual(result);
    });

    it('should return 400 if state is missing', async () => {
      await request(app)
        .post('/api/v1/agent-sessions')
        .send({ sessionType: 'policy', sessionId: 'update-policy-001' });

      const response = await request(app)
        .patch('/api/v1/agent-sessions/update-policy-001')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('State is required');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .patch('/api/v1/agent-sessions/non-existent')
        .send({ state: 'running' })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('DELETE /api/v1/agent-sessions/:sessionId', () => {
    it('should delete a session', async () => {
      await request(app)
        .post('/api/v1/agent-sessions')
        .send({ sessionType: 'audit', sessionId: 'delete-audit-001' });

      await request(app).delete('/api/v1/agent-sessions/delete-audit-001').expect(204);

      await request(app).get('/api/v1/agent-sessions/delete-audit-001').expect(404);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app).delete('/api/v1/agent-sessions/non-existent').expect(404);

      expect(response.body.error).toContain('not found');
    });
  });
});
