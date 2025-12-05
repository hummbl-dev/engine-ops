'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
const globals_1 = require('@jest/globals');
const security_policies_js_1 = require('../security-policies.js');
(0, globals_1.describe)('Security Policies', () => {
  (0, globals_1.describe)('NonRootContainerPolicy', () => {
    (0, globals_1.it)('should enforce runAsNonRoot for pods', async () => {
      const policy = new security_policies_js_1.NonRootContainerPolicy();
      const request = {
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
      (0, globals_1.expect)(result.allowed).toBe(true);
      (0, globals_1.expect)(result.patch).toBeDefined();
      (0, globals_1.expect)(result.patch.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('should allow pods with runAsNonRoot already set', async () => {
      const policy = new security_policies_js_1.NonRootContainerPolicy();
      const request = {
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
      (0, globals_1.expect)(result.allowed).toBe(true);
      (0, globals_1.expect)(result.patch?.length || 0).toBe(0);
    });
    (0, globals_1.it)('should skip non-pod resources', async () => {
      const policy = new security_policies_js_1.NonRootContainerPolicy();
      const request = {
        uid: 'test-123',
        kind: { group: '', version: 'v1', kind: 'Service' },
        resource: { group: '', version: 'v1', resource: 'services' },
        operation: 'CREATE',
        object: {},
      };
      const result = await policy.enforce(request);
      (0, globals_1.expect)(result.allowed).toBe(true);
      (0, globals_1.expect)(result.patch?.length || 0).toBe(0);
    });
  });
  (0, globals_1.describe)('ResourceLimitsPolicy', () => {
    (0, globals_1.it)('should add resource limits to containers', async () => {
      const policy = new security_policies_js_1.ResourceLimitsPolicy();
      const request = {
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
      (0, globals_1.expect)(result.allowed).toBe(true);
      (0, globals_1.expect)(result.patch).toBeDefined();
      (0, globals_1.expect)(result.warnings).toBeDefined();
    });
  });
  (0, globals_1.describe)('NoPrivilegedContainersPolicy', () => {
    (0, globals_1.it)('should deny privileged containers', async () => {
      const policy = new security_policies_js_1.NoPrivilegedContainersPolicy();
      const request = {
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
      (0, globals_1.expect)(result.allowed).toBe(false);
      (0, globals_1.expect)(result.message).toContain('Privileged containers are not allowed');
    });
    (0, globals_1.it)('should allow non-privileged containers', async () => {
      const policy = new security_policies_js_1.NoPrivilegedContainersPolicy();
      const request = {
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
      (0, globals_1.expect)(result.allowed).toBe(true);
    });
  });
  (0, globals_1.describe)('SecurityLabelsPolicy', () => {
    (0, globals_1.it)('should warn about missing labels', async () => {
      const policy = new security_policies_js_1.SecurityLabelsPolicy();
      const request = {
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
      (0, globals_1.expect)(result.allowed).toBe(true);
      (0, globals_1.expect)(result.warnings).toBeDefined();
    });
  });
  (0, globals_1.describe)('SecurityPolicyRegistry', () => {
    (0, globals_1.it)('should register default policies', () => {
      const registry = new security_policies_js_1.SecurityPolicyRegistry();
      const policies = registry.getAll();
      (0, globals_1.expect)(policies.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('should get enabled policies', () => {
      const registry = new security_policies_js_1.SecurityPolicyRegistry();
      const enabled = registry.getEnabled();
      (0, globals_1.expect)(enabled.length).toBeGreaterThan(0);
      enabled.forEach((p) => (0, globals_1.expect)(p.enabled).toBe(true));
    });
    (0, globals_1.it)('should register and retrieve custom policy', () => {
      const registry = new security_policies_js_1.SecurityPolicyRegistry();
      const customPolicy = new security_policies_js_1.NonRootContainerPolicy();
      customPolicy.name = 'custom-policy';
      registry.register(customPolicy);
      const retrieved = registry.get('custom-policy');
      (0, globals_1.expect)(retrieved).toBe(customPolicy);
    });
  });
});
