import { IResourceManager, ICloudProvider, CloudProvider, CloudNode, Workload, PlacementResult, ResourceCapacity } from './interfaces.js';
/**
 * Multi-cloud resource manager with geo-sharding and federated scheduling
 */
export declare class MultiCloudResourceManager implements IResourceManager {
    private providers;
    registerProvider(provider: ICloudProvider): void;
    getProviders(): ICloudProvider[];
    listAllNodes(filters?: {
        provider?: CloudProvider;
        region?: string;
    }): Promise<CloudNode[]>;
    scheduleWorkload(workload: Workload): Promise<PlacementResult | null>;
    scheduleWorkloadsWithGeoSharding(workloads: Workload[]): Promise<PlacementResult[]>;
    getUtilization(): Promise<Record<CloudProvider, {
        total: ResourceCapacity;
        used: ResourceCapacity;
    }>>;
    /**
     * Filter nodes based on workload constraints
     */
    private filterNodesByConstraints;
    /**
     * Score nodes for workload placement
     */
    private scoreNodes;
    /**
     * Group workloads by geographical region for geo-sharding
     */
    private groupWorkloadsByGeo;
}
//# sourceMappingURL=resource-manager.d.ts.map