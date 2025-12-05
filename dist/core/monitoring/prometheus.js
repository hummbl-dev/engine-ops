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
exports.register =
  exports.activeConnections =
  exports.cacheMisses =
  exports.cacheHits =
  exports.requestDuration =
  exports.requestCounter =
    void 0;
const prom_client_1 = require('prom-client');
Object.defineProperty(exports, 'register', {
  enumerable: true,
  get: function () {
    return prom_client_1.register;
  },
});
// Request counter
exports.requestCounter = new prom_client_1.Counter({
  name: 'engine_ops_requests_total',
  help: 'Total number of optimization requests',
  labelNames: ['type', 'status'],
});
// Request duration histogram
exports.requestDuration = new prom_client_1.Histogram({
  name: 'engine_ops_request_duration_ms',
  help: 'Request duration in milliseconds',
  labelNames: ['type'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
});
// Cache hit counter
exports.cacheHits = new prom_client_1.Counter({
  name: 'engine_ops_cache_hits_total',
  help: 'Total number of cache hits',
});
// Cache miss counter
exports.cacheMisses = new prom_client_1.Counter({
  name: 'engine_ops_cache_misses_total',
  help: 'Total number of cache misses',
});
// Active connections gauge
exports.activeConnections = new prom_client_1.Gauge({
  name: 'engine_ops_active_connections',
  help: 'Number of active WebSocket connections',
});
