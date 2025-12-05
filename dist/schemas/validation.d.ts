import { z } from 'zod';
export declare const EngineConfigSchema: z.ZodObject<
  {
    maxConcurrentTasks: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    timeoutMs: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    verbose: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    enablePlugins: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    enableWorkloadCollection: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
  },
  z.core.$strip
>;
export declare const OptimizationRequestSchema: z.ZodObject<
  {
    id: z.ZodString;
    type: z.ZodEnum<{
      resource: 'resource';
      scheduling: 'scheduling';
      performance: 'performance';
      'ml-driven': 'ml-driven';
    }>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    constraints: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
  },
  z.core.$strip
>;
export declare const CloudProviderSchema: z.ZodEnum<{
  aws: 'aws';
  gcp: 'gcp';
  azure: 'azure';
  edge: 'edge';
}>;
export declare const ResourceCapacitySchema: z.ZodObject<
  {
    cpu: z.ZodNumber;
    memory: z.ZodNumber;
    storage: z.ZodOptional<z.ZodNumber>;
    gpu: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
>;
export declare const WorkloadConstraintsSchema: z.ZodObject<
  {
    maxLatencyMs: z.ZodOptional<z.ZodNumber>;
    dataResidency: z.ZodOptional<z.ZodArray<z.ZodString>>;
    providerPreferences: z.ZodOptional<
      z.ZodArray<
        z.ZodEnum<{
          aws: 'aws';
          gcp: 'gcp';
          azure: 'azure';
          edge: 'edge';
        }>
      >
    >;
  },
  z.core.$strip
>;
export declare const WorkloadSchema: z.ZodObject<
  {
    id: z.ZodString;
    resources: z.ZodObject<
      {
        cpu: z.ZodNumber;
        memory: z.ZodNumber;
        storage: z.ZodOptional<z.ZodNumber>;
        gpu: z.ZodOptional<z.ZodNumber>;
      },
      z.core.$strip
    >;
    preferredRegions: z.ZodOptional<z.ZodArray<z.ZodString>>;
    requiredLabels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    constraints: z.ZodOptional<
      z.ZodObject<
        {
          maxLatencyMs: z.ZodOptional<z.ZodNumber>;
          dataResidency: z.ZodOptional<z.ZodArray<z.ZodString>>;
          providerPreferences: z.ZodOptional<
            z.ZodArray<
              z.ZodEnum<{
                aws: 'aws';
                gcp: 'gcp';
                azure: 'azure';
                edge: 'edge';
              }>
            >
          >;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
export declare const MultiCloudSchedulingRequestSchema: z.ZodObject<
  {
    workloads: z.ZodArray<
      z.ZodObject<
        {
          id: z.ZodString;
          resources: z.ZodObject<
            {
              cpu: z.ZodNumber;
              memory: z.ZodNumber;
              storage: z.ZodOptional<z.ZodNumber>;
              gpu: z.ZodOptional<z.ZodNumber>;
            },
            z.core.$strip
          >;
          preferredRegions: z.ZodOptional<z.ZodArray<z.ZodString>>;
          requiredLabels: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
          constraints: z.ZodOptional<
            z.ZodObject<
              {
                maxLatencyMs: z.ZodOptional<z.ZodNumber>;
                dataResidency: z.ZodOptional<z.ZodArray<z.ZodString>>;
                providerPreferences: z.ZodOptional<
                  z.ZodArray<
                    z.ZodEnum<{
                      aws: 'aws';
                      gcp: 'gcp';
                      azure: 'azure';
                      edge: 'edge';
                    }>
                  >
                >;
              },
              z.core.$strip
            >
          >;
        },
        z.core.$strip
      >
    >;
    enableGeoSharding: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
  },
  z.core.$strip
>;
export type EngineConfig = z.infer<typeof EngineConfigSchema>;
export type OptimizationRequest = z.infer<typeof OptimizationRequestSchema>;
export type CloudProvider = z.infer<typeof CloudProviderSchema>;
export type ResourceCapacity = z.infer<typeof ResourceCapacitySchema>;
export type Workload = z.infer<typeof WorkloadSchema>;
export type MultiCloudSchedulingRequest = z.infer<typeof MultiCloudSchedulingRequestSchema>;
//# sourceMappingURL=validation.d.ts.map
