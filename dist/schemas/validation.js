'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.MultiCloudSchedulingRequestSchema =
  exports.WorkloadSchema =
  exports.WorkloadConstraintsSchema =
  exports.ResourceCapacitySchema =
  exports.CloudProviderSchema =
  exports.OptimizationRequestSchema =
  exports.EngineConfigSchema =
    void 0;
const zod_1 = require('zod');
exports.EngineConfigSchema = zod_1.z.object({
  maxConcurrentTasks: zod_1.z.number().int().positive().optional().default(5),
  timeoutMs: zod_1.z.number().int().positive().optional().default(30000),
  verbose: zod_1.z.boolean().optional().default(false),
  enablePlugins: zod_1.z.boolean().optional().default(false),
  enableWorkloadCollection: zod_1.z.boolean().optional().default(false),
});
exports.OptimizationRequestSchema = zod_1.z.object({
  id: zod_1.z.string().min(1),
  type: zod_1.z.enum(['resource', 'scheduling', 'performance', 'ml-driven']),
  data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
  constraints: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
// Multi-cloud provider schemas
exports.CloudProviderSchema = zod_1.z.enum(['aws', 'gcp', 'azure', 'edge']);
exports.ResourceCapacitySchema = zod_1.z.object({
  cpu: zod_1.z.number().positive(),
  memory: zod_1.z.number().positive(),
  storage: zod_1.z.number().positive().optional(),
  gpu: zod_1.z.number().int().nonnegative().optional(),
});
exports.WorkloadConstraintsSchema = zod_1.z.object({
  maxLatencyMs: zod_1.z.number().positive().optional(),
  dataResidency: zod_1.z.array(zod_1.z.string()).optional(),
  providerPreferences: zod_1.z.array(exports.CloudProviderSchema).optional(),
});
exports.WorkloadSchema = zod_1.z.object({
  id: zod_1.z.string().min(1),
  resources: exports.ResourceCapacitySchema,
  preferredRegions: zod_1.z.array(zod_1.z.string()).optional(),
  requiredLabels: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
  constraints: exports.WorkloadConstraintsSchema.optional(),
});
exports.MultiCloudSchedulingRequestSchema = zod_1.z.object({
  workloads: zod_1.z.array(exports.WorkloadSchema).min(1),
  enableGeoSharding: zod_1.z.boolean().optional().default(true),
});
