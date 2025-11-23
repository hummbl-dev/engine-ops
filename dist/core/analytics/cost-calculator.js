"use strict";
/**
 * Cost Calculator Module
 *
 * Responsible for estimating resource costs based on usage and cloud provider pricing models.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostCalculator = exports.DEFAULT_COST_CONFIG = void 0;
exports.DEFAULT_COST_CONFIG = {
    currency: 'USD',
    cpuCostPerCoreHour: 0.04, // Generic cloud provider average
    memoryCostPerGBHour: 0.005, // Generic cloud provider average
    storageCostPerGBMonth: 0.10 // Generic cloud provider average
};
class CostCalculator {
    config;
    constructor(config = {}) {
        this.config = { ...exports.DEFAULT_COST_CONFIG, ...config };
    }
    /**
     * Calculate cost estimate for a given resource usage
     */
    calculateCost(usage) {
        const cpuCost = usage.cpuCores * this.config.cpuCostPerCoreHour * usage.durationHours;
        const memoryCost = usage.memoryGB * this.config.memoryCostPerGBHour * usage.durationHours;
        // Storage is usually billed monthly, so we normalize to hourly for the duration if needed,
        // or just calculate based on the month fraction. 
        // Here we assume the durationHours is the active time.
        // For storage, we'll treat it as allocated for the duration.
        const storageHours = usage.durationHours;
        const storageMonthFraction = storageHours / 730; // ~730 hours in a month
        const storageCost = (usage.storageGB || 0) * this.config.storageCostPerGBMonth * storageMonthFraction;
        return {
            totalCost: parseFloat((cpuCost + memoryCost + storageCost).toFixed(4)),
            cpuCost: parseFloat(cpuCost.toFixed(4)),
            memoryCost: parseFloat(memoryCost.toFixed(4)),
            storageCost: parseFloat(storageCost.toFixed(4)),
            currency: this.config.currency,
            details: {
                cpuRate: this.config.cpuCostPerCoreHour,
                memoryRate: this.config.memoryCostPerGBHour,
                storageRate: this.config.storageCostPerGBMonth
            }
        };
    }
    /**
     * Update pricing configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
exports.CostCalculator = CostCalculator;
