'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.EnvCredentialsManager = void 0;
class EnvCredentialsManager {
  async initialize() {
    // No-op
  }
  async getCredential(key) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
  }
  getProviderName() {
    return 'Environment Variables';
  }
}
exports.EnvCredentialsManager = EnvCredentialsManager;
