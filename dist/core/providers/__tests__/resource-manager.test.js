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
const globals_1 = require("@jest/globals");
const resource_manager_1 = require("../resource-manager");
const aws_provider_1 = require("../aws-provider");
const gcp_provider_1 = require("../gcp-provider");
const azure_provider_1 = require("../azure-provider");
const edge_provider_1 = require("../edge-provider");
(0, globals_1.describe)('MultiCloudResourceManager', () => {
    let manager;
    (0, globals_1.beforeEach)(async () => {
        manager = new resource_manager_1.MultiCloudResourceManager();
        // Initialize and register all providers
        const awsProvider = new aws_provider_1.AWSProvider();
        await awsProvider.initialize({});
        manager.registerProvider(awsProvider);
        const gcpProvider = new gcp_provider_1.GCPProvider();
        await gcpProvider.initialize({});
        manager.registerProvider(gcpProvider);
        const azureProvider = new azure_provider_1.AzureProvider();
        await azureProvider.initialize({});
        manager.registerProvider(azureProvider);
        const edgeProvider = new edge_provider_1.EdgeProvider();
        await edgeProvider.initialize({});
        manager.registerProvider(edgeProvider);
    });
    (0, globals_1.describe)('Provider Registration', () => {
        (0, globals_1.it)('should register multiple providers', () => {
            const providers = manager.getProviders();
            (0, globals_1.expect)(providers.length).toBe(4);
        });
        (0, globals_1.it)('should have AWS, GCP, Azure, and Edge providers', () => {
            const providers = manager.getProviders();
            const providerTypes = providers.map(p => p.getProvider());
            (0, globals_1.expect)(providerTypes).toContain('aws');
            (0, globals_1.expect)(providerTypes).toContain('gcp');
            (0, globals_1.expect)(providerTypes).toContain('azure');
            (0, globals_1.expect)(providerTypes).toContain('edge');
        });
    });
    (0, globals_1.describe)('Node Listing', () => {
        (0, globals_1.it)('should list all nodes across providers', async () => {
            const nodes = await manager.listAllNodes();
            (0, globals_1.expect)(nodes.length).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should filter nodes by provider', async () => {
            const awsNodes = await manager.listAllNodes({ provider: 'aws' });
            (0, globals_1.expect)(awsNodes.length).toBeGreaterThan(0);
            (0, globals_1.expect)(awsNodes.every(node => node.provider === 'aws')).toBe(true);
        });
        (0, globals_1.it)('should filter nodes by region', async () => {
            const usNodes = await manager.listAllNodes({ region: 'us-east-1' });
            (0, globals_1.expect)(usNodes.length).toBeGreaterThan(0);
            (0, globals_1.expect)(usNodes.every(node => node.region === 'us-east-1')).toBe(true);
        });
    });
    (0, globals_1.describe)('Workload Scheduling', () => {
        (0, globals_1.it)('should schedule a simple workload', async () => {
            const workload = {
                id: 'workload-1',
                resources: { cpu: 2000, memory: 4000 },
            };
            const result = await manager.scheduleWorkload(workload);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result?.workloadId).toBe('workload-1');
            (0, globals_1.expect)(result?.node).toBeDefined();
            (0, globals_1.expect)(result?.score).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should respect provider preferences', async () => {
            const workload = {
                id: 'workload-2',
                resources: { cpu: 2000, memory: 4000 },
                constraints: {
                    providerPreferences: ['aws'],
                },
            };
            const result = await manager.scheduleWorkload(workload);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result?.node.provider).toBe('aws');
        });
        (0, globals_1.it)('should respect region preferences', async () => {
            const workload = {
                id: 'workload-3',
                resources: { cpu: 2000, memory: 4000 },
                preferredRegions: ['us-east-1'],
            };
            const result = await manager.scheduleWorkload(workload);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result?.node.region).toBe('us-east-1');
        });
        (0, globals_1.it)('should prefer edge for low latency workloads', async () => {
            const workload = {
                id: 'workload-4',
                resources: { cpu: 1000, memory: 2000 },
                constraints: {
                    maxLatencyMs: 30,
                },
            };
            const result = await manager.scheduleWorkload(workload);
            (0, globals_1.expect)(result).not.toBeNull();
            (0, globals_1.expect)(result?.node.provider).toBe('edge');
        });
        (0, globals_1.it)('should return null when no suitable node is found', async () => {
            const workload = {
                id: 'workload-5',
                resources: { cpu: 100000, memory: 200000 }, // Unrealistic requirements
            };
            const result = await manager.scheduleWorkload(workload);
            (0, globals_1.expect)(result).toBeNull();
        });
    });
    (0, globals_1.describe)('Geo-Sharding', () => {
        (0, globals_1.it)('should schedule multiple workloads with geo-sharding', async () => {
            const workloads = [
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
            (0, globals_1.expect)(results.length).toBe(3);
            (0, globals_1.expect)(results[0].node.region).toBe('us-east-1');
            (0, globals_1.expect)(results[1].node.region).toBe('europe-west1');
            (0, globals_1.expect)(results[2].node.region).toBe('asia-east1');
        });
        (0, globals_1.it)('should handle workloads without region preferences', async () => {
            const workloads = [
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
            (0, globals_1.expect)(results.length).toBe(2);
        });
    });
    (0, globals_1.describe)('Resource Utilization', () => {
        (0, globals_1.it)('should return utilization for all providers', async () => {
            const utilization = await manager.getUtilization();
            (0, globals_1.expect)(utilization.aws).toBeDefined();
            (0, globals_1.expect)(utilization.gcp).toBeDefined();
            (0, globals_1.expect)(utilization.azure).toBeDefined();
            (0, globals_1.expect)(utilization.edge).toBeDefined();
        });
        (0, globals_1.it)('should show zero utilization initially', async () => {
            const utilization = await manager.getUtilization();
            (0, globals_1.expect)(utilization.aws.used.cpu).toBe(0);
            (0, globals_1.expect)(utilization.aws.used.memory).toBe(0);
        });
        (0, globals_1.it)('should update utilization after scheduling workloads', async () => {
            const workload = {
                id: 'util-workload',
                resources: { cpu: 2000, memory: 4000 },
                constraints: {
                    providerPreferences: ['aws'],
                },
            };
            await manager.scheduleWorkload(workload);
            const utilization = await manager.getUtilization();
            (0, globals_1.expect)(utilization.aws.used.cpu).toBeGreaterThan(0);
            (0, globals_1.expect)(utilization.aws.used.memory).toBeGreaterThan(0);
        });
    });
});
