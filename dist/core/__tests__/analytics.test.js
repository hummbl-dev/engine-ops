'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const globals_1 = require('@jest/globals');
const index_js_1 = require('../analytics/index.js');
(0, globals_1.describe)('Cost Calculator', () => {
  const calculator = new index_js_1.CostCalculator();
  (0, globals_1.it)('should calculate cost correctly for standard usage', () => {
    const usage = {
      cpuCores: 2,
      memoryGB: 4,
      durationHours: 24,
    };
    const estimate = calculator.calculateCost(usage);
    // CPU: 2 * 0.04 * 24 = 1.92
    // Mem: 4 * 0.005 * 24 = 0.48
    // Total: 2.40
    (0, globals_1.expect)(estimate.cpuCost).toBe(1.92);
    (0, globals_1.expect)(estimate.memoryCost).toBe(0.48);
    (0, globals_1.expect)(estimate.totalCost).toBe(2.4);
  });
  (0, globals_1.it)('should include storage cost if provided', () => {
    const usage = {
      cpuCores: 1,
      memoryGB: 1,
      storageGB: 100,
      durationHours: 730, // 1 month
    };
    const estimate = calculator.calculateCost(usage);
    // Storage: 100 * 0.10 * 1 = 10.00
    (0, globals_1.expect)(estimate.storageCost).toBe(10.0);
  });
});
(0, globals_1.describe)('Recommendation Engine', () => {
  const calculator = new index_js_1.CostCalculator();
  const engine = new index_js_1.RecommendationEngine(calculator);
  (0, globals_1.it)('should recommend downsizing CPU if utilization is low', () => {
    const usage = {
      cpuCores: 4,
      memoryGB: 8,
      durationHours: 24,
    };
    const utilization = {
      cpuPercent: 10, // Low utilization
      memoryPercent: 50,
    };
    const recommendations = engine.analyze('test-resource', usage, utilization);
    (0, globals_1.expect)(recommendations).toHaveLength(1);
    (0, globals_1.expect)(recommendations[0].type).toBe('cost');
    (0, globals_1.expect)(recommendations[0].message).toContain('CPU utilization is low');
    (0, globals_1.expect)(recommendations[0].estimatedSavings).toBeGreaterThan(0);
  });
  (0, globals_1.it)('should recommend downsizing Memory if utilization is low', () => {
    const usage = {
      cpuCores: 2,
      memoryGB: 16,
      durationHours: 24,
    };
    const utilization = {
      cpuPercent: 50,
      memoryPercent: 20, // Low utilization
    };
    const recommendations = engine.analyze('test-resource', usage, utilization);
    (0, globals_1.expect)(recommendations).toHaveLength(1);
    (0, globals_1.expect)(recommendations[0].type).toBe('cost');
    (0, globals_1.expect)(recommendations[0].message).toContain('Memory utilization is low');
  });
});
const index_js_2 = require('../analytics/index.js');
(0, globals_1.describe)('Report Generator', () => {
  const generator = new index_js_2.ReportGenerator();
  const mockEstimate = {
    totalCost: 100,
    cpuCost: 50,
    memoryCost: 40,
    storageCost: 10,
    currency: 'USD',
    details: { cpuRate: 0.1, memoryRate: 0.05, storageRate: 0.1 },
  };
  const mockRecommendations = [
    {
      id: '1',
      type: 'cost',
      severity: 'medium',
      message: 'Downsize CPU',
      action: 'Reduce cores',
      estimatedSavings: 20,
    },
  ];
  (0, globals_1.it)('should generate text report by default', () => {
    const report = generator.generateReport(mockEstimate, mockRecommendations, {
      format: 'text',
      includeRecommendations: true,
    });
    (0, globals_1.expect)(report).toContain('COST REPORT');
    (0, globals_1.expect)(report).toContain('Total Cost: USD 100');
    (0, globals_1.expect)(report).toContain('RECOMMENDATIONS');
    (0, globals_1.expect)(report).toContain('Downsize CPU');
  });
  (0, globals_1.it)('should generate JSON report', () => {
    const report = generator.generateReport(mockEstimate, mockRecommendations, {
      format: 'json',
      includeRecommendations: true,
    });
    const parsed = JSON.parse(report);
    (0, globals_1.expect)(parsed.estimate.totalCost).toBe(100);
    (0, globals_1.expect)(parsed.recommendations).toHaveLength(1);
  });
  (0, globals_1.it)('should generate HTML report', () => {
    const report = generator.generateReport(mockEstimate, mockRecommendations, {
      format: 'html',
      includeRecommendations: true,
    });
    (0, globals_1.expect)(report).toContain('<h1>Cost Report</h1>');
    (0, globals_1.expect)(report).toContain('<li>CPU: 50</li>');
  });
});
