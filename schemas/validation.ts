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

export const EngineConfigSchema = z.object({
    maxConcurrentTasks: z.number().int().positive().optional().default(5),
    timeoutMs: z.number().int().positive().optional().default(30000),
    verbose: z.boolean().optional().default(false),
});

export const OptimizationRequestSchema = z.object({
    id: z.string().min(1),
    type: z.enum(['resource', 'scheduling', 'performance'] as const),
    data: z.record(z.string(), z.unknown()),
    constraints: z.record(z.string(), z.unknown()).optional(),
});

// Multi-cloud provider schemas
export const CloudProviderSchema = z.enum(['aws', 'gcp', 'azure', 'edge']);

export const ResourceCapacitySchema = z.object({
    cpu: z.number().positive(),
    memory: z.number().positive(),
    storage: z.number().positive().optional(),
    gpu: z.number().int().nonnegative().optional(),
});

export const WorkloadConstraintsSchema = z.object({
    maxLatencyMs: z.number().positive().optional(),
    dataResidency: z.array(z.string()).optional(),
    providerPreferences: z.array(CloudProviderSchema).optional(),
});

export const WorkloadSchema = z.object({
    id: z.string().min(1),
    resources: ResourceCapacitySchema,
    preferredRegions: z.array(z.string()).optional(),
    requiredLabels: z.record(z.string(), z.string()).optional(),
    constraints: WorkloadConstraintsSchema.optional(),
});

export const MultiCloudSchedulingRequestSchema = z.object({
    workloads: z.array(WorkloadSchema).min(1),
    enableGeoSharding: z.boolean().optional().default(true),
});

export type EngineConfig = z.infer<typeof EngineConfigSchema>;
export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;
export type CloudProvider = z.infer<typeof CloudProviderSchema>;
export type ResourceCapacity = z.infer<typeof ResourceCapacitySchema>;
export type Workload = z.infer<typeof WorkloadSchema>;
export type MultiCloudSchedulingRequest = z.infer<typeof MultiCloudSchedulingRequestSchema>;
