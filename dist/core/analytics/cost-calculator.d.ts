/**
 * Cost Calculator Module
 *
 * Responsible for estimating resource costs based on usage and cloud provider pricing models.
 */
export interface CostConfig {
    currency: string;
    cpuCostPerCoreHour: number;
    memoryCostPerGBHour: number;
    storageCostPerGBMonth: number;
}
export interface ResourceUsage {
    cpuCores: number;
    memoryGB: number;
    storageGB?: number;
    durationHours: number;
}
export interface CostEstimate {
    totalCost: number;
    cpuCost: number;
    memoryCost: number;
    storageCost: number;
    currency: string;
    details: {
        cpuRate: number;
        memoryRate: number;
        storageRate: number;
    };
}
export declare const DEFAULT_COST_CONFIG: CostConfig;
export declare class CostCalculator {
    private config;
    constructor(config?: Partial<CostConfig>);
    /**
     * Calculate cost estimate for a given resource usage
     */
    calculateCost(usage: ResourceUsage): CostEstimate;
    /**
     * Update pricing configuration
     */
    updateConfig(newConfig: Partial<CostConfig>): void;
}
//# sourceMappingURL=cost-calculator.d.ts.map