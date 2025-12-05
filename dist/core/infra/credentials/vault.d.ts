import { CredentialsManager } from './manager';
export declare class VaultCredentialsManager implements CredentialsManager {
  private client;
  constructor(endpoint: string, token: string);
  initialize(): Promise<void>;
  getCredential(key: string): Promise<string>;
  getProviderName(): string;
}
//# sourceMappingURL=vault.d.ts.map
