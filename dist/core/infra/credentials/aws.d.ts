import { CredentialsManager } from './manager';
export declare class AWSCredentialsManager implements CredentialsManager {
    private client;
    private secretId;
    constructor(region: string, secretId: string);
    initialize(): Promise<void>;
    getCredential(key: string): Promise<string>;
    getProviderName(): string;
}
//# sourceMappingURL=aws.d.ts.map