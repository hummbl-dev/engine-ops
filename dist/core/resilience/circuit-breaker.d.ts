export declare enum CircuitState {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
}
/**
 * Circuit Breaker pattern implementation
 */
export declare class CircuitBreaker {
    private state;
    private failureCount;
    private successCount;
    private nextAttempt;
    private config;
    constructor(config?: Partial<CircuitBreakerConfig>);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    getState(): CircuitState;
}
//# sourceMappingURL=circuit-breaker.d.ts.map