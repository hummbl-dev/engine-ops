import express from 'express';
import { SecurityPolicyRegistry } from './security-policies.js';
/**
 * Kubernetes Mutating Admission Webhook Server
 */
export declare class MutatingWebhookServer {
    private app;
    private policyRegistry;
    private port;
    constructor(port?: number);
    private setupMiddleware;
    private setupRoutes;
    private handleMutation;
    /**
     * Start the webhook server
     */
    start(): Promise<void>;
    /**
     * Get the Express app instance
     */
    getApp(): express.Application;
    /**
     * Get policy registry for configuration
     */
    getPolicyRegistry(): SecurityPolicyRegistry;
}
//# sourceMappingURL=webhook-server.d.ts.map