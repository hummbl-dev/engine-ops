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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityPolicyRegistry = exports.SecurityLabelsPolicy = exports.NoPrivilegedContainersPolicy = exports.ResourceLimitsPolicy = exports.NonRootContainerPolicy = void 0;
/**
 * Policy: Enforce non-root containers
 */
class NonRootContainerPolicy {
    name = 'non-root-containers';
    enabled = true;
    async enforce(request) {
        if (request.kind.kind !== 'Pod') {
            return { allowed: true };
        }
        const pod = request.object;
        const patches = [];
        const warnings = [];
        // Check if securityContext is set for pod
        if (!pod.spec.securityContext) {
            patches.push({
                op: 'add',
                path: '/spec/securityContext',
                value: { runAsNonRoot: true }
            });
            warnings.push('Added runAsNonRoot security context to pod');
        }
        else if (!pod.spec.securityContext.runAsNonRoot) {
            patches.push({
                op: 'add',
                path: '/spec/securityContext/runAsNonRoot',
                value: true
            });
            warnings.push('Enforced runAsNonRoot security context');
        }
        // Check containers
        if (pod.spec.containers) {
            pod.spec.containers.forEach((container, index) => {
                if (!container.securityContext?.runAsNonRoot) {
                    if (!container.securityContext) {
                        patches.push({
                            op: 'add',
                            path: `/spec/containers/${index}/securityContext`,
                            value: { runAsNonRoot: true }
                        });
                    }
                    else {
                        patches.push({
                            op: 'add',
                            path: `/spec/containers/${index}/securityContext/runAsNonRoot`,
                            value: true
                        });
                    }
                    warnings.push(`Enforced runAsNonRoot for container ${container.name}`);
                }
            });
        }
        return {
            allowed: true,
            patch: patches,
            warnings
        };
    }
}
exports.NonRootContainerPolicy = NonRootContainerPolicy;
/**
 * Policy: Enforce resource limits
 */
class ResourceLimitsPolicy {
    name = 'resource-limits';
    enabled = true;
    defaultLimits;
    constructor(defaultLimits) {
        this.defaultLimits = defaultLimits || {
            cpu: process.env.DEFAULT_CPU_LIMIT || '500m',
            memory: process.env.DEFAULT_MEMORY_LIMIT || '512Mi'
        };
    }
    async enforce(request) {
        if (request.kind.kind !== 'Pod') {
            return { allowed: true };
        }
        const pod = request.object;
        const patches = [];
        const warnings = [];
        if (pod.spec.containers) {
            pod.spec.containers.forEach((container, index) => {
                if (!container.resources?.limits) {
                    const defaultLimits = this.defaultLimits;
                    if (!container.resources) {
                        patches.push({
                            op: 'add',
                            path: `/spec/containers/${index}/resources`,
                            value: { limits: defaultLimits, requests: defaultLimits }
                        });
                    }
                    else {
                        patches.push({
                            op: 'add',
                            path: `/spec/containers/${index}/resources/limits`,
                            value: defaultLimits
                        });
                    }
                    warnings.push(`Added default resource limits to container ${container.name}`);
                }
            });
        }
        return {
            allowed: true,
            patch: patches,
            warnings
        };
    }
}
exports.ResourceLimitsPolicy = ResourceLimitsPolicy;
/**
 * Policy: Deny privileged containers
 */
class NoPrivilegedContainersPolicy {
    name = 'no-privileged-containers';
    enabled = true;
    async enforce(request) {
        if (request.kind.kind !== 'Pod') {
            return { allowed: true };
        }
        const pod = request.object;
        if (pod.spec.containers) {
            for (const container of pod.spec.containers) {
                if (container.securityContext?.privileged === true) {
                    return {
                        allowed: false,
                        message: `Privileged containers are not allowed: ${container.name}`
                    };
                }
            }
        }
        return { allowed: true };
    }
}
exports.NoPrivilegedContainersPolicy = NoPrivilegedContainersPolicy;
/**
 * Policy: Enforce security labels
 */
class SecurityLabelsPolicy {
    name = 'security-labels';
    enabled = true;
    requiredLabels = ['app', 'version', 'environment'];
    async enforce(request) {
        const obj = request.object;
        const patches = [];
        const warnings = [];
        if (!obj.metadata) {
            return { allowed: true };
        }
        if (!obj.metadata.labels) {
            patches.push({
                op: 'add',
                path: '/metadata/labels',
                value: {}
            });
        }
        const labels = obj.metadata.labels || {};
        const missingLabels = this.requiredLabels.filter(label => !labels[label]);
        if (missingLabels.length > 0) {
            warnings.push(`Missing required security labels: ${missingLabels.join(', ')}`);
        }
        return {
            allowed: true,
            patch: patches,
            warnings
        };
    }
}
exports.SecurityLabelsPolicy = SecurityLabelsPolicy;
/**
 * Policy registry
 */
class SecurityPolicyRegistry {
    policies = new Map();
    constructor() {
        this.registerDefaultPolicies();
    }
    registerDefaultPolicies() {
        this.register(new NonRootContainerPolicy());
        this.register(new ResourceLimitsPolicy());
        this.register(new NoPrivilegedContainersPolicy());
        this.register(new SecurityLabelsPolicy());
    }
    register(policy) {
        this.policies.set(policy.name, policy);
    }
    get(name) {
        return this.policies.get(name);
    }
    getAll() {
        return Array.from(this.policies.values());
    }
    getEnabled() {
        return this.getAll().filter(p => p.enabled);
    }
}
exports.SecurityPolicyRegistry = SecurityPolicyRegistry;
