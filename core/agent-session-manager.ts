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

import {
    AgentSession,
    AgentSessionRequest,
    AgentSessionRequestSchema,
    SessionState,
} from '../schemas/agent-session.js';
import { Logger } from './monitoring/logger.js';

/**
 * Manages agent sessions for various workflow types
 */
export class AgentSessionManager {
    private sessions: Map<string, AgentSession>;
    private logger: Logger;

    constructor() {
        this.sessions = new Map();
        this.logger = new Logger();
    }

    /**
     * Create a new agent session
     */
    async createSession(request: AgentSessionRequest): Promise<AgentSession> {
        // Validate request
        const validation = AgentSessionRequestSchema.safeParse(request);
        if (!validation.success) {
            const errorMsg = `Session validation failed: ${JSON.stringify(validation.error.errors)}`;
            this.logger.error(errorMsg);
            throw new Error(errorMsg);
        }

        const { sessionId, sessionType, context } = validation.data;

        // Check if session already exists
        if (this.sessions.has(sessionId)) {
            throw new Error(`Session with ID ${sessionId} already exists`);
        }

        // Create new session
        const now = new Date().toISOString();
        const session: AgentSession = {
            sessionId,
            sessionType,
            context,
            state: 'init',
            createdAt: now,
            updatedAt: now,
        };

        // Store session
        this.sessions.set(sessionId, session);

        this.logger.info(`Created ${sessionType} session: ${sessionId}`, {
            context: context || {},
        });

        return session;
    }

    /**
     * Get a session by ID
     */
    getSession(sessionId: string): AgentSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * List all sessions, optionally filtered by type or state
     */
    listSessions(filters?: {
        sessionType?: string;
        state?: SessionState;
    }): AgentSession[] {
        let sessions = Array.from(this.sessions.values());

        if (filters?.sessionType) {
            sessions = sessions.filter((s) => s.sessionType === filters.sessionType);
        }

        if (filters?.state) {
            sessions = sessions.filter((s) => s.state === filters.state);
        }

        return sessions;
    }

    /**
     * Update session state
     */
    async updateSessionState(
        sessionId: string,
        state: SessionState,
        result?: Record<string, unknown>,
        error?: string
    ): Promise<AgentSession> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        session.state = state;
        session.updatedAt = new Date().toISOString();

        if (result) {
            session.result = result;
        }

        if (error) {
            session.error = error;
        }

        this.sessions.set(sessionId, session);

        this.logger.info(`Updated session ${sessionId} state to ${state}`);

        return session;
    }

    /**
     * Delete a session
     */
    deleteSession(sessionId: string): boolean {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            this.logger.info(`Deleted session: ${sessionId}`);
        }
        return deleted;
    }

    /**
     * Get session statistics
     */
    getStats(): {
        total: number;
        byType: Record<string, number>;
        byState: Record<string, number>;
    } {
        const sessions = Array.from(this.sessions.values());
        const byType: Record<string, number> = {};
        const byState: Record<string, number> = {};

        sessions.forEach((session) => {
            byType[session.sessionType] = (byType[session.sessionType] || 0) + 1;
            byState[session.state] = (byState[session.state] || 0) + 1;
        });

        return {
            total: sessions.length,
            byType,
            byState,
        };
    }
}
