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
import { EngineOps } from '../api.js';
import { OptimizationRequestSchema } from '../../schemas/validation.js';

export const optimizeRouter = Router();

// Singleton engine instance
const engine = new EngineOps({ verbose: false });
let engineInitialized = false;

// Ensure engine is initialized
async function ensureEngineInitialized() {
    if (!engineInitialized) {
        await engine.init();
        engineInitialized = true;
    }
}

/**
 * POST /api/v1/optimize
 * Submit an optimization request
 */
optimizeRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await ensureEngineInitialized();

        // Validate request body
        const validation = OptimizationRequestSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                error: 'Invalid request',
                details: validation.error.errors
            });
            return;
        }

        // Process optimization
        const result = await engine.optimize(validation.data);

        // Return result
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        next(error);
    }
});
