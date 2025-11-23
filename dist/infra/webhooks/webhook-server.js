"use strict";
/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MutatingWebhookServer = void 0;
const express_1 = __importDefault(require("express"));
const security_policies_js_1 = require("./security-policies.js");
/**
 * Kubernetes Mutating Admission Webhook Server
 */
class MutatingWebhookServer {
    app;
    policyRegistry;
    port;
    constructor(port = 8443) {
        this.app = (0, express_1.default)();
        this.port = port;
        this.policyRegistry = new security_policies_js_1.SecurityPolicyRegistry();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(express_1.default.json());
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (_req, res) => {
            res.json({ status: 'healthy' });
        });
        // Mutating webhook endpoint
        this.app.post('/mutate', async (req, res) => {
            try {
                const admissionReview = req.body;
                const response = await this.handleMutation(admissionReview);
                res.json({
                    apiVersion: admissionReview.apiVersion,
                    kind: 'AdmissionReview',
                    response
                });
            }
            catch (error) {
                console.error('Webhook error:', error);
                res.status(500).json({
                    response: {
                        uid: req.body?.request?.uid || '',
                        allowed: false,
                        status: {
                            code: 500,
                            message: error instanceof Error ? error.message : 'Internal error'
                        }
                    }
                });
            }
        });
    }
    async handleMutation(review) {
        const request = review.request;
        const patches = [];
        const warnings = [];
        // Apply all enabled policies
        const policies = this.policyRegistry.getEnabled();
        for (const policy of policies) {
            try {
                const result = await policy.enforce(request);
                if (!result.allowed) {
                    return {
                        uid: request.uid,
                        allowed: false,
                        status: {
                            code: 403,
                            message: result.message || `Policy ${policy.name} denied the request`
                        }
                    };
                }
                if (result.patch) {
                    patches.push(...result.patch);
                }
                if (result.warnings) {
                    warnings.push(...result.warnings);
                }
            }
            catch (error) {
                console.error(`Policy ${policy.name} error:`, error);
                warnings.push(`Policy ${policy.name} failed: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const response = {
            uid: request.uid,
            allowed: true
        };
        // Add patches if any
        if (patches.length > 0) {
            const patchJson = JSON.stringify(patches);
            response.patch = Buffer.from(patchJson).toString('base64');
            response.patchType = 'JSONPatch';
        }
        // Add warnings if any
        if (warnings.length > 0) {
            response.warnings = warnings;
        }
        return response;
    }
    /**
     * Start the webhook server
     */
    start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`Mutating webhook server listening on port ${this.port}`);
                resolve();
            });
        });
    }
    /**
     * Get the Express app instance
     */
    getApp() {
        return this.app;
    }
    /**
     * Get policy registry for configuration
     */
    getPolicyRegistry() {
        return this.policyRegistry;
    }
}
exports.MutatingWebhookServer = MutatingWebhookServer;
