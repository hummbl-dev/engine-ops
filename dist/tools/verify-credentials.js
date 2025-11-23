"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const factory_1 = require("../core/infra/credentials/factory");
async function main() {
    console.log('🔐 Verifying Credentials Management...');
    try {
        // 1. Initialize Factory
        console.log('Initializing CredentialsFactory...');
        const credentials = await factory_1.CredentialsFactory.getInstance();
        console.log(`Provider: ${credentials.getProviderName()}`);
        // 2. Attempt to fetch a secret
        // In 'env' mode (default), this will look for TEST_CREDENTIAL env var
        // We'll set it before running
        console.log('Fetching TEST_CREDENTIAL...');
        try {
            const secret = await credentials.getCredential('TEST_CREDENTIAL');
            console.log(`✅ Success! Credential length: ${secret.length}`);
        }
        catch {
            console.log('⚠️  Could not fetch TEST_CREDENTIAL (expected if env var not set)');
        }
    }
    catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main();
}
