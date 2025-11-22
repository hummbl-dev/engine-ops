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
import { AWSProvider } from '../aws-provider';
import { GCPProvider } from '../gcp-provider';
import { AzureProvider } from '../azure-provider';
import { EdgeProvider } from '../edge-provider';
import type { ICloudProvider, Workload } from '../interfaces';

describe('Cloud Providers', () => {
    describe.each([
        ['AWS', () => new AWSProvider(), 'aws'],
        ['GCP', () => new GCPProvider(), 'gcp'],
        ['Azure', () => new AzureProvider(), 'azure'],
        ['Edge', () => new EdgeProvider(), 'edge'],
    ] as const)('%s Provider', (name, createProvider, expectedType) => {
        let provider: ICloudProvider;

        beforeEach(async () => {
            provider = createProvider();
            await provider.initialize({});
        });

        it('should return correct provider type', () => {
            expect(provider.getProvider()).toBe(expectedType);
        });

        it('should initialize successfully', async () => {
            const newProvider = createProvider();
            await expect(newProvider.initialize({})).resolves.not.toThrow();
        });

        it('should list nodes after initialization', async () => {
            const nodes = await provider.listNodes();
            expect(nodes.length).toBeGreaterThan(0);
            expect(nodes.every(node => node.provider === expectedType)).toBe(true);
        });

        it('should list nodes filtered by region', async () => {
            const allNodes = await provider.listNodes();
            const firstRegion = allNodes[0].region;

            const regionNodes = await provider.listNodes(firstRegion);
            expect(regionNodes.length).toBeGreaterThan(0);
            expect(regionNodes.every(node => node.region === firstRegion)).toBe(true);
        });

        it('should get node by id', async () => {
            const nodes = await provider.listNodes();
            const firstNode = nodes[0];

            const node = await provider.getNode(firstNode.id);
            expect(node).not.toBeNull();
            expect(node?.id).toBe(firstNode.id);
        });

        it('should return null for non-existent node', async () => {
            const node = await provider.getNode('non-existent-node');
            expect(node).toBeNull();
        });

        it('should deploy workload successfully', async () => {
            const nodes = await provider.listNodes();
            const firstNode = nodes[0];

            const workload: Workload = {
                id: 'test-workload',
                resources: { cpu: 1000, memory: 2000 },
            };

            const result = await provider.deployWorkload(firstNode.id, workload);
            expect(result).toBe(true);

            // Verify utilization updated
            const updatedNode = await provider.getNode(firstNode.id);
            expect(updatedNode?.utilization.cpu).toBeGreaterThan(0);
            expect(updatedNode?.utilization.memory).toBeGreaterThan(0);
        });

        it('should fail to deploy when resources insufficient', async () => {
            const nodes = await provider.listNodes();
            const firstNode = nodes[0];

            const workload: Workload = {
                id: 'large-workload',
                resources: { cpu: 1000000, memory: 2000000 },
            };

            const result = await provider.deployWorkload(firstNode.id, workload);
            expect(result).toBe(false);
        });

        it('should remove workload successfully', async () => {
            const nodes = await provider.listNodes();
            const firstNode = nodes[0];

            const result = await provider.removeWorkload(firstNode.id, 'test-workload');
            expect(result).toBe(true);
        });

        it('should get available regions', async () => {
            const regions = await provider.getRegions();
            expect(regions.length).toBeGreaterThan(0);
            expect(regions.every(region => region.provider === expectedType)).toBe(true);
        });

        it('should pass health check', async () => {
            const healthy = await provider.healthCheck();
            expect(healthy).toBe(true);
        });
    });

    describe('Provider-Specific Features', () => {
        it('AWS should have multiple availability zones', async () => {
            const provider = new AWSProvider();
            await provider.initialize({});

            const nodes = await provider.listNodes('us-east-1');
            const zones = new Set(nodes.map(node => node.labels?.zone));
            expect(zones.size).toBeGreaterThan(1);
        });

        it('Edge should have smaller capacity nodes', async () => {
            const edgeProvider = new EdgeProvider();
            await edgeProvider.initialize({});

            const awsProvider = new AWSProvider();
            await awsProvider.initialize({});

            const edgeNodes = await edgeProvider.listNodes();
            const awsNodes = await awsProvider.listNodes();

            const avgEdgeCapacity = edgeNodes.reduce((sum, n) => sum + n.capacity.cpu, 0) / edgeNodes.length;
            const avgAwsCapacity = awsNodes.reduce((sum, n) => sum + n.capacity.cpu, 0) / awsNodes.length;

            expect(avgEdgeCapacity).toBeLessThan(avgAwsCapacity);
        });

        it('Edge nodes should have latency labels', async () => {
            const provider = new EdgeProvider();
            await provider.initialize({});

            const nodes = await provider.listNodes();
            expect(nodes.every(node => node.labels?.latency === 'low')).toBe(true);
        });
    });
});
