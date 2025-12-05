'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AWSCredentialsManager = void 0;
const client_secrets_manager_1 = require('@aws-sdk/client-secrets-manager');
class AWSCredentialsManager {
  client;
  secretId;
  constructor(region, secretId) {
    this.client = new client_secrets_manager_1.SecretsManagerClient({ region });
    this.secretId = secretId;
  }
  async initialize() {
    // AWS SDK lazy loads, so we can just verify config if needed
  }
  async getCredential(key) {
    try {
      const command = new client_secrets_manager_1.GetSecretValueCommand({
        SecretId: this.secretId,
      });
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
  getProviderName() {
    return 'AWS Secrets Manager';
  }
}
exports.AWSCredentialsManager = AWSCredentialsManager;
