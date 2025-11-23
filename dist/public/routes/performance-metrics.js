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
exports.metricsRouter = void 0;
const express_1 = require("express");
const metrics_js_1 = require("../../core/monitoring/metrics.js");
exports.metricsRouter = (0, express_1.Router)();
/**
 * GET /api/v1/metrics
 * Get performance metrics
 */
exports.metricsRouter.get('/', (_req, res) => {
    const aggregated = metrics_js_1.metricsCollector.getAggregated();
    const recent = metrics_js_1.metricsCollector.getRecent(10);
    res.status(200).json({
        aggregated,
        recent
    });
});
