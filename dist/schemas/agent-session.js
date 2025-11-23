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
exports.AgentSessionSchema = exports.SessionStateSchema = exports.AgentSessionRequestSchema = exports.SessionContextSchema = exports.SessionTypeSchema = void 0;
const zod_1 = require("zod");
/**
 * Session types for agent workflows
 */
exports.SessionTypeSchema = zod_1.z.enum(['metrics', 'policy', 'simulation', 'audit', 'custom']);
/**
 * Initial context and parameters for an agent session
 */
exports.SessionContextSchema = zod_1.z.object({
    agents: zod_1.z.array(zod_1.z.string()).optional().describe('List of agent names participating in the session'),
    state: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().describe('Initial or desired state'),
    policy: zod_1.z.string().optional().describe('Reference to policy file or rules'),
    dataSource: zod_1.z.string().optional().describe('Logs, configs, input files, or other data sources'),
    objective: zod_1.z.string().optional().describe('Desired outcome or actions'),
    additionalSettings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().describe('Additional settings like rate limits, resource quotas, topology, explainability'),
});
/**
 * Agent session creation request
 */
exports.AgentSessionRequestSchema = zod_1.z.object({
    sessionType: exports.SessionTypeSchema.describe('Type of session to create'),
    sessionId: zod_1.z.string().min(1).describe('Unique identifier for the session'),
    context: exports.SessionContextSchema.optional().describe('Initial context and parameters'),
});
/**
 * Agent session state
 */
exports.SessionStateSchema = zod_1.z.enum(['init', 'running', 'paused', 'completed', 'failed']);
/**
 * Agent session response
 */
exports.AgentSessionSchema = zod_1.z.object({
    sessionType: exports.SessionTypeSchema,
    sessionId: zod_1.z.string(),
    context: exports.SessionContextSchema.optional(),
    state: exports.SessionStateSchema,
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    result: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    error: zod_1.z.string().optional(),
});
