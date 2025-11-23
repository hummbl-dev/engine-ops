export interface CredentialsManager {
    /**
     * Initialize the credentials manager
     */
    initialize(): Promise<void>;
    /**
     * Retrieve a credential by key
     * @param key The key/name of the credential
     */
    getCredential(key: string): Promise<string>;
    /**
     * Get the provider name
     */
    getProviderName(): string;
}
//# sourceMappingURL=manager.d.ts.map