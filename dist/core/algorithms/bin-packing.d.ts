interface ResourceItem {
  id: string;
  cpu: number;
  memory: number;
}
interface Node {
  id: string;
  cpuAvailable: number;
  memoryAvailable: number;
  items: ResourceItem[];
}
interface BinPackingResult {
  nodes: Node[];
  unplacedItems: ResourceItem[];
}
/**
 * Implements First Fit Decreasing (FFD) bin packing algorithm.
 * Sorts items by size (CPU + Memory) descending, then places each in the first node that fits.
 */
export declare class BinPackingOptimizer {
  optimize(
    items: ResourceItem[],
    nodeCapacity: {
      cpu: number;
      memory: number;
    },
  ): BinPackingResult;
}
export {};
//# sourceMappingURL=bin-packing.d.ts.map
