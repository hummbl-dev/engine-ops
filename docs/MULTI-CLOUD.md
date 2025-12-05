<!--
  Copyright (c) 2025, HUMMBL, LLC

  Licensed under the Business Source License 1.1 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://mariadb.com/bsl11/

  Change Date: 2029-01-01
  Change License: Apache License, Version 2.0
-->

# Multi-Cloud and Edge Compute Support

Engine-Ops provides comprehensive support for multi-cloud deployments across AWS, GCP, Azure, and edge computing locations. This enables organizations to optimize workload placement across multiple cloud providers with intelligent geo-sharding and federated scheduling.

## Overview

The multi-cloud architecture consists of:

- **Cloud Provider Adapters**: Abstracted interfaces for AWS, GCP, Azure, and Edge clusters
- **Resource Manager**: Centralized management of resources across all providers
- **Federated Scheduler**: Intelligent workload placement considering multiple factors
- **Geo-Sharding**: Automatic distribution of workloads based on geographical regions

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              Optimization Engine                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │       Multi-Cloud Resource Manager                 │     │
│  └─────┬──────────┬──────────┬──────────┬────────────┘     │
│        │          │          │          │                    │
│   ┌────▼────┐┌───▼────┐┌───▼────┐┌────▼─────┐             │
│   │   AWS   ││  GCP   ││ Azure  ││   Edge   │             │
│   │Provider ││Provider││Provider││ Provider │             │
│   └────┬────┘└───┬────┘└───┬────┘└────┬─────┘             │
└────────┼─────────┼─────────┼──────────┼───────────────────┘
         │         │         │          │
    ┌────▼────┐┌──▼────┐┌──▼────┐┌────▼────┐
    │AWS Nodes││GCP    ││Azure  ││Edge     │
    │         ││Nodes  ││Nodes  ││Clusters │
    └─────────┘└───────┘└───────┘└─────────┘
```

## Supported Cloud Providers

### AWS (Amazon Web Services)

- **Regions**: us-east-1, us-west-2, eu-west-1, ap-southeast-1
- **Features**: Multiple availability zones, high capacity nodes
- **Use Case**: Large-scale deployments, enterprise workloads

### GCP (Google Cloud Platform)

- **Regions**: us-central1, europe-west1, asia-east1
- **Features**: Global load balancing, advanced networking
- **Use Case**: Data analytics, machine learning workloads

### Azure (Microsoft Azure)

- **Regions**: eastus, westeurope, southeastasia
- **Features**: Hybrid cloud capabilities, enterprise integration
- **Use Case**: Enterprise applications, hybrid deployments

### Edge Clusters

- **Locations**: edge-us-ny, edge-eu-london, edge-asia-tokyo
- **Features**: Low latency, smaller capacity, distributed computing
- **Use Case**: IoT, real-time processing, latency-sensitive applications

## Getting Started

### Basic Setup

```typescript
import { OptimizationEngine } from '@hummbl/engine-ops';

// Initialize engine with multi-cloud support
const engine = new OptimizationEngine({
  enableMultiCloud: true,
  cloudProviders: ['aws', 'gcp', 'azure', 'edge'], // All providers
  verbose: true,
});

await engine.init();
```

### Selective Provider Configuration

```typescript
// Use only AWS and GCP
const engine = new OptimizationEngine({
  enableMultiCloud: true,
  cloudProviders: ['aws', 'gcp'],
});

await engine.init();
```

## Scheduling Workloads

### Simple Workload Scheduling

```typescript
import type { Workload } from '@hummbl/engine-ops';

const workload: Workload = {
  id: 'my-app-1',
  resources: {
    cpu: 2000, // millicores
    memory: 4000, // MB
    storage: 100, // GB (optional)
  },
};

