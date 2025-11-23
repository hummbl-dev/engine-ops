import { AnalysisProvider, AnalysisResult } from './analysis';
import { AnomalyAlert } from './detector';
import { LLMClient } from '../ai/client';
export declare class LLMAnalysisProvider implements AnalysisProvider {
    private promptTemplate;
    private client;
    constructor(client: LLMClient);
    analyze(alert: AnomalyAlert, recentLogs: string[]): Promise<AnalysisResult>;
    private constructPrompt;
}
//# sourceMappingURL=llm-provider.d.ts.map