import { describe, it, expect } from '@jest/globals';
import { CostCalculator, RecommendationEngine } from '../analytics/index.js';

describe('Cost Calculator', () => {
    const calculator = new CostCalculator();

    it('should calculate cost correctly for standard usage', () => {
        const usage = {
            cpuCores: 2,
            memoryGB: 4,
            durationHours: 24
        };

        const estimate = calculator.calculateCost(usage);

        // CPU: 2 * 0.04 * 24 = 1.92
        // Mem: 4 * 0.005 * 24 = 0.48
        // Total: 2.40
        expect(estimate.cpuCost).toBe(1.92);
        expect(estimate.memoryCost).toBe(0.48);
        expect(estimate.totalCost).toBe(2.40);
    });

    it('should include storage cost if provided', () => {
        const usage = {
            cpuCores: 1,
            memoryGB: 1,
            storageGB: 100,
            durationHours: 730 // 1 month
        };

        const estimate = calculator.calculateCost(usage);

        // Storage: 100 * 0.10 * 1 = 10.00
        expect(estimate.storageCost).toBe(10.00);
    });
});

describe('Recommendation Engine', () => {
    const calculator = new CostCalculator();
    const engine = new RecommendationEngine(calculator);

    it('should recommend downsizing CPU if utilization is low', () => {
        const usage = {
            cpuCores: 4,
            memoryGB: 8,
            durationHours: 24
        };
        const utilization = {
            cpuPercent: 10, // Low utilization
            memoryPercent: 50
        };

        const recommendations = engine.analyze('test-resource', usage, utilization);

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].type).toBe('cost');
        expect(recommendations[0].message).toContain('CPU utilization is low');
        expect(recommendations[0].estimatedSavings).toBeGreaterThan(0);
    });

    it('should recommend downsizing Memory if utilization is low', () => {
        const usage = {
            cpuCores: 2,
            memoryGB: 16,
            durationHours: 24
        };
        const utilization = {
            cpuPercent: 50,
            memoryPercent: 20 // Low utilization
        };

        const recommendations = engine.analyze('test-resource', usage, utilization);

        expect(recommendations).toHaveLength(1);
        expect(recommendations[0].type).toBe('cost');
        expect(recommendations[0].message).toContain('Memory utilization is low');
    });
});

import { ReportGenerator } from '../analytics/index.js';

describe('Report Generator', () => {
    const generator = new ReportGenerator();
    const mockEstimate = {
        totalCost: 100,
        cpuCost: 50,
        memoryCost: 40,
        storageCost: 10,
        currency: 'USD',
        details: { cpuRate: 0.1, memoryRate: 0.05, storageRate: 0.1 }
    };
    const mockRecommendations = [
        {
            id: '1',
            type: 'cost' as const,
            severity: 'medium' as const,
            message: 'Downsize CPU',
            action: 'Reduce cores',
            estimatedSavings: 20
        }
    ];

    it('should generate text report by default', () => {
        const report = generator.generateReport(mockEstimate, mockRecommendations, { format: 'text', includeRecommendations: true });
        expect(report).toContain('COST REPORT');
        expect(report).toContain('Total Cost: USD 100');
        expect(report).toContain('RECOMMENDATIONS');
        expect(report).toContain('Downsize CPU');
    });

    it('should generate JSON report', () => {
        const report = generator.generateReport(mockEstimate, mockRecommendations, { format: 'json', includeRecommendations: true });
        const parsed = JSON.parse(report);
        expect(parsed.estimate.totalCost).toBe(100);
        expect(parsed.recommendations).toHaveLength(1);
    });

    it('should generate HTML report', () => {
        const report = generator.generateReport(mockEstimate, mockRecommendations, { format: 'html', includeRecommendations: true });
        expect(report).toContain('<h1>Cost Report</h1>');
        expect(report).toContain('<li>CPU: 50</li>');
    });
});
