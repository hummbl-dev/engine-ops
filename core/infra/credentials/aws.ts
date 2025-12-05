import { CredentialsManager } from './manager';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

export class AWSCredentialsManager implements CredentialsManager {
  private client: SecretsManagerClient;
  private secretId: string;

  constructor(region: string, secretId: string) {
    this.client = new SecretsManagerClient({ region });
    this.secretId = secretId;
  }

  async initialize(): Promise<void> {
    // AWS SDK lazy loads, so we can just verify config if needed
  }

  async getCredential(key: string): Promise<string> {
    try {
      const command = new GetSecretValueCommand({ SecretId: this.secretId });
      const response = await this.client.send(command);

      if (response.SecretString) {
        const secrets = JSON.parse(response.SecretString);
        if (secrets[key]) {
          return secrets[key];
        }
      }
      throw new Error(`Credential ${key} not found in AWS Secrets Manager`);
    } catch (error) {
      console.error(`Error fetching from AWS:`, error);
      throw error;
    }
  }

  getProviderName(): string {
    return 'AWS Secrets Manager';
  }
}
