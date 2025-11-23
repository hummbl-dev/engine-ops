import { LLMClient, LLMClientConfig, LLMResponse } from '../client';
export declare class GrokClient implements LLMClient {
    private config;
    constructor(config: LLMClientConfig);
    private ensureApiKey;
    getProviderName(): string;
    complete(prompt: string): Promise<LLMResponse>;
}
//# sourceMappingURL=grok.d.ts.map