import { OptimizationRequest, OptimizationResult } from '../interfaces.js';
import { IOptimizationPlugin, PluginMetadata, PluginConfig, WorkloadDataPoint } from './interfaces.js';
/**
 * Base abstract class for optimization plugins
 */
export declare abstract class BaseOptimizationPlugin implements IOptimizationPlugin {
    abstract readonly metadata: PluginMetadata;
    protected config?: PluginConfig;
    protected isInitialized: boolean;
    init(config?: PluginConfig): Promise<void>;
    abstract canHandle(request: OptimizationRequest): boolean;
    abstract optimize(request: OptimizationRequest, historicalData?: WorkloadDataPoint[]): Promise<OptimizationResult>;
    shutdown(): Promise<void>;
    protected checkInitialized(): void;
}
//# sourceMappingURL=base-plugin.d.ts.map