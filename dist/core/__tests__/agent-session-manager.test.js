"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const agent_session_manager_js_1 = require("../agent-session-manager.js");
(0, globals_1.describe)('AgentSessionManager', () => {
    let manager;
    (0, globals_1.beforeEach)(() => {
        manager = new agent_session_manager_js_1.AgentSessionManager();
    });
    (0, globals_1.describe)('createSession', () => {
        (0, globals_1.it)('should create a new metrics session', async () => {
            const request = {
                sessionType: 'metrics',
                sessionId: 'metrics-001',
                context: {
                    agents: ['MetricsAgent'],
                    objective: 'Monitor system metrics',
                },
            };
            const session = await manager.createSession(request);
            (0, globals_1.expect)(session.sessionId).toBe('metrics-001');
            (0, globals_1.expect)(session.sessionType).toBe('metrics');
            (0, globals_1.expect)(session.state).toBe('init');
            (0, globals_1.expect)(session.context?.agents).toEqual(['MetricsAgent']);
            (0, globals_1.expect)(session.createdAt).toBeDefined();
            (0, globals_1.expect)(session.updatedAt).toBeDefined();
        });
        (0, globals_1.it)('should create a simulation session', async () => {
            const request = {
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
            (0, globals_1.expect)(session.sessionType).toBe('simulation');
            (0, globals_1.expect)(session.sessionId).toBe('sim-ops-2025-001');
            (0, globals_1.expect)(session.context?.agents).toHaveLength(4);
            (0, globals_1.expect)(session.context?.policy).toBe('ops_policy.json');
            (0, globals_1.expect)(session.context?.additionalSettings).toEqual({ maxSteps: 10, enableAudit: true });
        });
        (0, globals_1.it)('should throw error for duplicate session ID', async () => {
            const request = {
                sessionType: 'policy',
                sessionId: 'duplicate-id',
            };
            await manager.createSession(request);
            await (0, globals_1.expect)(manager.createSession(request)).rejects.toThrow('already exists');
        });
        (0, globals_1.it)('should reject invalid session type', async () => {
            const request = {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                sessionType: 'invalid-type',
                sessionId: 'test-001',
            };
            await (0, globals_1.expect)(manager.createSession(request)).rejects.toThrow('validation failed');
        });
    });
    (0, globals_1.describe)('getSession', () => {
        (0, globals_1.it)('should retrieve an existing session', async () => {
            const request = {
                sessionType: 'audit',
                sessionId: 'audit-001',
            };
            await manager.createSession(request);
            const session = manager.getSession('audit-001');
            (0, globals_1.expect)(session).toBeDefined();
            (0, globals_1.expect)(session?.sessionId).toBe('audit-001');
        });
        (0, globals_1.it)('should return undefined for non-existent session', () => {
            const session = manager.getSession('non-existent');
            (0, globals_1.expect)(session).toBeUndefined();
        });
    });
    (0, globals_1.describe)('listSessions', () => {
        (0, globals_1.beforeEach)(async () => {
            await manager.createSession({ sessionType: 'metrics', sessionId: 'metrics-001' });
            await manager.createSession({ sessionType: 'policy', sessionId: 'policy-001' });
            await manager.createSession({ sessionType: 'simulation', sessionId: 'sim-001' });
            await manager.updateSessionState('metrics-001', 'running');
        });
        (0, globals_1.it)('should list all sessions', () => {
            const sessions = manager.listSessions();
            (0, globals_1.expect)(sessions).toHaveLength(3);
        });
        (0, globals_1.it)('should filter sessions by type', () => {
            const sessions = manager.listSessions({ sessionType: 'metrics' });
            (0, globals_1.expect)(sessions).toHaveLength(1);
            (0, globals_1.expect)(sessions[0].sessionType).toBe('metrics');
        });
        (0, globals_1.it)('should filter sessions by state', () => {
            const sessions = manager.listSessions({ state: 'running' });
            (0, globals_1.expect)(sessions).toHaveLength(1);
            (0, globals_1.expect)(sessions[0].state).toBe('running');
        });
        (0, globals_1.it)('should filter by both type and state', () => {
            const sessions = manager.listSessions({ sessionType: 'metrics', state: 'running' });
            (0, globals_1.expect)(sessions).toHaveLength(1);
        });
    });
    (0, globals_1.describe)('updateSessionState', () => {
        (0, globals_1.it)('should update session state', async () => {
            const request = {
                sessionType: 'custom',
                sessionId: 'custom-001',
            };
            await manager.createSession(request);
            // Add small delay to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));
            const updatedSession = await manager.updateSessionState('custom-001', 'running');
            (0, globals_1.expect)(updatedSession.state).toBe('running');
            (0, globals_1.expect)(new Date(updatedSession.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(updatedSession.createdAt).getTime());
        });
        (0, globals_1.it)('should update session with result', async () => {
            await manager.createSession({ sessionType: 'metrics', sessionId: 'metrics-002' });
            const result = { metricsCollected: 100, errors: 0 };
            const updatedSession = await manager.updateSessionState('metrics-002', 'completed', result);
            (0, globals_1.expect)(updatedSession.state).toBe('completed');
            (0, globals_1.expect)(updatedSession.result).toEqual(result);
        });
        (0, globals_1.it)('should update session with error', async () => {
            await manager.createSession({ sessionType: 'policy', sessionId: 'policy-002' });
            const updatedSession = await manager.updateSessionState('policy-002', 'failed', undefined, 'Connection timeout');
            (0, globals_1.expect)(updatedSession.state).toBe('failed');
            (0, globals_1.expect)(updatedSession.error).toBe('Connection timeout');
        });
        (0, globals_1.it)('should throw error for non-existent session', async () => {
            await (0, globals_1.expect)(manager.updateSessionState('non-existent', 'running')).rejects.toThrow('not found');
        });
    });
    (0, globals_1.describe)('deleteSession', () => {
        (0, globals_1.it)('should delete an existing session', async () => {
            await manager.createSession({ sessionType: 'audit', sessionId: 'audit-002' });
            const deleted = manager.deleteSession('audit-002');
            (0, globals_1.expect)(deleted).toBe(true);
            (0, globals_1.expect)(manager.getSession('audit-002')).toBeUndefined();
        });
        (0, globals_1.it)('should return false for non-existent session', () => {
            const deleted = manager.deleteSession('non-existent');
            (0, globals_1.expect)(deleted).toBe(false);
        });
    });
    (0, globals_1.describe)('getStats', () => {
        (0, globals_1.beforeEach)(async () => {
            await manager.createSession({ sessionType: 'metrics', sessionId: 'metrics-stat-1' });
            await manager.createSession({ sessionType: 'metrics', sessionId: 'metrics-stat-2' });
            await manager.createSession({ sessionType: 'policy', sessionId: 'policy-stat-1' });
            await manager.createSession({ sessionType: 'simulation', sessionId: 'sim-stat-1' });
            await manager.updateSessionState('metrics-stat-1', 'running');
            await manager.updateSessionState('metrics-stat-2', 'completed');
        });
        (0, globals_1.it)('should return correct statistics', () => {
            const stats = manager.getStats();
            (0, globals_1.expect)(stats.total).toBe(4);
            (0, globals_1.expect)(stats.byType['metrics']).toBe(2);
            (0, globals_1.expect)(stats.byType['policy']).toBe(1);
            (0, globals_1.expect)(stats.byType['simulation']).toBe(1);
            (0, globals_1.expect)(stats.byState['init']).toBe(2);
            (0, globals_1.expect)(stats.byState['running']).toBe(1);
            (0, globals_1.expect)(stats.byState['completed']).toBe(1);
        });
    });
});
