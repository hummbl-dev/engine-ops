import { CredentialsManager } from './manager';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const vault = require('node-vault');

export class VaultCredentialsManager implements CredentialsManager {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private client: any;

    constructor(endpoint: string, token: string) {
        this.client = vault({
            apiVersion: 'v1',
            endpoint: endpoint,
            token: token
        });
    }

    async initialize(): Promise<void> {
        // Verify connection
        try {
            await this.client.health();
        } catch (error) {
            throw new Error(`Failed to connect to Vault: ${error}`);
        }
    }

    async getCredential(key: string): Promise<string> {
        try {
            // Assuming secrets are stored in 'secret/data/engine-ops'
            const result = await this.client.read('secret/data/engine-ops');
            if (result.data && result.data.data && result.data.data[key]) {
                return result.data.data[key];
            }
            throw new Error(`Credential ${key} not found in Vault`);
        } catch (error) {
            console.error(`Error fetching from Vault:`, error);
            throw error;
        }
    }

    getProviderName(): string {
        return 'HashiCorp Vault';
    }
}
