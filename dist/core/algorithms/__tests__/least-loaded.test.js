"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const least_loaded_1 = require("../least-loaded");
(0, globals_1.describe)('LeastLoadedScheduler', () => {
    let scheduler;
    (0, globals_1.beforeEach)(() => {
        scheduler = new least_loaded_1.LeastLoadedScheduler();
    });
    (0, globals_1.describe)('Basic Scheduling', () => {
        (0, globals_1.it)('should select the least loaded node', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [
                { id: 'node-A', cpuLoad: 80, memoryLoad: 80 },
                { id: 'node-B', cpuLoad: 20, memoryLoad: 20 },
                { id: 'node-C', cpuLoad: 50, memoryLoad: 50 }
            ];
            const result = scheduler.schedule(task, nodes);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result.nodeId).toBe('node-B');
        });
        (0, globals_1.it)('should calculate estimated load after assignment', () => {
            const task = { id: 'task-1', cpuRequired: 15, memoryRequired: 25 };
            const nodes = [
                { id: 'node-A', cpuLoad: 30, memoryLoad: 40 }
            ];
            const result = scheduler.schedule(task, nodes);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result.estimatedLoadAfter.cpu).toBe(45);
            (0, globals_1.expect)(result.estimatedLoadAfter.memory).toBe(65);
        });
    });
    (0, globals_1.describe)('Edge Cases', () => {
        (0, globals_1.it)('should return null when no nodes available', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [];
            const result = scheduler.schedule(task, nodes);
            (0, globals_1.expect)(result).toBeNull();
        });
        (0, globals_1.it)('should handle single node', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [
                { id: 'node-A', cpuLoad: 50, memoryLoad: 50 }
            ];
            const result = scheduler.schedule(task, nodes);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result.nodeId).toBe('node-A');
        });
        (0, globals_1.it)('should cap estimated load at 100%', () => {
            const task = { id: 'task-1', cpuRequired: 60, memoryRequired: 70 };
            const nodes = [
                { id: 'node-A', cpuLoad: 80, memoryLoad: 90 }
            ];
            const result = scheduler.schedule(task, nodes);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result.estimatedLoadAfter.cpu).toBe(100);
            (0, globals_1.expect)(result.estimatedLoadAfter.memory).toBe(100);
        });
    });
    (0, globals_1.describe)('Load Balancing', () => {
        (0, globals_1.it)('should prefer node with lower combined load', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [
                { id: 'node-A', cpuLoad: 30, memoryLoad: 50 }, // Combined: 80
                { id: 'node-B', cpuLoad: 40, memoryLoad: 30 }, // Combined: 70
                { id: 'node-C', cpuLoad: 25, memoryLoad: 60 } // Combined: 85
            ];
            const result = scheduler.schedule(task, nodes);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result.nodeId).toBe('node-B');
        });
        (0, globals_1.it)('should handle nodes with zero load', () => {
            const task = { id: 'task-1', cpuRequired: 10, memoryRequired: 10 };
            const nodes = [
                { id: 'node-A', cpuLoad: 0, memoryLoad: 0 },
                { id: 'node-B', cpuLoad: 20, memoryLoad: 20 }
            ];
            const result = scheduler.schedule(task, nodes);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result.nodeId).toBe('node-A');
        });
    });
});
