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

import { describe, it, expect } from '@jest/globals';
import {
  NonRootContainerPolicy,
  ResourceLimitsPolicy,
  NoPrivilegedContainersPolicy,
  SecurityLabelsPolicy,
  SecurityPolicyRegistry,
} from '../security-policies.js';
import { AdmissionRequest } from '../admission-webhook.js';

describe('Security Policies', () => {
  describe('NonRootContainerPolicy', () => {
    it('should enforce runAsNonRoot for pods', async () => {
      const policy = new NonRootContainerPolicy();
      const request: AdmissionRequest = {
        uid: 'test-123',
        kind: { group: '', version: 'v1', kind: 'Pod' },
        resource: { group: '', version: 'v1', resource: 'pods' },
        operation: 'CREATE',
        object: {
          spec: {
            containers: [{ name: 'test', image: 'nginx' }],
          },
        },
      };

      const result = await policy.enforce(request);

      expect(result.allowed).toBe(true);
      expect(result.patch).toBeDefined();
      expect(result.patch!.length).toBeGreaterThan(0);
    });

    it('should allow pods with runAsNonRoot already set', async () => {
      const policy = new NonRootContainerPolicy();
      const request: AdmissionRequest = {
        uid: 'test-123',
        kind: { group: '', version: 'v1', kind: 'Pod' },
        resource: { group: '', version: 'v1', resource: 'pods' },
        operation: 'CREATE',
        object: {
          spec: {
            securityContext: { runAsNonRoot: true },
            containers: [
              {
                name: 'test',
                image: 'nginx',
                securityContext: { runAsNonRoot: true },
              },
            ],
          },
        },
      };

      const result = await policy.enforce(request);

      expect(result.allowed).toBe(true);
      expect(result.patch?.length || 0).toBe(0);
    });

    it('should skip non-pod resources', async () => {
      const policy = new NonRootContainerPolicy();
      const request: AdmissionRequest = {
        uid: 'test-123',
        kind: { group: '', version: 'v1', kind: 'Service' },
        resource: { group: '', version: 'v1', resource: 'services' },
        operation: 'CREATE',
        object: {},
      };

      const result = await policy.enforce(request);

      expect(result.allowed).toBe(true);
      expect(result.patch?.length || 0).toBe(0);
    });
  });

  describe('ResourceLimitsPolicy', () => {
    it('should add resource limits to containers', async () => {
      const policy = new ResourceLimitsPolicy();
      const request: AdmissionRequest = {
        uid: 'test-123',
        kind: { group: '', version: 'v1', kind: 'Pod' },
        resource: { group: '', version: 'v1', resource: 'pods' },
        operation: 'CREATE',
        object: {
          spec: {
            containers: [{ name: 'test', image: 'nginx' }],
          },
        },
      };

      const result = await policy.enforce(request);

      expect(result.allowed).toBe(true);
      expect(result.patch).toBeDefined();
      expect(result.warnings).toBeDefined();
    });
  });

  describe('NoPrivilegedContainersPolicy', () => {
    it('should deny privileged containers', async () => {
      const policy = new NoPrivilegedContainersPolicy();
      const request: AdmissionRequest = {
        uid: 'test-123',
        kind: { group: '', version: 'v1', kind: 'Pod' },
        resource: { group: '', version: 'v1', resource: 'pods' },
        operation: 'CREATE',
        object: {
          spec: {
            containers: [
              {
                name: 'test',
                image: 'nginx',
                securityContext: { privileged: true },
              },
            ],
          },
        },
      };

      const result = await policy.enforce(request);

      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Privileged containers are not allowed');
    });

    it('should allow non-privileged containers', async () => {
      const policy = new NoPrivilegedContainersPolicy();
      const request: AdmissionRequest = {
        uid: 'test-123',
        kind: { group: '', version: 'v1', kind: 'Pod' },
        resource: { group: '', version: 'v1', resource: 'pods' },
        operation: 'CREATE',
        object: {
          spec: {
            containers: [{ name: 'test', image: 'nginx' }],
          },
        },
      };

      const result = await policy.enforce(request);

      expect(result.allowed).toBe(true);
    });
  });

  describe('SecurityLabelsPolicy', () => {
    it('should warn about missing labels', async () => {
      const policy = new SecurityLabelsPolicy();
      const request: AdmissionRequest = {
        uid: 'test-123',
        kind: { group: '', version: 'v1', kind: 'Pod' },
        resource: { group: '', version: 'v1', resource: 'pods' },
        operation: 'CREATE',
        object: {
          metadata: {
            name: 'test-pod',
          },
        },
      };

      const result = await policy.enforce(request);

      expect(result.allowed).toBe(true);
      expect(result.warnings).toBeDefined();
    });
  });

  describe('SecurityPolicyRegistry', () => {
    it('should register default policies', () => {
      const registry = new SecurityPolicyRegistry();
      const policies = registry.getAll();

      expect(policies.length).toBeGreaterThan(0);
    });

    it('should get enabled policies', () => {
      const registry = new SecurityPolicyRegistry();
      const enabled = registry.getEnabled();

      expect(enabled.length).toBeGreaterThan(0);
      enabled.forEach((p) => expect(p.enabled).toBe(true));
    });

    it('should register and retrieve custom policy', () => {
      const registry = new SecurityPolicyRegistry();
      const customPolicy = new NonRootContainerPolicy();
      customPolicy.name = 'custom-policy';

      registry.register(customPolicy);
      const retrieved = registry.get('custom-policy');

      expect(retrieved).toBe(customPolicy);
    });
  });
});
