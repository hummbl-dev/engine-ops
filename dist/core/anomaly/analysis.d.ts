import { AnomalyAlert } from './detector';
export interface AnalysisResult {
    rootCauseHypothesis: string;
    remediationSuggestion: string;
    confidenceScore: number;
    relevantLogs: string[];
}
export interface AnalysisProvider {
    /**
     * Analyze an anomaly alert to determine root cause
     */
    analyze(alert: AnomalyAlert, recentLogs: string[]): Promise<AnalysisResult>;
}
//# sourceMappingURL=analysis.d.ts.map