/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
export class RetryPolicy {
    private config: RetryConfig;

    constructor(config: Partial<RetryConfig> = {}) {
        this.config = {
            maxRetries: config.maxRetries ?? 3,
            initialDelay: config.initialDelay ?? 1000,
            maxDelay: config.maxDelay ?? 30000,
            backoffMultiplier: config.backoffMultiplier ?? 2,
            jitter: config.jitter ?? true
        };
    }

    async execute<T>(
        fn: () => Promise<T>,
        shouldRetry: (error: Error) => boolean = () => true
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error as Error;

                if (attempt === this.config.maxRetries || !shouldRetry(lastError)) {
                    throw lastError;
                }

                const delay = this.calculateDelay(attempt);
                await this.sleep(delay);
            }
        }

        throw lastError!;
    }

    private calculateDelay(attempt: number): number {
        let delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt);
        delay = Math.min(delay, this.config.maxDelay);

        if (this.config.jitter) {
            delay = delay * (0.5 + Math.random() * 0.5);
        }

        return delay;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
