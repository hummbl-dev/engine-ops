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
const engine_1 = require('../engine');
(0, globals_1.describe)('OptimizationEngine - Multi-Cloud Integration', () => {
  let engine;
  (0, globals_1.describe)('Multi-Cloud Initialization', () => {
    (0, globals_1.it)('should initialize with multi-cloud disabled by default', async () => {
      engine = new engine_1.OptimizationEngine();
      await engine.init();
      const manager = engine.getMultiCloudManager();
      (0, globals_1.expect)(manager).toBeUndefined();
    });
    (0, globals_1.it)(
      'should initialize with all providers when multi-cloud is enabled',
      async () => {
        engine = new engine_1.OptimizationEngine({
          enableMultiCloud: true,
        });
        await engine.init();
        const manager = engine.getMultiCloudManager();
        (0, globals_1.expect)(manager).toBeDefined();
        const providers = manager?.getProviders();
        (0, globals_1.expect)(providers?.length).toBe(4); // AWS, GCP, Azure, Edge
      },
    );
    (0, globals_1.it)('should initialize with selected providers only', async () => {
      engine = new engine_1.OptimizationEngine({
        enableMultiCloud: true,
        cloudProviders: ['aws', 'gcp'],
      });
      await engine.init();
      const manager = engine.getMultiCloudManager();
      const providers = manager?.getProviders();
      (0, globals_1.expect)(providers?.length).toBe(2);
      const providerTypes = providers?.map((p) => p.getProvider());
      (0, globals_1.expect)(providerTypes).toContain('aws');
      (0, globals_1.expect)(providerTypes).toContain('gcp');
    });
  });
  (0, globals_1.describe)('Multi-Cloud Workload Scheduling', () => {
    (0, globals_1.beforeEach)(async () => {
      engine = new engine_1.OptimizationEngine({
        enableMultiCloud: true,
        verbose: false,
      });
      await engine.init();
    });
    (0, globals_1.it)('should schedule a single workload', async () => {
      const workloads = [
        {
          id: 'mc-workload-1',
          resources: { cpu: 2000, memory: 4000 },
        },
      ];
      const result = await engine.scheduleMultiCloudWorkloads(workloads);
      (0, globals_1.expect)(result.success).toBe(true);
      (0, globals_1.expect)(result.result.totalScheduled).toBe(1);
      (0, globals_1.expect)(result.result.totalRequested).toBe(1);
    });
    (0, globals_1.it)('should schedule multiple workloads with geo-sharding', async () => {
      const workloads = [
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
      (0, globals_1.expect)(result.success).toBe(true);
      (0, globals_1.expect)(result.result.totalScheduled).toBe(3);
      (0, globals_1.expect)(result.result.placements.length).toBe(3);
    });
    (0, globals_1.it)('should schedule workloads without geo-sharding', async () => {
      const workloads = [
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
      (0, globals_1.expect)(result.success).toBe(true);
      (0, globals_1.expect)(result.result.totalScheduled).toBe(2);
    });
    (0, globals_1.it)('should respect provider preferences', async () => {
      const workloads = [
        {
          id: 'aws-only',
          resources: { cpu: 2000, memory: 4000 },
          constraints: {
            providerPreferences: ['aws'],
          },
        },
      ];
      const result = await engine.scheduleMultiCloudWorkloads(workloads);
      (0, globals_1.expect)(result.success).toBe(true);
      const placement = result.result.placements[0];
      (0, globals_1.expect)(placement.node.provider).toBe('aws');
    });
    (0, globals_1.it)('should handle edge workloads with low latency requirements', async () => {
      const workloads = [
        {
          id: 'edge-workload',
          resources: { cpu: 1000, memory: 2000 },
          constraints: {
            maxLatencyMs: 30,
          },
        },
      ];
      const result = await engine.scheduleMultiCloudWorkloads(workloads);
      (0, globals_1.expect)(result.success).toBe(true);
      const placement = result.result.placements[0];
      (0, globals_1.expect)(placement.node.provider).toBe('edge');
    });
    (0, globals_1.it)('should throw error when multi-cloud is not enabled', async () => {
      const engineNoMultiCloud = new engine_1.OptimizationEngine({
        enableMultiCloud: false,
      });
      await engineNoMultiCloud.init();
      const workloads = [
        {
          id: 'test',
          resources: { cpu: 1000, memory: 2000 },
        },
      ];
      await (0, globals_1.expect)(
        engineNoMultiCloud.scheduleMultiCloudWorkloads(workloads),
      ).rejects.toThrow('Multi-cloud is not enabled');
    });
    (0, globals_1.it)(
      'should return partial success when some workloads cannot be scheduled',
      async () => {
        const workloads = [
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
        (0, globals_1.expect)(result.success).toBe(true);
        (0, globals_1.expect)(result.result.totalScheduled).toBeLessThan(
          result.result.totalRequested,
        );
      },
    );
  });
  (0, globals_1.describe)('Multi-Cloud Resource Utilization', () => {
    (0, globals_1.beforeEach)(async () => {
      engine = new engine_1.OptimizationEngine({
        enableMultiCloud: true,
      });
      await engine.init();
    });
    (0, globals_1.it)('should track resource utilization across providers', async () => {
      const workloads = [
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
      const utilization = await manager.getUtilization();
      (0, globals_1.expect)(utilization.aws.used.cpu).toBeGreaterThan(0);
      (0, globals_1.expect)(utilization.gcp.used.cpu).toBeGreaterThan(0);
    });
  });
  (0, globals_1.describe)('Integration with Existing Optimization', () => {
    (0, globals_1.beforeEach)(async () => {
      engine = new engine_1.OptimizationEngine({
        enableMultiCloud: true,
      });
      await engine.init();
    });
    (0, globals_1.it)('should continue to support traditional optimization requests', async () => {
      const request = {
        id: 'traditional-1',
        type: 'resource',
        data: {
          items: [
            { id: 'item-1', cpu: 50, memory: 500 },
            { id: 'item-2', cpu: 30, memory: 300 },
          ],
          nodeCapacity: { cpu: 100, memory: 1000 },
        },
      };
      const result = await engine.optimize(request);
      (0, globals_1.expect)(result.success).toBe(true);
      (0, globals_1.expect)(result.requestId).toBe('traditional-1');
    });
  });
});
