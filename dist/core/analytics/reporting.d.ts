/**
 * Reporting Module
 *
 * Generates automated reports for cost and usage.
 */
import { CostEstimate } from './cost-calculator.js';
import { Recommendation } from './recommendations.js';
export interface ReportConfig {
    format: 'text' | 'json' | 'html';
    includeRecommendations: boolean;
}
export declare class ReportGenerator {
    /**
     * Generate a cost report
     */
    generateReport(estimate: CostEstimate, recommendations: Recommendation[], config: ReportConfig): string;
    private renderHtmlRecommendations;
}
//# sourceMappingURL=reporting.d.ts.map