import { ICloudProvider, CloudProvider, CloudNode, Workload, GeoRegion } from './interfaces.js';
/**
 * Edge cluster provider adapter for edge computing locations
 */
export declare class EdgeProvider implements ICloudProvider {
    private config;
    private nodes;
    private regions;
    getProvider(): CloudProvider;
    initialize(config: Record<string, unknown>): Promise<void>;
    private initializeMockNodes;
    listNodes(region?: string): Promise<CloudNode[]>;
    getNode(nodeId: string): Promise<CloudNode | null>;
    deployWorkload(nodeId: string, workload: Workload): Promise<boolean>;
    removeWorkload(nodeId: string, _workloadId: string): Promise<boolean>;
    getRegions(): Promise<GeoRegion[]>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=edge-provider.d.ts.map