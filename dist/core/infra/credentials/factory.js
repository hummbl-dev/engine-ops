'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CredentialsFactory = void 0;
const vault_1 = require('./vault');
const aws_1 = require('./aws');
const env_1 = require('./env');
class CredentialsFactory {
  static instance;
  static async getInstance() {
    if (this.instance) {
      return this.instance;
    }
    const provider = process.env.CREDENTIALS_PROVIDER || 'env';
    switch (provider) {
      case 'vault':
        if (!process.env.VAULT_ADDR || !process.env.VAULT_TOKEN) {
          throw new Error('VAULT_ADDR and VAULT_TOKEN must be set for Vault provider');
        }
        this.instance = new vault_1.VaultCredentialsManager(
          process.env.VAULT_ADDR,
          process.env.VAULT_TOKEN,
        );
        break;
      case 'aws':
        if (!process.env.AWS_REGION || !process.env.AWS_SECRET_ID) {
          throw new Error('AWS_REGION and AWS_SECRET_ID must be set for AWS provider');
        }
        this.instance = new aws_1.AWSCredentialsManager(
          process.env.AWS_REGION,
          process.env.AWS_SECRET_ID,
        );
        break;
      case 'env':
        this.instance = new env_1.EnvCredentialsManager();
        break;
      default:
        throw new Error(`Unknown credentials provider: ${provider}`);
    }
    await this.instance.initialize();
    return this.instance;
  }
}
exports.CredentialsFactory = CredentialsFactory;
