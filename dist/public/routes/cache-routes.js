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
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheRouter = void 0;
const express_1 = require("express");
const api_js_1 = require("../api.js");
exports.cacheRouter = (0, express_1.Router)();
const engine = new api_js_1.EngineOps({ verbose: false });
/**
 * GET /api/v1/cache/stats
 * Get cache statistics
 */
exports.cacheRouter.get('/stats', async (_req, res) => {
    try {
        const stats = engine.getCacheStats();
        res.status(200).json(stats);
    }
    catch (error) {
        res.status(500).json({
            error: 'Failed to get cache stats',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
