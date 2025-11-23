export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
}
/**
 * Retry logic with exponential backoff and jitter
 */
export declare class RetryPolicy {
    private config;
    constructor(config?: Partial<RetryConfig>);
    execute<T>(fn: () => Promise<T>, shouldRetry?: (error: Error) => boolean): Promise<T>;
    private calculateDelay;
    private sleep;
}
//# sourceMappingURL=retry.d.ts.map