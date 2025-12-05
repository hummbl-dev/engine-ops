import { z } from 'zod';
/**
 * Session types for agent workflows
 */
export declare const SessionTypeSchema: z.ZodEnum<{
  metrics: 'metrics';
  policy: 'policy';
  simulation: 'simulation';
  audit: 'audit';
  custom: 'custom';
}>;
/**
 * Initial context and parameters for an agent session
 */
export declare const SessionContextSchema: z.ZodObject<
  {
    agents: z.ZodOptional<z.ZodArray<z.ZodString>>;
    state: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    policy: z.ZodOptional<z.ZodString>;
    dataSource: z.ZodOptional<z.ZodString>;
    objective: z.ZodOptional<z.ZodString>;
    additionalSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  },
  z.core.$strip
>;
/**
 * Agent session creation request
 */
export declare const AgentSessionRequestSchema: z.ZodObject<
  {
    sessionType: z.ZodEnum<{
      metrics: 'metrics';
      policy: 'policy';
      simulation: 'simulation';
      audit: 'audit';
      custom: 'custom';
    }>;
    sessionId: z.ZodString;
    context: z.ZodOptional<
      z.ZodObject<
        {
          agents: z.ZodOptional<z.ZodArray<z.ZodString>>;
          state: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
          policy: z.ZodOptional<z.ZodString>;
          dataSource: z.ZodOptional<z.ZodString>;
          objective: z.ZodOptional<z.ZodString>;
          additionalSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
/**
 * Agent session state
 */
export declare const SessionStateSchema: z.ZodEnum<{
  init: 'init';
  running: 'running';
  paused: 'paused';
  completed: 'completed';
  failed: 'failed';
}>;
/**
 * Agent session response
 */
export declare const AgentSessionSchema: z.ZodObject<
  {
    sessionType: z.ZodEnum<{
      metrics: 'metrics';
      policy: 'policy';
      simulation: 'simulation';
      audit: 'audit';
      custom: 'custom';
    }>;
    sessionId: z.ZodString;
    context: z.ZodOptional<
      z.ZodObject<
        {
          agents: z.ZodOptional<z.ZodArray<z.ZodString>>;
          state: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
          policy: z.ZodOptional<z.ZodString>;
          dataSource: z.ZodOptional<z.ZodString>;
          objective: z.ZodOptional<z.ZodString>;
          additionalSettings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        },
        z.core.$strip
      >
    >;
    state: z.ZodEnum<{
      init: 'init';
      running: 'running';
      paused: 'paused';
      completed: 'completed';
      failed: 'failed';
    }>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    result: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    error: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;
export type SessionType = z.infer<typeof SessionTypeSchema>;
export type SessionContext = z.infer<typeof SessionContextSchema>;
export type AgentSessionRequest = z.infer<typeof AgentSessionRequestSchema>;
export type SessionState = z.infer<typeof SessionStateSchema>;
export type AgentSession = z.infer<typeof AgentSessionSchema>;
//# sourceMappingURL=agent-session.d.ts.map
