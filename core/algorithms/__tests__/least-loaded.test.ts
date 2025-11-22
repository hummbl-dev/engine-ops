/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { LeastLoadedScheduler } from '../least-loaded';

interface NodeStatus {
    id: string;
    cpuLoad: number;
    memoryLoad: number;
}

interface Task {
    id: string;
    cpuRequired: number;
    memoryRequired: number;
}

describe('LeastLoadedScheduler', () => {
    let scheduler: LeastLoadedScheduler;

    beforeEach(() => {
        scheduler = new LeastLoadedScheduler();
    });

    describe('Basic Scheduling', () => {
        it('should select the least loaded node', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [
                { id: 'node-A', cpuLoad: 80, memoryLoad: 80 },
                { id: 'node-B', cpuLoad: 20, memoryLoad: 20 },
                { id: 'node-C', cpuLoad: 50, memoryLoad: 50 }
            ];

            const result = scheduler.schedule(task, nodes);

            expect(result).not.toBeNull();
            expect(result!.nodeId).toBe('node-B');
        });

        it('should calculate estimated load after assignment', () => {
            const task = { id: 'task-1', cpuRequired: 15, memoryRequired: 25 };
            const nodes = [
                { id: 'node-A', cpuLoad: 30, memoryLoad: 40 }
            ];

            const result = scheduler.schedule(task, nodes);

            expect(result).not.toBeNull();
            expect(result!.estimatedLoadAfter.cpu).toBe(45);
            expect(result!.estimatedLoadAfter.memory).toBe(65);
        });
    });

    describe('Edge Cases', () => {
        it('should return null when no nodes available', () => {
            const task: Task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes: NodeStatus[] = [];

            const result = scheduler.schedule(task, nodes);

            expect(result).toBeNull();
        });

        it('should handle single node', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [
                { id: 'node-A', cpuLoad: 50, memoryLoad: 50 }
            ];

            const result = scheduler.schedule(task, nodes);

            expect(result).not.toBeNull();
            expect(result!.nodeId).toBe('node-A');
        });

        it('should cap estimated load at 100%', () => {
            const task = { id: 'task-1', cpuRequired: 60, memoryRequired: 70 };
            const nodes = [
                { id: 'node-A', cpuLoad: 80, memoryLoad: 90 }
            ];

            const result = scheduler.schedule(task, nodes);

            expect(result).not.toBeNull();
            expect(result!.estimatedLoadAfter.cpu).toBe(100);
            expect(result!.estimatedLoadAfter.memory).toBe(100);
        });
    });

    describe('Load Balancing', () => {
        it('should prefer node with lower combined load', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [
                { id: 'node-A', cpuLoad: 30, memoryLoad: 50 }, // Combined: 80
                { id: 'node-B', cpuLoad: 40, memoryLoad: 30 }, // Combined: 70
                { id: 'node-C', cpuLoad: 25, memoryLoad: 60 }  // Combined: 85
            ];

            const result = scheduler.schedule(task, nodes);

            expect(result).not.toBeNull();
            expect(result!.nodeId).toBe('node-B');
        });

        it('should handle nodes with zero load', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [
                { id: 'node-A', cpuLoad: 0, memoryLoad: 0 },
                { id: 'node-B', cpuLoad: 20, memoryLoad: 20 }
            ];

            const result = scheduler.schedule(task, nodes);

            expect(result).not.toBeNull();
            expect(result!.nodeId).toBe('node-A');
        });
    });
});
