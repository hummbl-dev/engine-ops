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

import { SecurityPolicy, AdmissionRequest, PolicyResult, PatchOperation } from './admission-webhook.js';
import { KubernetesObject } from './kubernetes-types.js';

/**
 * Minimal Pod types for security policy enforcement
 */
interface PodSecurityContext {
    runAsNonRoot?: boolean;
}

interface ContainerSecurityContext {
    runAsNonRoot?: boolean;
    privileged?: boolean;
}

interface ResourceRequirements {
    limits?: Record<string, string>;
    requests?: Record<string, string>;
}

interface Container {
    name: string;
    securityContext?: ContainerSecurityContext;
    resources?: ResourceRequirements;
}

interface PodSpec {
    containers: Container[];
    securityContext?: PodSecurityContext;
}

interface Pod {
    spec: PodSpec;
}

/**
 * Policy: Enforce non-root containers
 */
export class NonRootContainerPolicy implements SecurityPolicy {
    name = 'non-root-containers';
    enabled = true;

    async enforce(request: AdmissionRequest): Promise<PolicyResult> {
        if (request.kind.kind !== 'Pod') {
            return { allowed: true };
        }

        const pod = request.object as Pod;
        const patches: PatchOperation[] = [];
        const warnings: string[] = [];

        // Check if securityContext is set for pod
        if (!pod.spec.securityContext) {
            patches.push({
                op: 'add',
                path: '/spec/securityContext',
                value: { runAsNonRoot: true }
            });
            warnings.push('Added runAsNonRoot security context to pod');
        } else if (!pod.spec.securityContext.runAsNonRoot) {
            patches.push({
                op: 'add',
                path: '/spec/securityContext/runAsNonRoot',
                value: true
            });
            warnings.push('Enforced runAsNonRoot security context');
        }

        // Check containers
        if (pod.spec.containers) {
            pod.spec.containers.forEach((container: Container, index: number) => {
                if (!container.securityContext?.runAsNonRoot) {
                    if (!container.securityContext) {
                        patches.push({
                            op: 'add',
                            path: `/spec/containers/${index}/securityContext`,
                            value: { runAsNonRoot: true }
                        });
                    } else {
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

/**
 * Policy: Enforce resource limits
 */
export class ResourceLimitsPolicy implements SecurityPolicy {
    name = 'resource-limits';
    enabled = true;
    private defaultLimits: { cpu: string; memory: string };

    constructor(defaultLimits?: { cpu: string; memory: string }) {
        this.defaultLimits = defaultLimits || {
            cpu: process.env.DEFAULT_CPU_LIMIT || '500m',
            memory: process.env.DEFAULT_MEMORY_LIMIT || '512Mi'
        };
    }

    async enforce(request: AdmissionRequest): Promise<PolicyResult> {
        if (request.kind.kind !== 'Pod') {
            return { allowed: true };
        }

        const pod = request.object as Pod;
        const patches: PatchOperation[] = [];
        const warnings: string[] = [];

        if (pod.spec.containers) {
            pod.spec.containers.forEach((container: Container, index: number) => {
                if (!container.resources?.limits) {
                    const defaultLimits = this.defaultLimits;

                    if (!container.resources) {
                        patches.push({
                            op: 'add',
                            path: `/spec/containers/${index}/resources`,
                            value: { limits: defaultLimits, requests: defaultLimits }
                        });
                    } else {
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

/**
 * Policy: Deny privileged containers
 */
export class NoPrivilegedContainersPolicy implements SecurityPolicy {
    name = 'no-privileged-containers';
    enabled = true;

    async enforce(request: AdmissionRequest): Promise<PolicyResult> {
        if (request.kind.kind !== 'Pod') {
            return { allowed: true };
        }

        const pod = request.object as Pod;

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

/**
 * Policy: Enforce security labels
 */
export class SecurityLabelsPolicy implements SecurityPolicy {
    name = 'security-labels';
    enabled = true;

    private requiredLabels = ['app', 'version', 'environment'];

    async enforce(request: AdmissionRequest): Promise<PolicyResult> {
        const obj = request.object as KubernetesObject;
        const patches: PatchOperation[] = [];
        const warnings: string[] = [];

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

/**
 * Policy registry
 */
export class SecurityPolicyRegistry {
    private policies: Map<string, SecurityPolicy> = new Map();

    constructor() {
        this.registerDefaultPolicies();
    }

    private registerDefaultPolicies(): void {
        this.register(new NonRootContainerPolicy());
        this.register(new ResourceLimitsPolicy());
        this.register(new NoPrivilegedContainersPolicy());
        this.register(new SecurityLabelsPolicy());
    }

    register(policy: SecurityPolicy): void {
        this.policies.set(policy.name, policy);
    }

    get(name: string): SecurityPolicy | undefined {
        return this.policies.get(name);
    }

    getAll(): SecurityPolicy[] {
        return Array.from(this.policies.values());
    }

    getEnabled(): SecurityPolicy[] {
        return this.getAll().filter(p => p.enabled);
    }
}
