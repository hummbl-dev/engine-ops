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

import { describe, it, expect, beforeEach } from '@jest/globals';
import { MultiCloudResourceManager } from '../resource-manager';
import { AWSProvider } from '../aws-provider';
import { GCPProvider } from '../gcp-provider';
import { AzureProvider } from '../azure-provider';
import { EdgeProvider } from '../edge-provider';
import type { Workload } from '../interfaces';

describe('MultiCloudResourceManager', () => {
    let manager: MultiCloudResourceManager;

    beforeEach(async () => {
        manager = new MultiCloudResourceManager();

        // Initialize and register all providers
        const awsProvider = new AWSProvider();
        await awsProvider.initialize({});
        manager.registerProvider(awsProvider);

        const gcpProvider = new GCPProvider();
        await gcpProvider.initialize({});
        manager.registerProvider(gcpProvider);

        const azureProvider = new AzureProvider();
        await azureProvider.initialize({});
        manager.registerProvider(azureProvider);

        const edgeProvider = new EdgeProvider();
        await edgeProvider.initialize({});
        manager.registerProvider(edgeProvider);
    });

    describe('Provider Registration', () => {
        it('should register multiple providers', () => {
            const providers = manager.getProviders();
            expect(providers.length).toBe(4);
        });

        it('should have AWS, GCP, Azure, and Edge providers', () => {
            const providers = manager.getProviders();
            const providerTypes = providers.map(p => p.getProvider());
            expect(providerTypes).toContain('aws');
            expect(providerTypes).toContain('gcp');
            expect(providerTypes).toContain('azure');
            expect(providerTypes).toContain('edge');
        });
    });

    describe('Node Listing', () => {
        it('should list all nodes across providers', async () => {
            const nodes = await manager.listAllNodes();
            expect(nodes.length).toBeGreaterThan(0);
        });

        it('should filter nodes by provider', async () => {
            const awsNodes = await manager.listAllNodes({ provider: 'aws' });
            expect(awsNodes.length).toBeGreaterThan(0);
            expect(awsNodes.every(node => node.provider === 'aws')).toBe(true);
        });

        it('should filter nodes by region', async () => {
            const usNodes = await manager.listAllNodes({ region: 'us-east-1' });
            expect(usNodes.length).toBeGreaterThan(0);
            expect(usNodes.every(node => node.region === 'us-east-1')).toBe(true);
        });
    });

    describe('Workload Scheduling', () => {
        it('should schedule a simple workload', async () => {
            const workload: Workload = {
                id: 'workload-1',
                resources: { cpu: 2000, memory: 4000 },
            };

            const result = await manager.scheduleWorkload(workload);

            expect(result).not.toBeNull();
            expect(result?.workloadId).toBe('workload-1');
            expect(result?.node).toBeDefined();
            expect(result?.score).toBeGreaterThan(0);
        });

        it('should respect provider preferences', async () => {
            const workload: Workload = {
                id: 'workload-2',
                resources: { cpu: 2000, memory: 4000 },
                constraints: {
                    providerPreferences: ['aws'],
                },
            };

            const result = await manager.scheduleWorkload(workload);

            expect(result).not.toBeNull();
            expect(result?.node.provider).toBe('aws');
        });

        it('should respect region preferences', async () => {
            const workload: Workload = {
                id: 'workload-3',
                resources: { cpu: 2000, memory: 4000 },
                preferredRegions: ['us-east-1'],
            };

            const result = await manager.scheduleWorkload(workload);

            expect(result).not.toBeNull();
            expect(result?.node.region).toBe('us-east-1');
        });

        it('should prefer edge for low latency workloads', async () => {
            const workload: Workload = {
                id: 'workload-4',
                resources: { cpu: 1000, memory: 2000 },
                constraints: {
                    maxLatencyMs: 30,
                },
            };

            const result = await manager.scheduleWorkload(workload);

            expect(result).not.toBeNull();
            expect(result?.node.provider).toBe('edge');
        });

        it('should return null when no suitable node is found', async () => {
            const workload: Workload = {
                id: 'workload-5',
                resources: { cpu: 100000, memory: 200000 }, // Unrealistic requirements
            };

            const result = await manager.scheduleWorkload(workload);

            expect(result).toBeNull();
        });
    });

    describe('Geo-Sharding', () => {
        it('should schedule multiple workloads with geo-sharding', async () => {
            const workloads: Workload[] = [
                {
                    id: 'geo-workload-1',
                    resources: { cpu: 2000, memory: 4000 },
                    preferredRegions: ['us-east-1'],
                },
                {
                    id: 'geo-workload-2',
                    resources: { cpu: 2000, memory: 4000 },
                    preferredRegions: ['europe-west1'],
                },
                {
                    id: 'geo-workload-3',
                    resources: { cpu: 1000, memory: 2000 },
                    preferredRegions: ['asia-east1'],
                },
            ];

            const results = await manager.scheduleWorkloadsWithGeoSharding(workloads);

            expect(results.length).toBe(3);
            expect(results[0].node.region).toBe('us-east-1');
            expect(results[1].node.region).toBe('europe-west1');
            expect(results[2].node.region).toBe('asia-east1');
        });

        it('should handle workloads without region preferences', async () => {
            const workloads: Workload[] = [
                {
                    id: 'default-workload-1',
                    resources: { cpu: 2000, memory: 4000 },
                },
                {
                    id: 'default-workload-2',
                    resources: { cpu: 2000, memory: 4000 },
                },
            ];

            const results = await manager.scheduleWorkloadsWithGeoSharding(workloads);

            expect(results.length).toBe(2);
        });
    });

    describe('Resource Utilization', () => {
        it('should return utilization for all providers', async () => {
            const utilization = await manager.getUtilization();

            expect(utilization.aws).toBeDefined();
            expect(utilization.gcp).toBeDefined();
            expect(utilization.azure).toBeDefined();
            expect(utilization.edge).toBeDefined();
        });

        it('should show zero utilization initially', async () => {
            const utilization = await manager.getUtilization();

            expect(utilization.aws.used.cpu).toBe(0);
            expect(utilization.aws.used.memory).toBe(0);
        });

        it('should update utilization after scheduling workloads', async () => {
            const workload: Workload = {
                id: 'util-workload',
                resources: { cpu: 2000, memory: 4000 },
                constraints: {
                    providerPreferences: ['aws'],
                },
            };

            await manager.scheduleWorkload(workload);
            const utilization = await manager.getUtilization();

            expect(utilization.aws.used.cpu).toBeGreaterThan(0);
            expect(utilization.aws.used.memory).toBeGreaterThan(0);
        });
    });
});
