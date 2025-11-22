/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { AgentSessionManager } from '../agent-session-manager.js';
import { AgentSessionRequest } from '../../schemas/agent-session.js';

describe('AgentSessionManager', () => {
    let manager: AgentSessionManager;

    beforeEach(() => {
        manager = new AgentSessionManager();
    });

    describe('createSession', () => {
        it('should create a new metrics session', async () => {
            const request: AgentSessionRequest = {
                sessionType: 'metrics',
                sessionId: 'metrics-001',
                context: {
                    agents: ['MetricsAgent'],
                    objective: 'Monitor system metrics',
                },
            };

            const session = await manager.createSession(request);

            expect(session.sessionId).toBe('metrics-001');
            expect(session.sessionType).toBe('metrics');
            expect(session.state).toBe('init');
            expect(session.context?.agents).toEqual(['MetricsAgent']);
            expect(session.createdAt).toBeDefined();
            expect(session.updatedAt).toBeDefined();
        });

        it('should create a simulation session', async () => {
            const request: AgentSessionRequest = {
                sessionType: 'simulation',
                sessionId: 'sim-ops-2025-001',
                context: {
                    agents: ['DetectionAgent', 'TriageAgent', 'ResolutionAgent', 'AuditAgent'],
                    state: { status: 'init' },
                    policy: 'ops_policy.json',
                    dataSource: 'recent_ops_logs.json',
                    objective: 'Simulate incident detection and resolution',
                    additionalSettings: { maxSteps: 10, enableAudit: true },
                },
            };

            const session = await manager.createSession(request);

            expect(session.sessionType).toBe('simulation');
            expect(session.sessionId).toBe('sim-ops-2025-001');
            expect(session.context?.agents).toHaveLength(4);
            expect(session.context?.policy).toBe('ops_policy.json');
            expect(session.context?.additionalSettings).toEqual({ maxSteps: 10, enableAudit: true });
        });

        it('should throw error for duplicate session ID', async () => {
            const request: AgentSessionRequest = {
                sessionType: 'policy',
                sessionId: 'duplicate-id',
            };

            await manager.createSession(request);
            await expect(manager.createSession(request)).rejects.toThrow('already exists');
        });

        it('should reject invalid session type', async () => {
            const request = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sessionType: 'invalid-type' as any,
                sessionId: 'test-001',
            };

            await expect(manager.createSession(request as AgentSessionRequest)).rejects.toThrow('validation failed');
        });
    });

    describe('getSession', () => {
        it('should retrieve an existing session', async () => {
            const request: AgentSessionRequest = {
                sessionType: 'audit',
                sessionId: 'audit-001',
            };

            await manager.createSession(request);
            const session = manager.getSession('audit-001');

            expect(session).toBeDefined();
            expect(session?.sessionId).toBe('audit-001');
        });

        it('should return undefined for non-existent session', () => {
            const session = manager.getSession('non-existent');
            expect(session).toBeUndefined();
        });
    });

    describe('listSessions', () => {
        beforeEach(async () => {
            await manager.createSession({ sessionType: 'metrics', sessionId: 'metrics-001' });
            await manager.createSession({ sessionType: 'policy', sessionId: 'policy-001' });
            await manager.createSession({ sessionType: 'simulation', sessionId: 'sim-001' });
            await manager.updateSessionState('metrics-001', 'running');
        });

        it('should list all sessions', () => {
            const sessions = manager.listSessions();
            expect(sessions).toHaveLength(3);
        });

        it('should filter sessions by type', () => {
            const sessions = manager.listSessions({ sessionType: 'metrics' });
            expect(sessions).toHaveLength(1);
            expect(sessions[0].sessionType).toBe('metrics');
        });

        it('should filter sessions by state', () => {
            const sessions = manager.listSessions({ state: 'running' });
            expect(sessions).toHaveLength(1);
            expect(sessions[0].state).toBe('running');
        });

        it('should filter by both type and state', () => {
            const sessions = manager.listSessions({ sessionType: 'metrics', state: 'running' });
            expect(sessions).toHaveLength(1);
        });
    });

    describe('updateSessionState', () => {
        it('should update session state', async () => {
            const request: AgentSessionRequest = {
                sessionType: 'custom',
                sessionId: 'custom-001',
            };

            await manager.createSession(request);
            const updatedSession = await manager.updateSessionState('custom-001', 'running');

            expect(updatedSession.state).toBe('running');
            expect(new Date(updatedSession.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(updatedSession.createdAt).getTime());
        });

        it('should update session with result', async () => {
            await manager.createSession({ sessionType: 'metrics', sessionId: 'metrics-002' });
            const result = { metricsCollected: 100, errors: 0 };
            const updatedSession = await manager.updateSessionState('metrics-002', 'completed', result);

            expect(updatedSession.state).toBe('completed');
            expect(updatedSession.result).toEqual(result);
        });

        it('should update session with error', async () => {
            await manager.createSession({ sessionType: 'policy', sessionId: 'policy-002' });
            const updatedSession = await manager.updateSessionState(
                'policy-002',
                'failed',
                undefined,
                'Connection timeout'
            );

            expect(updatedSession.state).toBe('failed');
            expect(updatedSession.error).toBe('Connection timeout');
        });

        it('should throw error for non-existent session', async () => {
            await expect(manager.updateSessionState('non-existent', 'running')).rejects.toThrow('not found');
        });
    });

    describe('deleteSession', () => {
        it('should delete an existing session', async () => {
            await manager.createSession({ sessionType: 'audit', sessionId: 'audit-002' });
            const deleted = manager.deleteSession('audit-002');

            expect(deleted).toBe(true);
            expect(manager.getSession('audit-002')).toBeUndefined();
        });

        it('should return false for non-existent session', () => {
            const deleted = manager.deleteSession('non-existent');
            expect(deleted).toBe(false);
        });
    });

    describe('getStats', () => {
        beforeEach(async () => {
            await manager.createSession({ sessionType: 'metrics', sessionId: 'metrics-stat-1' });
            await manager.createSession({ sessionType: 'metrics', sessionId: 'metrics-stat-2' });
            await manager.createSession({ sessionType: 'policy', sessionId: 'policy-stat-1' });
            await manager.createSession({ sessionType: 'simulation', sessionId: 'sim-stat-1' });
            await manager.updateSessionState('metrics-stat-1', 'running');
            await manager.updateSessionState('metrics-stat-2', 'completed');
        });

        it('should return correct statistics', () => {
            const stats = manager.getStats();

            expect(stats.total).toBe(4);
            expect(stats.byType['metrics']).toBe(2);
            expect(stats.byType['policy']).toBe(1);
            expect(stats.byType['simulation']).toBe(1);
            expect(stats.byState['init']).toBe(2);
            expect(stats.byState['running']).toBe(1);
            expect(stats.byState['completed']).toBe(1);
        });
    });
});
