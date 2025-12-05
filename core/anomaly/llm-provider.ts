import { AnalysisProvider, AnalysisResult } from './analysis';
import { AnomalyAlert } from './detector';
import { LLMClient } from '../ai/client';
import * as fs from 'fs';
import * as path from 'path';

export class LLMAnalysisProvider implements AnalysisProvider {
  private promptTemplate: string;
  private client: LLMClient;

  constructor(client: LLMClient) {
    this.client = client;
    // Load prompt template
    const promptPath = path.join(__dirname, '../prompts/anomaly-analysis/v1.md');
    this.promptTemplate = fs.readFileSync(promptPath, 'utf-8');
  }

  async analyze(alert: AnomalyAlert, recentLogs: string[]): Promise<AnalysisResult> {
    // Construct the prompt
    const prompt = this.constructPrompt(alert, recentLogs);

    try {
      // Call the LLM client
      const response = await this.client.complete(prompt);

      // Parse the response (assuming JSON output as per prompt)
      // In a real system, we'd have robust JSON parsing/repair here
      const result = JSON.parse(response.content);

      return {
        rootCauseHypothesis: result.rootCauseHypothesis,
        remediationSuggestion: result.remediationSuggestion,
        confidenceScore: result.confidenceScore,
        relevantLogs: result.relevantLogs,
      };
    } catch (error) {
      console.error(`[AI Analysis] Error with provider ${this.client.getProviderName()}:`, error);
      // Fallback or rethrow
      return {
        rootCauseHypothesis: 'Analysis failed due to LLM error.',
        remediationSuggestion: 'Check LLM provider status.',
        confidenceScore: 0,
        relevantLogs: [],
      };
    }
  }

  private constructPrompt(alert: AnomalyAlert, logs: string[]): string {
    return this.promptTemplate
      .replace('{{METRIC_NAME}}', alert.metricName)
      .replace('{{METRIC_VALUE}}', alert.value.toString())
      .replace('{{LOGS}}', logs.join('\n'));
  }
}