const result = await engine.scheduleMultiCloudWorkloads([workload]);
console.log(`Scheduled to: ${result.result.placements[0].node.provider}`);
```

### Workload with Provider Preferences

```typescript
const workload: Workload = {
  id: 'aws-preferred',
  resources: {
    cpu: 4000,
    memory: 8000,
  },
  constraints: {
    providerPreferences: ['aws', 'gcp'], // Prefer AWS, fallback to GCP
  },
};
```

### Workload with Region Preferences

```typescript
const workload: Workload = {
  id: 'eu-workload',
  resources: {
    cpu: 2000,
    memory: 4000,
  },
  preferredRegions: ['eu-west-1', 'europe-west1', 'westeurope'],
};
```

### Low-Latency Edge Workloads

```typescript
const workload: Workload = {
  id: 'realtime-app',
  resources: {
    cpu: 1000,
    memory: 2000,
  },
  constraints: {
    maxLatencyMs: 30, // Automatically routes to edge
  },
};
```

## Geo-Sharding

Geo-sharding automatically distributes workloads across geographical regions for optimal performance and compliance.

### Enable Geo-Sharding (Default)

```typescript
const workloads: Workload[] = [
  {
    id: 'us-service',
    resources: { cpu: 2000, memory: 4000 },
    preferredRegions: ['us-east-1'],
  },
  {
    id: 'eu-service',
    resources: { cpu: 2000, memory: 4000 },
    preferredRegions: ['eu-west-1'],
  },
  {
    id: 'asia-service',
    resources: { cpu: 2000, memory: 4000 },
    preferredRegions: ['ap-southeast-1'],
  },
];

// Geo-sharding enabled by default
const result = await engine.scheduleMultiCloudWorkloads(workloads, true);
```

### Disable Geo-Sharding

```typescript
// Schedule without geographical distribution
const result = await engine.scheduleMultiCloudWorkloads(workloads, false);
```

## Advanced Features

### Data Residency Requirements

```typescript
const workload: Workload = {
  id: 'gdpr-compliant',
  resources: { cpu: 2000, memory: 4000 },
  constraints: {
    dataResidency: ['eu-west-1', 'europe-west1', 'westeurope'],
  },
};
```

### Required Node Labels

```typescript
const workload: Workload = {
  id: 'gpu-workload',
  resources: { cpu: 4000, memory: 8000, gpu: 1 },
  requiredLabels: {
    gpu: 'true',
    'gpu-type': 'nvidia-t4',
  },
};
```

### Resource Utilization Monitoring

```typescript
const manager = engine.getMultiCloudManager();
const utilization = await manager.getUtilization();

console.log('AWS:', utilization.aws);
console.log('GCP:', utilization.gcp);
console.log('Azure:', utilization.azure);
console.log('Edge:', utilization.edge);

// Output:
// {
//   total: { cpu: 32000, memory: 64000, storage: 1000 },
//   used: { cpu: 8000, memory: 16000, storage: 200 }
// }
```

### List Available Nodes

```typescript
const manager = engine.getMultiCloudManager();

// List all nodes
const allNodes = await manager.listAllNodes();

// Filter by provider
const awsNodes = await manager.listAllNodes({ provider: 'aws' });

// Filter by region
const usEastNodes = await manager.listAllNodes({ region: 'us-east-1' });
```

## Scheduling Algorithm

The multi-cloud scheduler uses an intelligent scoring system:

### Scoring Factors

1. **Resource Availability (40%)**: Available CPU and memory
2. **Load Balancing (30%)**: Prefer less-loaded nodes
3. **Region Preference (20%)**: Match preferred regions
4. **Provider Preference (10%)**: Match preferred providers
5. **Latency Optimization (Bonus)**: Prefer edge for low-latency workloads

### Example Placement Decision

```typescript
const result = await manager.scheduleWorkload(workload);

console.log(`Workload: ${result.workloadId}`);
console.log(`Placed on: ${result.node.provider} - ${result.node.region}`);
console.log(`Score: ${result.score}`);
console.log(`Reason: ${result.reason}`);

// Output:
// Workload: my-app-1
// Placed on: aws - us-east-1
// Score: 0.85
// Reason: preferred region, best available resources
```

## Best Practices

### 1. Region Selection

```typescript
// ✅ Good: Specify multiple regions for redundancy
preferredRegions: ['us-east-1', 'us-west-2', 'eu-west-1'];

// ❌ Avoid: Single region without fallback
preferredRegions: ['us-east-1'];
```

### 2. Resource Requirements

```typescript
// ✅ Good: Realistic resource requirements
resources: { cpu: 2000, memory: 4000 }

// ❌ Avoid: Over-provisioning
resources: { cpu: 16000, memory: 64000 }
```

### 3. Provider Preferences

```typescript
// ✅ Good: Provide fallback options
providerPreferences: ['aws', 'gcp', 'azure'];

// ❌ Avoid: Too restrictive
providerPreferences: ['aws']; // May fail if AWS unavailable
```

### 4. Edge Usage

```typescript
// ✅ Good: Use edge for latency-sensitive workloads
constraints: {
  maxLatencyMs: 50;
}

