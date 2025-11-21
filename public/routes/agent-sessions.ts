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

import { Router, Request, Response, NextFunction } from 'express';
import { AgentSessionManager } from '../../core/agent-session-manager.js';
import { AgentSessionRequestSchema } from '../../schemas/agent-session.js';

export const agentSessionsRouter = Router();

// Singleton session manager
const sessionManager = new AgentSessionManager();

/**
 * POST /api/v1/agent-sessions
 * Create a new agent session
 */
agentSessionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = AgentSessionRequestSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Invalid request',
                details: validation.error.errors,
            });
            return;
        }

        const session = await sessionManager.createSession(validation.data);
        res.status(201).json(session);
    } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
            res.status(409).json({
                error: error.message,
            });
            return;
        }
        next(error);
    }
});

/**
 * GET /api/v1/agent-sessions
 * List all agent sessions with optional filters
 */
agentSessionsRouter.get('/', (req: Request, res: Response) => {
    const { sessionType, state } = req.query;

    const filters: { sessionType?: string; state?: any } = {};
    if (sessionType && typeof sessionType === 'string') {
        filters.sessionType = sessionType;
    }
    if (state && typeof state === 'string') {
        filters.state = state as any;
    }

    const sessions = sessionManager.listSessions(filters);
    res.status(200).json({
        count: sessions.length,
        sessions,
    });
});

/**
 * GET /api/v1/agent-sessions/stats
 * Get session statistics
 */
agentSessionsRouter.get('/stats', (_req: Request, res: Response) => {
    const stats = sessionManager.getStats();
    res.status(200).json(stats);
});

/**
 * GET /api/v1/agent-sessions/:sessionId
 * Get a specific agent session
 */
agentSessionsRouter.get('/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const session = sessionManager.getSession(sessionId);

    if (!session) {
        res.status(404).json({
            error: `Session ${sessionId} not found`,
        });
        return;
    }

    res.status(200).json(session);
});

/**
 * PATCH /api/v1/agent-sessions/:sessionId
 * Update session state
 */
agentSessionsRouter.patch('/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const { state, result, error } = req.body;

        if (!state) {
            res.status(400).json({
                error: 'State is required',
            });
            return;
        }

        const session = await sessionManager.updateSessionState(sessionId, state, result, error);
        res.status(200).json(session);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({
                error: (error as Error).message,
            });
            return;
        }
        next(error);
    }
});

/**
 * DELETE /api/v1/agent-sessions/:sessionId
 * Delete an agent session
 */
agentSessionsRouter.delete('/:sessionId', (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const deleted = sessionManager.deleteSession(sessionId);

    if (!deleted) {
        res.status(404).json({
            error: `Session ${sessionId} not found`,
        });
        return;
    }

    res.status(204).send();
});
