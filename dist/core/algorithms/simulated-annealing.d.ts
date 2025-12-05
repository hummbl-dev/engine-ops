export interface SimulatedAnnealingConfig {
  initialTemperature: number;
  coolingRate: number;
  minTemperature: number;
  maxIterations: number;
}
export interface Solution<T> {
  state: T;
  energy: number;
}
/**
 * Simulated Annealing for optimization
 */
export declare class SimulatedAnnealing<T> {
  private config;
  constructor(config?: Partial<SimulatedAnnealingConfig>);
  /**
   * Run simulated annealing
   */
  optimize(
    initialState: T,
    energyFunction: (state: T) => number,
    generateNeighbor: (state: T) => T,
  ): Solution<T>;
  private acceptanceProbability;
}
//# sourceMappingURL=simulated-annealing.d.ts.map
