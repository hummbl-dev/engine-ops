'use strict';
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
Object.defineProperty(exports, '__esModule', { value: true });
exports.EdgeProvider = void 0;
/**
 * Edge cluster provider adapter for edge computing locations
 */
class EdgeProvider {
  config = {};
  nodes = new Map();
  regions = [
    {
      id: 'edge-us-ny',
      provider: 'edge',
      name: 'Edge US New York',
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      id: 'edge-eu-london',
      provider: 'edge',
      name: 'Edge EU London',
      latitude: 51.5074,
      longitude: -0.1278,
    },
    {
      id: 'edge-asia-tokyo',
      provider: 'edge',
      name: 'Edge Asia Tokyo',
      latitude: 35.6762,
      longitude: 139.6503,
    },
  ];
  getProvider() {
    return 'edge';
  }
  async initialize(config) {
    this.config = config;
    // In a real implementation, this would connect to edge cluster APIs
    this.initializeMockNodes();
  }
  initializeMockNodes() {
    for (const region of this.regions) {
      // Edge nodes typically have smaller capacity
      for (let i = 0; i < 3; i++) {
        const nodeId = `edge-${region.id}-node-${i}`;
        this.nodes.set(nodeId, {
          id: nodeId,
          provider: 'edge',
          region: region.id,
          capacity: { cpu: 4000, memory: 8000, storage: 100 },
          utilization: { cpu: 0, memory: 0, storage: 0 },
          status: 'available',
          labels: {
            provider: 'edge',
            region: region.id,
            type: 'edge',
            latency: 'low',
          },
        });
      }
    }
  }
  async listNodes(region) {
    const nodes = Array.from(this.nodes.values());
    if (region) {
      return nodes.filter((node) => node.region === region);
    }
    return nodes;
  }
  async getNode(nodeId) {
    return this.nodes.get(nodeId) || null;
  }
  async deployWorkload(nodeId, workload) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }
    const availableCpu = node.capacity.cpu - node.utilization.cpu;
    const availableMemory = node.capacity.memory - node.utilization.memory;
    if (availableCpu < workload.resources.cpu || availableMemory < workload.resources.memory) {
      return false;
    }
    node.utilization.cpu += workload.resources.cpu;
    node.utilization.memory += workload.resources.memory;
    node.utilization.storage = (node.utilization.storage || 0) + (workload.resources.storage || 0);
    const utilizationPercent = Math.max(
      node.utilization.cpu / node.capacity.cpu,
      node.utilization.memory / node.capacity.memory,
    );
    if (utilizationPercent > 0.8) {
      node.status = 'busy';
    }
    return true;
  }
  async removeWorkload(nodeId, _workloadId) {
    const node = this.nodes.get(nodeId);
    if (!node) {
      return false;
    }
    node.status = 'available';
    return true;
  }
  async getRegions() {
    return this.regions;
  }
  async healthCheck() {
    return true;
  }
}
exports.EdgeProvider = EdgeProvider;
