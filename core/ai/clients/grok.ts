import { LLMClient, LLMClientConfig, LLMResponse } from '../client';
import { CredentialsFactory } from '../../infra/credentials/factory';

export class GrokClient implements LLMClient {
    private config: LLMClientConfig;

    constructor(config: LLMClientConfig) {
        this.config = config;
    }

    private async ensureApiKey(): Promise<string> {
        if (this.config.apiKey && this.config.apiKey !== 'mock-key') {
            return this.config.apiKey;
        }
        const credentials = await CredentialsFactory.getInstance();
        return credentials.getCredential('GROK_API_KEY');
    }

    getProviderName(): string {
        return 'Grok';
    }

    async complete(prompt: string): Promise<LLMResponse> {
        // Ensure we have a key
        try {
            await this.ensureApiKey();
        } catch {
            console.warn('[Grok] Could not retrieve API key from credentials manager, using config/mock.');
        }

        // Grok uses OpenAI-compatible API
        // const response = await fetch('https://api.x.ai/v1/chat/completions', { ... });

        // Mock implementation for now
        console.log(`[Grok] Generating response for model ${this.config.model}...`);
        await new Promise(resolve => setTimeout(resolve, 500));

        if (prompt.includes('summarize') || prompt.includes('summary')) {
            return {
                content: JSON.stringify({
                    summary: "Grok Summary: System stability compromised by memory pressure.",
                    errorCount: 5,
                    uniqueErrors: ["OOM Killed", "GC Thrashing"],
                    keyEvents: ["Pod Startup", "CrashLoopBackOff"],
                    actionItems: ["Increase memory limit", "Profile heap"]
                }),
                usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
            };
        }

        return {
            content: JSON.stringify({
                rootCauseHypothesis: "Grok Analysis: Memory leak in event listener.",
                remediationSuggestion: "Check for unclosed listeners in connection pool.",
                confidenceScore: 0.88,
                relevantLogs: ["[WARN] Max listeners exceeded"]
            }),
            usage: {
                promptTokens: prompt.length / 4,
                completionTokens: 100,
                totalTokens: (prompt.length / 4) + 100
            }
        };
    }
}
