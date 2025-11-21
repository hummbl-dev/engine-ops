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

import { Router, Request, Response } from 'express';

export const healthRouter = Router();

const startTime = Date.now();

/**
 * GET /api/v1/health
 * Health check endpoint
 */
healthRouter.get('/', (_req: Request, res: Response) => {
    const uptime = Date.now() - startTime;

    res.status(200).json({
        status: 'healthy',
        uptime: uptime,
        timestamp: new Date().toISOString(),
        service: 'engine-ops',
        version: '0.2.0'
    });
});

/**
 * GET /api/v1/health/live
 * Liveness probe - checks if the application is running
 */
healthRouter.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

/**
 * GET /api/v1/health/ready
 * Readiness probe - checks if the application is ready to serve traffic
 */
healthRouter.get('/ready', (_req: Request, res: Response) => {
    // In a real application, check database connections, cache, etc.
    const isReady = true; // Add actual readiness checks here

    if (isReady) {
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(503).json({
            status: 'not ready',
            timestamp: new Date().toISOString()
        });
    }
});
