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
import { OptimizationEngine } from '../engine';
import type { Workload } from '../providers/interfaces';

describe('OptimizationEngine - Multi-Cloud Integration', () => {
  let engine: OptimizationEngine;

  describe('Multi-Cloud Initialization', () => {
    it('should initialize with multi-cloud disabled by default', async () => {
      engine = new OptimizationEngine();
      await engine.init();

      const manager = engine.getMultiCloudManager();
      expect(manager).toBeUndefined();
    });

    it('should initialize with all providers when multi-cloud is enabled', async () => {
      engine = new OptimizationEngine({
        enableMultiCloud: true,
      });
      await engine.init();

      const manager = engine.getMultiCloudManager();
      expect(manager).toBeDefined();

      const providers = manager?.getProviders();
      expect(providers?.length).toBe(4); // AWS, GCP, Azure, Edge
    });

    it('should initialize with selected providers only', async () => {
      engine = new OptimizationEngine({
        enableMultiCloud: true,
        cloudProviders: ['aws', 'gcp'],
      });
      await engine.init();

      const manager = engine.getMultiCloudManager();
      const providers = manager?.getProviders();
      expect(providers?.length).toBe(2);

      const providerTypes = providers?.map((p) => p.getProvider());
      expect(providerTypes).toContain('aws');
      expect(providerTypes).toContain('gcp');
    });
  });

  describe('Multi-Cloud Workload Scheduling', () => {
    beforeEach(async () => {
      engine = new OptimizationEngine({
        enableMultiCloud: true,
        verbose: false,
      });
      await engine.init();
    });

    it('should schedule a single workload', async () => {
      const workloads: Workload[] = [
        {
          id: 'mc-workload-1',
          resources: { cpu: 2000, memory: 4000 },
        },
      ];

      const result = await engine.scheduleMultiCloudWorkloads(workloads);

      expect(result.success).toBe(true);
      expect(
        (result.result as { totalScheduled: number; totalRequested: number }).totalScheduled,
      ).toBe(1);
      expect(
        (result.result as { totalScheduled: number; totalRequested: number }).totalRequested,
      ).toBe(1);
    });

    it('should schedule multiple workloads with geo-sharding', async () => {
      const workloads: Workload[] = [
        {
          id: 'geo-1',
          resources: { cpu: 2000, memory: 4000 },
          preferredRegions: ['us-east-1'],
        },
        {
          id: 'geo-2',
          resources: { cpu: 2000, memory: 4000 },
          preferredRegions: ['europe-west1'],
        },
        {
          id: 'geo-3',
          resources: { cpu: 1000, memory: 2000 },
          preferredRegions: ['asia-east1'],
        },
      ];

      const result = await engine.scheduleMultiCloudWorkloads(workloads, true);

      expect(result.success).toBe(true);
      expect(
        (result.result as { totalScheduled: number; placements: unknown[] }).totalScheduled,
      ).toBe(3);
      expect(
        (result.result as { totalScheduled: number; placements: unknown[] }).placements.length,
      ).toBe(3);
    });

    it('should schedule workloads without geo-sharding', async () => {
      const workloads: Workload[] = [
        {
          id: 'no-geo-1',
          resources: { cpu: 2000, memory: 4000 },
        },
        {
          id: 'no-geo-2',
          resources: { cpu: 2000, memory: 4000 },
        },
      ];

      const result = await engine.scheduleMultiCloudWorkloads(workloads, false);

      expect(result.success).toBe(true);
      expect((result.result as { totalScheduled: number }).totalScheduled).toBe(2);
    });

    it('should respect provider preferences', async () => {
      const workloads: Workload[] = [
        {
          id: 'aws-only',
          resources: { cpu: 2000, memory: 4000 },
          constraints: {
            providerPreferences: ['aws'],
          },
        },
      ];

      const result = await engine.scheduleMultiCloudWorkloads(workloads);

      expect(result.success).toBe(true);
      const placement = (result.result as { placements: Array<{ node: { provider: string } }> })
        .placements[0];
      expect(placement.node.provider).toBe('aws');
    });

    it('should handle edge workloads with low latency requirements', async () => {
      const workloads: Workload[] = [
        {
          id: 'edge-workload',
          resources: { cpu: 1000, memory: 2000 },
          constraints: {
            maxLatencyMs: 30,
          },
        },
      ];

      const result = await engine.scheduleMultiCloudWorkloads(workloads);

      expect(result.success).toBe(true);
      const placement = (result.result as { placements: Array<{ node: { provider: string } }> })
        .placements[0];
      expect(placement.node.provider).toBe('edge');
    });

    it('should throw error when multi-cloud is not enabled', async () => {
      const engineNoMultiCloud = new OptimizationEngine({
        enableMultiCloud: false,
      });
      await engineNoMultiCloud.init();

      const workloads: Workload[] = [
        {
          id: 'test',
          resources: { cpu: 1000, memory: 2000 },
        },
      ];

      await expect(engineNoMultiCloud.scheduleMultiCloudWorkloads(workloads)).rejects.toThrow(
        'Multi-cloud is not enabled',
      );
    });

    it('should return partial success when some workloads cannot be scheduled', async () => {
      const workloads: Workload[] = [
        {
          id: 'schedulable',
          resources: { cpu: 2000, memory: 4000 },
        },
        {
          id: 'too-large',
          resources: { cpu: 1000000, memory: 2000000 },
        },
      ];

      const result = await engine.scheduleMultiCloudWorkloads(workloads);

      expect(result.success).toBe(true);
      expect(
        (result.result as { totalScheduled: number; totalRequested: number }).totalScheduled,
      ).toBeLessThan(
        (result.result as { totalScheduled: number; totalRequested: number }).totalRequested,
      );
    });
  });

  describe('Multi-Cloud Resource Utilization', () => {
    beforeEach(async () => {
      engine = new OptimizationEngine({
        enableMultiCloud: true,
      });
      await engine.init();
    });

    it('should track resource utilization across providers', async () => {
      const workloads: Workload[] = [
        {
          id: 'util-test-1',
          resources: { cpu: 2000, memory: 4000 },
          constraints: {
            providerPreferences: ['aws'],
          },
        },
        {
          id: 'util-test-2',
          resources: { cpu: 2000, memory: 4000 },
          constraints: {
            providerPreferences: ['gcp'],
          },
        },
      ];

      await engine.scheduleMultiCloudWorkloads(workloads);

      const manager = engine.getMultiCloudManager();
      const utilization = await manager!.getUtilization();

      expect(utilization.aws.used.cpu).toBeGreaterThan(0);
      expect(utilization.gcp.used.cpu).toBeGreaterThan(0);
    });
  });

  describe('Integration with Existing Optimization', () => {
    beforeEach(async () => {
      engine = new OptimizationEngine({
        enableMultiCloud: true,
      });
      await engine.init();
    });

    it('should continue to support traditional optimization requests', async () => {
      const request = {
        id: 'traditional-1',
        type: 'resource' as const,
        data: {
          items: [
            { id: 'item-1', cpu: 50, memory: 500 },
            { id: 'item-2', cpu: 30, memory: 300 },
          ],
          nodeCapacity: { cpu: 100, memory: 1000 },
        },
      };

      const result = await engine.optimize(request);

      expect(result.success).toBe(true);
      expect(result.requestId).toBe('traditional-1');
    });
  });
});
