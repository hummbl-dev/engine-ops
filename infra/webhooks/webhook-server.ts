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

import express, { Request, Response } from 'express';
import { AdmissionReview, AdmissionResponse, PatchOperation } from './admission-webhook.js';
import { SecurityPolicyRegistry } from './security-policies.js';

/**
 * Kubernetes Mutating Admission Webhook Server
 */
export class MutatingWebhookServer {
  private app: express.Application;
  private policyRegistry: SecurityPolicyRegistry;
  private port: number;

  constructor(port: number = 8443) {
    this.app = express();
    this.port = port;
    this.policyRegistry = new SecurityPolicyRegistry();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ status: 'healthy' });
    });

    // Mutating webhook endpoint
    this.app.post('/mutate', async (req: Request, res: Response) => {
      try {
        const admissionReview: AdmissionReview = req.body;
        const response = await this.handleMutation(admissionReview);

        res.json({
          apiVersion: admissionReview.apiVersion,
          kind: 'AdmissionReview',
          response,
        });
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({
          response: {
            uid: req.body?.request?.uid || '',
            allowed: false,
            status: {
              code: 500,
              message: error instanceof Error ? error.message : 'Internal error',
            },
          },
        });
      }
    });
  }

  private async handleMutation(review: AdmissionReview): Promise<AdmissionResponse> {
    const request = review.request;
    const patches: PatchOperation[] = [];
    const warnings: string[] = [];

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
              message: result.message || `Policy ${policy.name} denied the request`,
            },
          };
        }

        if (result.patch) {
          patches.push(...result.patch);
        }

        if (result.warnings) {
          warnings.push(...result.warnings);
        }
      } catch (error) {
        console.error(`Policy ${policy.name} error:`, error);
        warnings.push(
          `Policy ${policy.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const response: AdmissionResponse = {
      uid: request.uid,
      allowed: true,
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
  start(): Promise<void> {
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
  getApp(): express.Application {
    return this.app;
  }

  /**
   * Get policy registry for configuration
   */
  getPolicyRegistry(): SecurityPolicyRegistry {
    return this.policyRegistry;
  }
}
