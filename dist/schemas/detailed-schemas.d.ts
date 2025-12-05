import { z } from 'zod';
/**
 * Resource optimization schemas
 */
export declare const ResourceItemSchema: z.ZodObject<
  {
    id: z.ZodString;
    cpu: z.ZodNumber;
    memory: z.ZodNumber;
  },
  z.core.$strip
>;
export declare const NodeCapacitySchema: z.ZodObject<
  {
    cpu: z.ZodNumber;
    memory: z.ZodNumber;
  },
  z.core.$strip
>;
export declare const ResourceOptimizationDataSchema: z.ZodObject<
  {
    items: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString;
          cpu: z.ZodNumber;
          memory: z.ZodNumber;
        },
        z.core.$strip
      >
    >;
    nodeCapacity: z.ZodObject<
      {
        cpu: z.ZodNumber;
        memory: z.ZodNumber;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
/**
 * Scheduling optimization schemas
 */
export declare const TaskSchema: z.ZodObject<
  {
    id: z.ZodString;
    cpuRequired: z.ZodNumber;
    memoryRequired: z.ZodNumber;
  },
  z.core.$strip
>;
export declare const NodeSchema: z.ZodObject<
  {
    id: z.ZodString;
    cpuLoad: z.ZodNumber;
    memoryLoad: z.ZodNumber;
  },
  z.core.$strip
>;
export declare const SchedulingOptimizationDataSchema: z.ZodObject<
  {
    task: z.ZodObject<
      {
        id: z.ZodString;
        cpuRequired: z.ZodNumber;
        memoryRequired: z.ZodNumber;
      },
      z.core.$strip
    >;
    nodes: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString;
          cpuLoad: z.ZodNumber;
          memoryLoad: z.ZodNumber;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
/**
 * Performance optimization schemas
 */
export declare const PerformanceOptimizationDataSchema: z.ZodObject<
  {
    targetMetric: z.ZodEnum<{
      latency: 'latency';
      cost: 'cost';
      throughput: 'throughput';
    }>;
    currentValue: z.ZodNumber;
    targetValue: z.ZodNumber;
    constraints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  },
  z.core.$strip
>;
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
//# sourceMappingURL=detailed-schemas.d.ts.map
