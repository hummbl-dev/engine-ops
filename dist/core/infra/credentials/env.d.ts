import { CredentialsManager } from './manager';
export declare class EnvCredentialsManager implements CredentialsManager {
  initialize(): Promise<void>;
  getCredential(key: string): Promise<string>;
  getProviderName(): string;
}
//# sourceMappingURL=env.d.ts.map
