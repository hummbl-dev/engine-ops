export interface GeneticAlgorithmConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  elitismCount: number;
}
export interface Individual<T> {
  genes: T;
  fitness: number;
}
/**
 * Genetic Algorithm for optimization
 */
export declare class GeneticAlgorithm<T> {
  private config;
  private population;
  constructor(config?: Partial<GeneticAlgorithmConfig>);
  /**
   * Run genetic algorithm
   */
  evolve(
    initializeIndividual: () => T,
    fitnessFunction: (genes: T) => number,
    crossover: (parent1: T, parent2: T) => T,
    mutate: (genes: T) => T,
  ): Individual<T>;
  private evaluatePopulation;
  private tournamentSelection;
}
//# sourceMappingURL=genetic.d.ts.map
