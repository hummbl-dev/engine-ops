import { CredentialsManager } from './manager';
import { VaultCredentialsManager } from './vault';
import { AWSCredentialsManager } from './aws';
import { EnvCredentialsManager } from './env';

export class CredentialsFactory {
  private static instance: CredentialsManager;

  static async getInstance(): Promise<CredentialsManager> {
    if (this.instance) {
      return this.instance;
    }

    const provider = process.env.CREDENTIALS_PROVIDER || 'env';

    switch (provider) {
      case 'vault':
        if (!process.env.VAULT_ADDR || !process.env.VAULT_TOKEN) {
          throw new Error('VAULT_ADDR and VAULT_TOKEN must be set for Vault provider');
        }
        this.instance = new VaultCredentialsManager(
          process.env.VAULT_ADDR,
          process.env.VAULT_TOKEN,
        );
        break;
      case 'aws':
        if (!process.env.AWS_REGION || !process.env.AWS_SECRET_ID) {
          throw new Error('AWS_REGION and AWS_SECRET_ID must be set for AWS provider');
        }
        this.instance = new AWSCredentialsManager(
          process.env.AWS_REGION,
          process.env.AWS_SECRET_ID,
        );
        break;
      case 'env':
        this.instance = new EnvCredentialsManager();
        break;
      default:
        throw new Error(`Unknown credentials provider: ${provider}`);
    }

    await this.instance.initialize();
    return this.instance;
  }
}
