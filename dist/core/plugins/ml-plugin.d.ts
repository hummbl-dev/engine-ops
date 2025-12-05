import { OptimizationRequest, OptimizationResult } from '../interfaces.js';
import { BaseOptimizationPlugin } from './base-plugin.js';
import { PluginMetadata, WorkloadDataPoint, IMLModel } from './interfaces.js';
/**
 * ML-driven optimization plugin
 */
export declare class MLOptimizationPlugin extends BaseOptimizationPlugin {
  readonly metadata: PluginMetadata;
  private model?;
  /**
   * Set ML model
   */
  setModel(model: IMLModel): void;
  canHandle(request: OptimizationRequest): boolean;
  optimize(
    request: OptimizationRequest,
    historicalData?: WorkloadDataPoint[],
  ): Promise<OptimizationResult>;
  private calculateScore;
}
//# sourceMappingURL=ml-plugin.d.ts.map
