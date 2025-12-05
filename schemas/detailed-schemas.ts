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

import { z } from 'zod';

/**
 * Resource optimization schemas
 */
export const ResourceItemSchema = z.object({
  id: z.string(),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0),
});

export const NodeCapacitySchema = z.object({
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0),
});

export const ResourceOptimizationDataSchema = z.object({
  items: z.array(ResourceItemSchema),
  nodeCapacity: NodeCapacitySchema,
});

/**
 * Scheduling optimization schemas
 */
export const TaskSchema = z.object({
  id: z.string(),
  cpuRequired: z.number().min(0).max(100),
  memoryRequired: z.number().min(0).max(100),
});

export const NodeSchema = z.object({
  id: z.string(),
  cpuLoad: z.number().min(0).max(100),
  memoryLoad: z.number().min(0).max(100),
});

export const SchedulingOptimizationDataSchema = z.object({
  task: TaskSchema,
  nodes: z.array(NodeSchema).min(1),
});

/**
 * Performance optimization schemas
 */
export const PerformanceOptimizationDataSchema = z.object({
  targetMetric: z.enum(['latency', 'throughput', 'cost']),
  currentValue: z.number(),
  targetValue: z.number(),
  constraints: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Type exports
 */
export type ResourceItem = z.infer<typeof ResourceItemSchema>;
export type NodeCapacity = z.infer<typeof NodeCapacitySchema>;
export type ResourceOptimizationData = z.infer<typeof ResourceOptimizationDataSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Node = z.infer<typeof NodeSchema>;
export type SchedulingOptimizationData = z.infer<typeof SchedulingOptimizationDataSchema>;
export type PerformanceOptimizationData = z.infer<typeof PerformanceOptimizationDataSchema>;
