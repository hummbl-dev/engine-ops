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
const aws_provider_1 = require("../aws-provider");
const gcp_provider_1 = require("../gcp-provider");
const azure_provider_1 = require("../azure-provider");
const edge_provider_1 = require("../edge-provider");
(0, globals_1.describe)('Cloud Providers', () => {
    globals_1.describe.each([
        ['AWS', () => new aws_provider_1.AWSProvider(), 'aws'],
        ['GCP', () => new gcp_provider_1.GCPProvider(), 'gcp'],
        ['Azure', () => new azure_provider_1.AzureProvider(), 'azure'],
        ['Edge', () => new edge_provider_1.EdgeProvider(), 'edge'],
    ])('%s Provider', (name, createProvider, expectedType) => {
        let provider;
        (0, globals_1.beforeEach)(async () => {
            provider = createProvider();
            await provider.initialize({});
        });
        (0, globals_1.it)('should return correct provider type', () => {
            (0, globals_1.expect)(provider.getProvider()).toBe(expectedType);
        });
        (0, globals_1.it)('should initialize successfully', async () => {
            const newProvider = createProvider();
            await (0, globals_1.expect)(newProvider.initialize({})).resolves.not.toThrow();
        });
        (0, globals_1.it)('should list nodes after initialization', async () => {
            const nodes = await provider.listNodes();
            (0, globals_1.expect)(nodes.length).toBeGreaterThan(0);
            (0, globals_1.expect)(nodes.every(node => node.provider === expectedType)).toBe(true);
        });
        (0, globals_1.it)('should list nodes filtered by region', async () => {
            const allNodes = await provider.listNodes();
            const firstRegion = allNodes[0].region;
            const regionNodes = await provider.listNodes(firstRegion);
            (0, globals_1.expect)(regionNodes.length).toBeGreaterThan(0);
            (0, globals_1.expect)(regionNodes.every(node => node.region === firstRegion)).toBe(true);
        });
        (0, globals_1.it)('should get node by id', async () => {
            const nodes = await provider.listNodes();
            const firstNode = nodes[0];
            const node = await provider.getNode(firstNode.id);
            (0, globals_1.expect)(node).not.toBeNull();
            (0, globals_1.expect)(node?.id).toBe(firstNode.id);
        });
        (0, globals_1.it)('should return null for non-existent node', async () => {
            const node = await provider.getNode('non-existent-node');
            (0, globals_1.expect)(node).toBeNull();
        });
        (0, globals_1.it)('should deploy workload successfully', async () => {
            const nodes = await provider.listNodes();
            const firstNode = nodes[0];
            const workload = {
                id: 'test-workload',
                resources: { cpu: 1000, memory: 2000 },
            };
            const result = await provider.deployWorkload(firstNode.id, workload);
            (0, globals_1.expect)(result).toBe(true);
            // Verify utilization updated
            const updatedNode = await provider.getNode(firstNode.id);
            (0, globals_1.expect)(updatedNode?.utilization.cpu).toBeGreaterThan(0);
            (0, globals_1.expect)(updatedNode?.utilization.memory).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should fail to deploy when resources insufficient', async () => {
            const nodes = await provider.listNodes();
            const firstNode = nodes[0];
            const workload = {
                id: 'large-workload',
                resources: { cpu: 1000000, memory: 2000000 },
            };
            const result = await provider.deployWorkload(firstNode.id, workload);
            (0, globals_1.expect)(result).toBe(false);
        });
        (0, globals_1.it)('should remove workload successfully', async () => {
            const nodes = await provider.listNodes();
            const firstNode = nodes[0];
            const result = await provider.removeWorkload(firstNode.id, 'test-workload');
            (0, globals_1.expect)(result).toBe(true);
        });
        (0, globals_1.it)('should get available regions', async () => {
            const regions = await provider.getRegions();
            (0, globals_1.expect)(regions.length).toBeGreaterThan(0);
            (0, globals_1.expect)(regions.every(region => region.provider === expectedType)).toBe(true);
        });
        (0, globals_1.it)('should pass health check', async () => {
            const healthy = await provider.healthCheck();
            (0, globals_1.expect)(healthy).toBe(true);
        });
    });
    (0, globals_1.describe)('Provider-Specific Features', () => {
        (0, globals_1.it)('AWS should have multiple availability zones', async () => {
            const provider = new aws_provider_1.AWSProvider();
            await provider.initialize({});
            const nodes = await provider.listNodes('us-east-1');
            const zones = new Set(nodes.map(node => node.labels?.zone));
            (0, globals_1.expect)(zones.size).toBeGreaterThan(1);
        });
        (0, globals_1.it)('Edge should have smaller capacity nodes', async () => {
            const edgeProvider = new edge_provider_1.EdgeProvider();
            await edgeProvider.initialize({});
            const awsProvider = new aws_provider_1.AWSProvider();
            await awsProvider.initialize({});
            const edgeNodes = await edgeProvider.listNodes();
            const awsNodes = await awsProvider.listNodes();
            const avgEdgeCapacity = edgeNodes.reduce((sum, n) => sum + n.capacity.cpu, 0) / edgeNodes.length;
            const avgAwsCapacity = awsNodes.reduce((sum, n) => sum + n.capacity.cpu, 0) / awsNodes.length;
            (0, globals_1.expect)(avgEdgeCapacity).toBeLessThan(avgAwsCapacity);
        });
        (0, globals_1.it)('Edge nodes should have latency labels', async () => {
            const provider = new edge_provider_1.EdgeProvider();
            await provider.initialize({});
            const nodes = await provider.listNodes();
            (0, globals_1.expect)(nodes.every(node => node.labels?.latency === 'low')).toBe(true);
        });
    });
});
