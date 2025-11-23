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
const globals_1 = require("@jest/globals");
const engine_1 = require("../engine");
(0, globals_1.describe)('OptimizationEngine', () => {
    let engine;
    (0, globals_1.beforeEach)(() => {
        engine = new engine_1.OptimizationEngine({ verbose: false });
    });
    (0, globals_1.describe)('Initialization', () => {
        (0, globals_1.it)('should initialize successfully', async () => {
            await (0, globals_1.expect)(engine.init()).resolves.not.toThrow();
        });
        (0, globals_1.it)('should throw error if optimize called before init', async () => {
            const request = {
                id: 'test-1',
                type: 'resource',
                data: {}
            };
            await (0, globals_1.expect)(engine.optimize(request)).rejects.toThrow('Engine not initialized');
        });
    });
    (0, globals_1.describe)('Resource Optimization', () => {
        (0, globals_1.beforeEach)(async () => {
            await engine.init();
        });
        (0, globals_1.it)('should optimize resource allocation with bin packing', async () => {
            const request = {
                id: 'resource-test-1',
                type: 'resource',
                data: {
                    items: [
                        { id: 'item-1', cpu: 50, memory: 500 },
                        { id: 'item-2', cpu: 30, memory: 300 }
                    ],
                    nodeCapacity: { cpu: 100, memory: 1000 }
                }
            };
            const result = await engine.optimize(request);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.requestId).toBe('resource-test-1');
            (0, globals_1.expect)(result.result).toHaveProperty('nodes');
            (0, globals_1.expect)(result.metrics).toHaveProperty('durationMs');
        });
        (0, globals_1.it)('should handle missing items gracefully', async () => {
            const request = {
                id: 'resource-test-2',
                type: 'resource',
                data: {
                    nodeCapacity: { cpu: 100, memory: 1000 }
                }
            };
            const result = await engine.optimize(request);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Missing items');
        });
    });
    (0, globals_1.describe)('Scheduling Optimization', () => {
        (0, globals_1.beforeEach)(async () => {
            await engine.init();
        });
        (0, globals_1.it)('should schedule task to least loaded node', async () => {
            const request = {
                id: 'sched-test-1',
                type: 'scheduling',
                data: {
                    task: { id: 'task-1', cpuRequired: 10, memoryRequired: 10 },
                    nodes: [
                        { id: 'node-A', cpuLoad: 80, memoryLoad: 80 },
                        { id: 'node-B', cpuLoad: 20, memoryLoad: 20 }
                    ]
                }
            };
            const result = await engine.optimize(request);
            (0, globals_1.expect)(result.success).toBe(true);
            (0, globals_1.expect)(result.result.nodeId).toBe('node-B');
        });
    });
    (0, globals_1.describe)('Validation', () => {
        (0, globals_1.beforeEach)(async () => {
            await engine.init();
        });
        (0, globals_1.it)('should reject invalid request type', async () => {
            const request = {
                id: 'invalid-1',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: 'invalid-type',
                data: {}
            };
            const result = await engine.optimize(request);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Validation failed');
        });
        (0, globals_1.it)('should reject missing request id', async () => {
            const request = {
                type: 'resource',
                data: {}
            };
            const result = await engine.optimize(request);
            (0, globals_1.expect)(result.success).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Validation failed');
        });
    });
    (0, globals_1.describe)('Shutdown', () => {
        (0, globals_1.it)('should shutdown successfully', async () => {
            await engine.init();
            await (0, globals_1.expect)(engine.shutdown()).resolves.not.toThrow();
        });
    });
});
