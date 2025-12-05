export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
export interface LLMClientConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}
export interface LLMClient {
  /**
   * Send a prompt to the LLM and get a response
   */
  complete(prompt: string): Promise<LLMResponse>;
  /**
   * Get the provider name
   */
  getProviderName(): string;
}
//# sourceMappingURL=client.d.ts.map
