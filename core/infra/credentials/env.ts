import { CredentialsManager } from './manager';

export class EnvCredentialsManager implements CredentialsManager {
    async initialize(): Promise<void> {
        // No-op
    }

    async getCredential(key: string): Promise<string> {
        const value = process.env[key];
        if (!value) {
            throw new Error(`Environment variable ${key} is not set`);
        }
        return value;
    }

    getProviderName(): string {
        return 'Environment Variables';
    }
}
