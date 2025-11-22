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
 * Session types for agent workflows
 */
export const SessionTypeSchema = z.enum(['metrics', 'policy', 'simulation', 'audit', 'custom']);

/**
 * Initial context and parameters for an agent session
 */
export const SessionContextSchema = z.object({
    agents: z.array(z.string()).optional().describe('List of agent names participating in the session'),
    state: z.record(z.string(), z.unknown()).optional().describe('Initial or desired state'),
    policy: z.string().optional().describe('Reference to policy file or rules'),
    dataSource: z.string().optional().describe('Logs, configs, input files, or other data sources'),
    objective: z.string().optional().describe('Desired outcome or actions'),
    additionalSettings: z.record(z.string(), z.unknown()).optional().describe('Additional settings like rate limits, resource quotas, topology, explainability'),
});

/**
 * Agent session creation request
 */
export const AgentSessionRequestSchema = z.object({
    sessionType: SessionTypeSchema.describe('Type of session to create'),
    sessionId: z.string().min(1).describe('Unique identifier for the session'),
    context: SessionContextSchema.optional().describe('Initial context and parameters'),
});

/**
 * Agent session state
 */
export const SessionStateSchema = z.enum(['init', 'running', 'paused', 'completed', 'failed']);

/**
 * Agent session response
 */
export const AgentSessionSchema = z.object({
    sessionType: SessionTypeSchema,
    sessionId: z.string(),
    context: SessionContextSchema.optional(),
    state: SessionStateSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    result: z.record(z.string(), z.unknown()).optional(),
    error: z.string().optional(),
});

// Export types
export type SessionType = z.infer<typeof SessionTypeSchema>;
export type SessionContext = z.infer<typeof SessionContextSchema>;
export type AgentSessionRequest = z.infer<typeof AgentSessionRequestSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
export type AgentSession = z.infer<typeof AgentSessionSchema>;
