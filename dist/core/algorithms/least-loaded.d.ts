interface NodeStatus {
    id: string;
    cpuLoad: number;
    memoryLoad: number;
}
interface Task {
    id: string;
    cpuRequired: number;
    memoryRequired: number;
}
interface SchedulingResult {
    nodeId: string;
    estimatedLoadAfter: {
        cpu: number;
        memory: number;
    };
}
/**
 * Implements Least Loaded Scheduling algorithm.
 * Selects the node with the lowest current load (considering both CPU and Memory).
 */
export declare class LeastLoadedScheduler {
    schedule(task: Task, nodes: NodeStatus[]): SchedulingResult | null;
}
export {};
//# sourceMappingURL=least-loaded.d.ts.map