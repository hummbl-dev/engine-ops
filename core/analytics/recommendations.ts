/**
 * Recommendation Engine Module
 * 
 * Generates cost-saving and performance-optimizing recommendations.
 */

import { CostCalculator, ResourceUsage, CostEstimate } from './cost-calculator.js';

export interface Recommendation {
    id: string;
    type: 'cost' | 'performance' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    action: string;
    estimatedSavings?: number;
    resourceId?: string;
}

export class RecommendationEngine {
    private costCalculator: CostCalculator;

    constructor(costCalculator: CostCalculator) {
        this.costCalculator = costCalculator;
    }

    /**
     * Analyze resource usage and generate recommendations
     */
    public analyze(resourceId: string, currentUsage: ResourceUsage, utilization: { cpuPercent: number; memoryPercent: number }): Recommendation[] {
        const recommendations: Recommendation[] = [];
        const currentCost = this.costCalculator.calculateCost(currentUsage);

        // Check for over-provisioned CPU
        if (utilization.cpuPercent < 20) {
            const optimizedCpu = Math.max(0.1, currentUsage.cpuCores * 0.5); // Downsize by 50%
            const optimizedUsage = { ...currentUsage, cpuCores: optimizedCpu };
            const optimizedCost = this.costCalculator.calculateCost(optimizedUsage);
            const savings = currentCost.totalCost - optimizedCost.totalCost;

            recommendations.push({
                id: `rec-cpu-${Date.now()}`,
                type: 'cost',
                severity: 'medium',
                message: `CPU utilization is low (${utilization.cpuPercent}%). Consider downsizing.`,
                action: `Reduce CPU from ${currentUsage.cpuCores} to ${optimizedCpu.toFixed(1)} cores`,
                estimatedSavings: parseFloat(savings.toFixed(4)),
                resourceId
            });
        }

        // Check for over-provisioned Memory
        if (utilization.memoryPercent < 30) {
            const optimizedMem = Math.max(0.128, currentUsage.memoryGB * 0.6); // Downsize by 40%
            const optimizedUsage = { ...currentUsage, memoryGB: optimizedMem };
            const optimizedCost = this.costCalculator.calculateCost(optimizedUsage);
            const savings = currentCost.totalCost - optimizedCost.totalCost;

            recommendations.push({
                id: `rec-mem-${Date.now()}`,
                type: 'cost',
                severity: 'low',
                message: `Memory utilization is low (${utilization.memoryPercent}%). Consider downsizing.`,
                action: `Reduce Memory from ${currentUsage.memoryGB}GB to ${optimizedMem.toFixed(1)}GB`,
                estimatedSavings: parseFloat(savings.toFixed(4)),
                resourceId
            });
        }

        return recommendations;
    }
}
