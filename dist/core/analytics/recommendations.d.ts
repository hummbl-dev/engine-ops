/**
 * Recommendation Engine Module
 *
 * Generates cost-saving and performance-optimizing recommendations.
 */
import { CostCalculator, ResourceUsage } from './cost-calculator.js';
export interface Recommendation {
    id: string;
    type: 'cost' | 'performance' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    action: string;
    estimatedSavings?: number;
    resourceId?: string;
}
export declare class RecommendationEngine {
    private costCalculator;
    constructor(costCalculator: CostCalculator);
    /**
     * Analyze resource usage and generate recommendations
     */
    analyze(resourceId: string, currentUsage: ResourceUsage, utilization: {
        cpuPercent: number;
        memoryPercent: number;
    }): Recommendation[];
}
//# sourceMappingURL=recommendations.d.ts.map