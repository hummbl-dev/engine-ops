/*
 * Copyright (c) 2024-present, Hummbl Dev
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

export type EngineConfig = z.infer<typeof EngineConfigSchema>;
export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;
