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

import { Counter, Histogram, Gauge, register } from 'prom-client';

// Request counter
export const requestCounter = new Counter({
    name: 'engine_ops_requests_total',
    help: 'Total number of optimization requests',
    labelNames: ['type', 'status']
});

// Request duration histogram
export const requestDuration = new Histogram({
    name: 'engine_ops_request_duration_ms',
    help: 'Request duration in milliseconds',
    labelNames: ['type'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});

// Cache hit counter
export const cacheHits = new Counter({
    name: 'engine_ops_cache_hits_total',
    help: 'Total number of cache hits'
});

// Cache miss counter
export const cacheMisses = new Counter({
    name: 'engine_ops_cache_misses_total',
    help: 'Total number of cache misses'
});

// Active connections gauge
export const activeConnections = new Gauge({
    name: 'engine_ops_active_connections',
    help: 'Number of active WebSocket connections'
});

// Export registry for custom metrics
export { register };
