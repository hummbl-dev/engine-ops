import { AnalysisProvider, AnalysisResult } from './analysis';
import { AnomalyAlert } from './detector';
import * as fs from 'fs';
import * as path from 'path';

export class LLMAnalysisProvider implements AnalysisProvider {
    private promptTemplate: string;

    constructor() {
        // Load prompt template
        const promptPath = path.join(__dirname, '../prompts/anomaly-analysis/v1.md');
        this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
    }

    async analyze(alert: AnomalyAlert, recentLogs: string[]): Promise<AnalysisResult> {
        // In a real implementation, this would call an LLM service (OpenAI/Anthropic)
        // For now, we'll simulate a response based on the alert type

        // Construct the prompt (demonstration of variable substitution)
        const _prompt = this.constructPrompt(alert, recentLogs);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock logic for demonstration
        if (alert.metricName.includes('cpu')) {
            return {
                rootCauseHypothesis: "High CPU usage likely caused by infinite loop in worker process.",
                remediationSuggestion: "Restart the worker pod and check for recent code changes in the calculation module.",
                confidenceScore: 0.85,
                relevantLogs: recentLogs.filter(l => l.includes('error') || l.includes('loop'))
            };
        }

        return {
            rootCauseHypothesis: `Anomaly in ${alert.metricName} detected but root cause is ambiguous from logs.`,
            remediationSuggestion: "Check upstream service health and database latency.",
            confidenceScore: 0.6,
            relevantLogs: []
        };
    }

    private constructPrompt(alert: AnomalyAlert, logs: string[]): string {
        return this.promptTemplate
            .replace('{{METRIC_NAME}}', alert.metricName)
            .replace('{{METRIC_VALUE}}', alert.value.toString())
            .replace('{{LOGS}}', logs.join('\n'));
    }
}
