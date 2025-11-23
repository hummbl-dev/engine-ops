import { LLMClient, LLMClientConfig, LLMResponse } from '../client';
export declare class GeminiClient implements LLMClient {
    private config;
    constructor(config: LLMClientConfig);
    private ensureApiKey;
    getProviderName(): string;
    complete(prompt: string): Promise<LLMResponse>;
}
//# sourceMappingURL=gemini.d.ts.map