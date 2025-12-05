import { ICloudProvider, CloudProvider, CloudNode, Workload, GeoRegion } from './interfaces.js';
/**
 * Azure cloud provider adapter
 */
export declare class AzureProvider implements ICloudProvider {
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
//# sourceMappingURL=azure-provider.d.ts.map
