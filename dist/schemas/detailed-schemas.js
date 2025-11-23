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
exports.PerformanceOptimizationDataSchema = exports.SchedulingOptimizationDataSchema = exports.NodeSchema = exports.TaskSchema = exports.ResourceOptimizationDataSchema = exports.NodeCapacitySchema = exports.ResourceItemSchema = void 0;
const zod_1 = require("zod");
/**
 * Resource optimization schemas
 */
exports.ResourceItemSchema = zod_1.z.object({
    id: zod_1.z.string(),
    cpu: zod_1.z.number().min(0).max(100),
    memory: zod_1.z.number().min(0)
});
exports.NodeCapacitySchema = zod_1.z.object({
    cpu: zod_1.z.number().min(0).max(100),
    memory: zod_1.z.number().min(0)
});
exports.ResourceOptimizationDataSchema = zod_1.z.object({
    items: zod_1.z.array(exports.ResourceItemSchema),
    nodeCapacity: exports.NodeCapacitySchema
});
/**
 * Scheduling optimization schemas
 */
exports.TaskSchema = zod_1.z.object({
    id: zod_1.z.string(),
    cpuRequired: zod_1.z.number().min(0).max(100),
    memoryRequired: zod_1.z.number().min(0).max(100)
});
exports.NodeSchema = zod_1.z.object({
    id: zod_1.z.string(),
    cpuLoad: zod_1.z.number().min(0).max(100),
    memoryLoad: zod_1.z.number().min(0).max(100)
});
exports.SchedulingOptimizationDataSchema = zod_1.z.object({
    task: exports.TaskSchema,
    nodes: zod_1.z.array(exports.NodeSchema).min(1)
});
/**
 * Performance optimization schemas
 */
exports.PerformanceOptimizationDataSchema = zod_1.z.object({
    targetMetric: zod_1.z.enum(['latency', 'throughput', 'cost']),
    currentValue: zod_1.z.number(),
    targetValue: zod_1.z.number(),
    constraints: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional()
});
