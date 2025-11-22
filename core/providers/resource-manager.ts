/*
 * Copyright (c) 2025, HUMMBL, LLC
 *
 * Licensed under the Business Source License 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://mariadb.com/bsl11/
 *
 * Change Date: 2029-01-01
 * Change License: Apache License, Version 2.0
 */

import {
    IResourceManager,
    ICloudProvider,
    CloudProvider,
    CloudNode,
    Workload,
    PlacementResult,
    ResourceCapacity,
} from './interfaces.js';

/**
 * Multi-cloud resource manager with geo-sharding and federated scheduling
 */
export class MultiCloudResourceManager implements IResourceManager {
    private providers: Map<CloudProvider, ICloudProvider> = new Map();

    registerProvider(provider: ICloudProvider): void {
        this.providers.set(provider.getProvider(), provider);
    }

    getProviders(): ICloudProvider[] {
        return Array.from(this.providers.values());
    }

    async listAllNodes(filters?: { provider?: CloudProvider; region?: string }): Promise<CloudNode[]> {
        const allNodes: CloudNode[] = [];

        for (const provider of this.providers.values()) {
            if (filters?.provider && provider.getProvider() !== filters.provider) {
                continue;
            }

            const nodes = await provider.listNodes(filters?.region);
            allNodes.push(...nodes);
        }

        return allNodes;
    }

    async scheduleWorkload(workload: Workload): Promise<PlacementResult | null> {
        const allNodes = await this.listAllNodes();

        // Filter nodes based on workload constraints
        const candidateNodes = this.filterNodesByConstraints(allNodes, workload);

        if (candidateNodes.length === 0) {
            return null;
        }

        // Score and rank nodes
        const scoredNodes = this.scoreNodes(candidateNodes, workload);

        // Sort by score (highest first)
        scoredNodes.sort((a, b) => b.score - a.score);

        // Try to deploy to the best node
        for (const { node, score, reason } of scoredNodes) {
            const provider = this.providers.get(node.provider);
            if (!provider) continue;

            const deployed = await provider.deployWorkload(node.id, workload);
            if (deployed) {
                return {
                    workloadId: workload.id,
                    node,
                    score,
                    reason,
                };
            }
        }

        return null;
    }

    async scheduleWorkloadsWithGeoSharding(workloads: Workload[]): Promise<PlacementResult[]> {
        const results: PlacementResult[] = [];

        // Group workloads by preferred region or use geo-distribution strategy
        const workloadGroups = this.groupWorkloadsByGeo(workloads);

        // Schedule each group
        for (const workloadList of Object.values(workloadGroups)) {
            for (const workload of workloadList) {
                const result = await this.scheduleWorkload(workload);
                if (result) {
                    results.push(result);
                }
            }
        }

        return results;
    }

    async getUtilization(): Promise<Record<CloudProvider, { total: ResourceCapacity; used: ResourceCapacity }>> {
        const utilization: Partial<Record<CloudProvider, { total: ResourceCapacity; used: ResourceCapacity }>> = {};

        for (const provider of this.providers.values()) {
            const providerType = provider.getProvider();
            const nodes = await provider.listNodes();

            const total: ResourceCapacity = { cpu: 0, memory: 0, storage: 0 };
            const used: ResourceCapacity = { cpu: 0, memory: 0, storage: 0 };

            for (const node of nodes) {
                total.cpu += node.capacity.cpu;
                total.memory += node.capacity.memory;
                total.storage = (total.storage || 0) + (node.capacity.storage || 0);

                used.cpu += node.utilization.cpu;
                used.memory += node.utilization.memory;
                used.storage = (used.storage || 0) + (node.utilization.storage || 0);
            }

            utilization[providerType] = { total, used };
        }

        return utilization as Record<CloudProvider, { total: ResourceCapacity; used: ResourceCapacity }>;
    }

    /**
     * Filter nodes based on workload constraints
     */
    private filterNodesByConstraints(nodes: CloudNode[], workload: Workload): CloudNode[] {
        return nodes.filter(node => {
            // Check if node is available
            if (node.status === 'unavailable') {
                return false;
            }

            // Check resource capacity
            const availableCpu = node.capacity.cpu - node.utilization.cpu;
            const availableMemory = node.capacity.memory - node.utilization.memory;

            if (availableCpu < workload.resources.cpu || availableMemory < workload.resources.memory) {
                return false;
            }

            // Check provider preferences
            if (workload.constraints?.providerPreferences) {
                if (!workload.constraints.providerPreferences.includes(node.provider)) {
                    return false;
                }
            }

            // Check region preferences
            if (workload.preferredRegions && workload.preferredRegions.length > 0) {
                if (!workload.preferredRegions.includes(node.region)) {
                    return false;
                }
            }

            // Check required labels
            if (workload.requiredLabels) {
                for (const [key, value] of Object.entries(workload.requiredLabels)) {
                    if (node.labels?.[key] !== value) {
                        return false;
                    }
                }
            }

            return true;
        });
    }

    /**
     * Score nodes for workload placement
     */
    private scoreNodes(nodes: CloudNode[], workload: Workload): Array<{ node: CloudNode; score: number; reason: string }> {
        return nodes.map(node => {
            let score = 0;
            const reasons: string[] = [];

            // Resource availability score (0-0.4)
            const cpuAvailability = (node.capacity.cpu - node.utilization.cpu) / node.capacity.cpu;
            const memoryAvailability = (node.capacity.memory - node.utilization.memory) / node.capacity.memory;
            const resourceScore = Math.min(cpuAvailability, memoryAvailability) * 0.4;
            score += resourceScore;

            // Load balancing score (0-0.3) - prefer less loaded nodes
            const loadScore = (1 - Math.max(
                node.utilization.cpu / node.capacity.cpu,
                node.utilization.memory / node.capacity.memory
            )) * 0.3;
            score += loadScore;

            // Region preference score (0-0.2)
            if (workload.preferredRegions?.includes(node.region)) {
                score += 0.2;
                reasons.push('preferred region');
            }

            // Provider preference score (0-0.1)
            if (workload.constraints?.providerPreferences?.includes(node.provider)) {
                score += 0.1;
                reasons.push('preferred provider');
            }

            // Edge preference for latency-sensitive workloads (bonus)
            if (workload.constraints?.maxLatencyMs && workload.constraints.maxLatencyMs < 50) {
                if (node.provider === 'edge') {
                    score += 0.1;
                    reasons.push('edge for low latency');
                }
            }

            const reason = reasons.length > 0 ? reasons.join(', ') : 'best available resources';

            return { node, score, reason };
        });
    }

    /**
     * Group workloads by geographical region for geo-sharding
     */
    private groupWorkloadsByGeo(workloads: Workload[]): Record<string, Workload[]> {
        const groups: Record<string, Workload[]> = {};

        for (const workload of workloads) {
            // Use preferred region if specified
            if (workload.preferredRegions && workload.preferredRegions.length > 0) {
                const region = workload.preferredRegions[0];
                if (!groups[region]) {
                    groups[region] = [];
                }
                groups[region].push(workload);
            } else {
                // Default to a distributed approach
                const defaultGroup = 'default';
                if (!groups[defaultGroup]) {
                    groups[defaultGroup] = [];
                }
                groups[defaultGroup].push(workload);
            }
        }

        return groups;
    }
}
