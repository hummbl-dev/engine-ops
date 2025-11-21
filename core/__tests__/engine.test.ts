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

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OptimizationEngine } from '../engine';
import type { OptimizationRequest } from '../interfaces';

describe('OptimizationEngine', () => {
    let engine: OptimizationEngine;

    beforeEach(() => {
        engine = new OptimizationEngine({ verbose: false });
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            await expect(engine.init()).resolves.not.toThrow();
        });

        it('should throw error if optimize called before init', async () => {
            const request: OptimizationRequest = {
                id: 'test-1',
                type: 'resource',
                data: {}
            };
            await expect(engine.optimize(request)).rejects.toThrow('Engine not initialized');
        });
    });

    describe('Resource Optimization', () => {
        beforeEach(async () => {
            await engine.init();
        });

        it('should optimize resource allocation with bin packing', async () => {
            const request: OptimizationRequest = {
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

            expect(result.success).toBe(true);
            expect(result.requestId).toBe('resource-test-1');
            expect(result.result).toHaveProperty('nodes');
            expect(result.metrics).toHaveProperty('durationMs');
        });

        it('should handle missing items gracefully', async () => {
            const request: OptimizationRequest = {
                id: 'resource-test-2',
                type: 'resource',
                data: {
                    nodeCapacity: { cpu: 100, memory: 1000 }
                }
            };

            const result = await engine.optimize(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Missing items');
        });
    });

    describe('Scheduling Optimization', () => {
        beforeEach(async () => {
            await engine.init();
        });

        it('should schedule task to least loaded node', async () => {
            const request: OptimizationRequest = {
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

            expect(result.success).toBe(true);
            expect((result.result as any).nodeId).toBe('node-B');
        });
    });

    describe('Validation', () => {
        beforeEach(async () => {
            await engine.init();
        });

        it('should reject invalid request type', async () => {
            const request = {
                id: 'invalid-1',
                type: 'invalid-type',
                data: {}
            } as any;

            const result = await engine.optimize(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Validation failed');
        });

        it('should reject missing request id', async () => {
            const request = {
                type: 'resource',
                data: {}
            } as any;

            const result = await engine.optimize(request);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Validation failed');
        });
    });

    describe('Shutdown', () => {
        it('should shutdown successfully', async () => {
            await engine.init();
            await expect(engine.shutdown()).resolves.not.toThrow();
        });
    });
});