// ❌ Avoid: Using edge for large-scale batch processing
```

## Monitoring and Observability

### Health Checks

```typescript
const providers = manager.getProviders();

for (const provider of providers) {
  const healthy = await provider.healthCheck();
  console.log(`${provider.getProvider()}: ${healthy ? 'healthy' : 'unhealthy'}`);
}
```

### Node Status

```typescript
const node = await provider.getNode('aws-us-east-1-node-0');

console.log(`Status: ${node.status}`); // available, busy, unavailable
console.log(`Utilization: ${node.utilization.cpu}/${node.capacity.cpu} CPU`);
console.log(`Utilization: ${node.utilization.memory}/${node.capacity.memory} MB`);
```

## Integration with Existing Systems

### Backward Compatibility

The multi-cloud features are optional. Existing code continues to work:

```typescript
const engine = new OptimizationEngine(); // Multi-cloud disabled by default

await engine.init();

// Traditional optimization still works
const result = await engine.optimize({
    id: 'traditional-request',
    type: 'resource',
    data: { items: [...], nodeCapacity: {...} }
});
```

### Hybrid Usage

```typescript
const engine = new OptimizationEngine({
    enableMultiCloud: true
});

await engine.init();

// Use multi-cloud scheduling
await engine.scheduleMultiCloudWorkloads([...]);

// Still use traditional optimization
await engine.optimize({...});
```

## Performance Considerations

### Caching

The engine uses LRU caching for optimization results:

- Cache size: 100 entries
- TTL: 5 minutes
- Automatic invalidation

### Concurrency

```typescript
const engine = new OptimizationEngine({
  enableMultiCloud: true,
  maxConcurrentTasks: 10, // Adjust based on workload
});
```

### Timeouts

```typescript
const engine = new OptimizationEngine({
  enableMultiCloud: true,
  timeoutMs: 30000, // 30 seconds
});
```

## Troubleshooting

### No Suitable Nodes Found

**Problem**: `scheduleWorkload` returns `null`

**Solutions**:

1. Check resource requirements are realistic
2. Verify provider/region preferences are not too restrictive
3. Check node availability with `listAllNodes()`
4. Ensure providers are properly initialized

### Scheduling Taking Too Long

**Problem**: Scheduling operations are slow

**Solutions**:

1. Reduce number of simultaneous workloads
2. Disable geo-sharding if not needed
3. Increase `timeoutMs` configuration
4. Use specific region/provider filters

### Provider Connection Issues

**Problem**: Provider health checks failing

**Solutions**:

1. Verify network connectivity
2. Check provider credentials (in production)
3. Verify provider regions are correct
4. Review provider initialization logs

## Migration Guide

### From Single-Cloud to Multi-Cloud

```typescript
// Before: Single provider
const engine = new OptimizationEngine();

// After: Multi-cloud
const engine = new OptimizationEngine({
  enableMultiCloud: true,
  cloudProviders: ['aws', 'gcp'], // Start with two providers
});
```

### Gradual Rollout

1. **Phase 1**: Enable multi-cloud with single provider
2. **Phase 2**: Add second provider for redundancy
3. **Phase 3**: Enable geo-sharding
4. **Phase 4**: Add all providers and optimize placement

## API Reference

See the TypeDoc generated documentation for complete API details:

```bash
npm run docs
```

Key interfaces:

- `ICloudProvider` - Cloud provider adapter interface
- `IResourceManager` - Multi-cloud resource manager interface
- `Workload` - Workload specification
- `PlacementResult` - Scheduling result
- `CloudNode` - Node representation

## Examples

See the `examples/` directory for complete working examples:

- `examples/multi-cloud/basic-scheduling.ts`
- `examples/multi-cloud/geo-sharding.ts`
- `examples/multi-cloud/edge-computing.ts`
- `examples/multi-cloud/hybrid-deployment.ts`

## Future Enhancements

Planned features:

- Dynamic provider discovery
- Cost optimization across providers
- Multi-region replication
- Automatic failover
- Machine learning-based placement
- Custom provider implementations

## Support

For questions or issues:

- GitHub Issues: https://github.com/hummbl-dev/engine-ops/issues
- Email: hummbldev@gmail.com
- Documentation: https://github.com/hummbl-dev/engine-ops/docs
