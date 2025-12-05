'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.prometheusRouter = void 0;
const express_1 = require('express');
const metrics_js_1 = require('../../core/observability/metrics.js');
exports.prometheusRouter = (0, express_1.Router)();
/**
 * GET /metrics
 * Prometheus metrics endpoint
 */
exports.prometheusRouter.get('/', async (_req, res) => {
  try {
    res.set('Content-Type', metrics_js_1.register.contentType);
    res.end(await metrics_js_1.register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});
