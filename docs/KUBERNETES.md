# Kubernetes Integration Guide

## Overview

Engine-Ops provides intelligent optimization for Kubernetes workloads, helping you reduce costs and improve resource utilization.

## Quick Start

### 1. Deploy Engine-Ops to Your Cluster

```bash
# Using Helm (recommended)
helm repo add engine-ops https://charts.engine-ops.io
helm install engine-ops engine-ops/engine-ops \
  --set ingress.enabled=true \
  --set ingress.host=engine-ops.yourdomain.com

# Or using kubectl
kubectl apply -f https://raw.githubusercontent.com/hummbl-dev/engine-ops/main/infra/k8s/
```

### 2. Configure Authentication

Create an API key secret:

```bash
kubectl create secret generic engine-ops-api-key \
  --from-literal=api-key=your-secure-api-key
```

### 3. Test the Connection

```bash
# Port forward to access locally
kubectl port-forward svc/engine-ops 3000:80

# Test the API
curl -H "X-API-Key: your-secure-api-key" \
  http://localhost:3000/api/v1/health
```

## Use Cases

### Use Case 1: Pod Placement Optimization

Optimize pod placement across nodes to minimize resource waste.

**Example Request:**

```bash
curl -X POST http://localhost:3000/api/v1/optimize \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "pod-placement-001",
    "type": "resource",
    "data": {
      "items": [
        {"id": "nginx-pod", "cpu": 500, "memory": 1024},
        {"id": "redis-pod", "cpu": 250, "memory": 512},
        {"id": "postgres-pod", "cpu": 1000, "memory": 2048}
      ],
      "nodeCapacity": {"cpu": 2000, "memory": 4096}
    }
  }'
```

**Response:**

```json
{
  "requestId": "pod-placement-001",
  "success": true,
  "result": {
    "placements": [
      { "pod": "nginx-pod", "node": "node-1" },
      { "pod": "redis-pod", "node": "node-1" },
      { "pod": "postgres-pod", "node": "node-2" }
    ],
    "utilization": 0.85
  },
  "metrics": {
    "durationMs": 45,
    "score": 0.92
  }
}
```

### Use Case 2: Cost-Aware Scheduling

Schedule workloads considering cost constraints (spot vs on-demand).

```typescript
import { EngineOpsClient } from 'engine-ops';

const client = new EngineOpsClient('http://engine-ops.default.svc.cluster.local');

const result = await client.optimize({
  id: 'cost-optimization-001',
  type: 'scheduling',
  data: {
    tasks: [
      { id: 'batch-job-1', priority: 'low', duration: 3600 },
      { id: 'api-server', priority: 'high', duration: -1 },
    ],
    nodes: [
      { id: 'spot-1', cost: 0.05, reliability: 0.8 },
      { id: 'ondemand-1', cost: 0.15, reliability: 0.99 },
    ],
  },
});
```

### Use Case 3: Real-Time Optimization with WebSocket

Monitor optimization progress in real-time.

```typescript
import io from 'socket.io-client';

const socket = io('http://engine-ops.default.svc.cluster.local');

// Subscribe to optimization updates
socket.emit('subscribe', 'optimization-123');

socket.on('optimization:progress', (data) => {
  console.log(`Progress: ${data.progress}%`);
});

socket.on('optimization:complete', (result) => {
  console.log('Optimization complete:', result);
});
```

## Kubernetes-Specific Features

### Resource Requests/Limits Optimization

Engine-Ops can analyze your pod metrics and recommend optimal resource requests/limits:

```yaml
# examples/kubernetes/resource-optimizer.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: optimization-config
data:
  target-utilization: '0.8'
  optimization-interval: '300'
---
apiVersion: batch/v1
kind: CronJob
metadata:
  name: resource-optimizer
spec:
  schedule: '0 */6 * * *' # Every 6 hours
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: optimizer
              image: hummbl/engine-ops-cli:latest
              env:
                - name: ENGINE_OPS_URL
                  value: 'http://engine-ops.default.svc.cluster.local'
                - name: API_KEY
                  valueFrom:
                    secretKeyRef:
                      name: engine-ops-api-key
                      key: api-key
              command:
                - /bin/sh
                - -c
                - |
                  engine-ops optimize \
                    --type resource \
                    --namespace default \
                    --apply-recommendations
```

### Namespace-Level Cost Analysis

Track costs per namespace:

```bash
# Get cost breakdown
curl http://localhost:3000/api/v1/cost/analysis?namespace=production

# Response
{
  "namespace": "production",
  "totalCost": 1250.50,
  "breakdown": {
    "compute": 800.00,
    "storage": 350.50,
    "network": 100.00
  },
  "recommendations": [
    {
      "type": "right-sizing",
      "deployment": "api-server",
      "currentCost": 200,
      "optimizedCost": 150,
      "savings": 50
    }
  ]
}
```

## Integration Patterns

### Pattern 1: Admission Webhook

Automatically optimize pod specs before admission:

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: MutatingWebhookConfiguration
metadata:
  name: engine-ops-optimizer
webhooks:
  - name: optimize.engine-ops.io
    clientConfig:
      service:
        name: engine-ops
        namespace: default
        path: '/api/v1/webhook/mutate'
    rules:
      - operations: ['CREATE']
        apiGroups: ['']
        apiVersions: ['v1']
        resources: ['pods']
```

### Pattern 2: Custom Controller

Build a custom controller that uses Engine-Ops:

```typescript
import * as k8s from '@kubernetes/client-node';
import { EngineOpsClient } from 'engine-ops';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
const engineOps = new EngineOpsClient('http://engine-ops.default.svc.cluster.local');

// Watch deployments
const watch = new k8s.Watch(kc);
watch.watch(
  '/apis/apps/v1/deployments',
  {},
  async (type, deployment) => {
    if (type === 'ADDED' || type === 'MODIFIED') {
      // Optimize deployment
      const result = await engineOps.optimize({
        id: `deploy-${deployment.metadata.name}`,
        type: 'resource',
        data: {
          deployment: deployment.spec,
        },
      });

      // Apply recommendations
      if (result.success) {
        console.log('Optimization recommendations:', result.result);
      }
    }
  },
  (err) => console.error(err),
);
```

### Pattern 3: Scheduled Optimization

Run optimization on a schedule:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-optimizer
spec:
  schedule: '0 2 * * *' # 2 AM daily
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: engine-ops-optimizer
          containers:
            - name: optimizer
              image: curlimages/curl:latest
              command:
                - /bin/sh
                - -c
                - |
                  curl -X POST http://engine-ops.default.svc.cluster.local/api/v1/optimize \
                    -H "X-API-Key: $API_KEY" \
                    -H "Content-Type: application/json" \
                    -d @/config/optimization-request.json
```

## Monitoring & Observability

### Prometheus Integration

Engine-Ops exposes Prometheus metrics:

```yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: engine-ops
spec:
  selector:
    matchLabels:
      app: engine-ops
  endpoints:
    - port: http
      path: /metrics
      interval: 30s
```

### Grafana Dashboard

Import the pre-built Grafana dashboard:

```bash
kubectl apply -f https://raw.githubusercontent.com/hummbl-dev/engine-ops/main/monitoring/grafana-dashboard.json
```

## Best Practices

1. **Start Small**: Begin with non-production namespaces
2. **Monitor Impact**: Track metrics before and after optimization
3. **Gradual Rollout**: Apply recommendations incrementally
4. **Set Budgets**: Use cost constraints in optimization requests
5. **Regular Reviews**: Schedule weekly optimization reviews

## Troubleshooting

### Issue: Optimization takes too long

**Solution**: Increase timeout or use async optimization:

```typescript
const result = await client.optimize({
  id: 'large-optimization',
  type: 'genetic',
  data: {
    /* ... */
  },
  timeout: 60000, // 60 seconds
});
```

### Issue: Recommendations not applied

**Solution**: Check RBAC permissions:

```bash
kubectl auth can-i update deployments --as=system:serviceaccount:default:engine-ops
```

## Next Steps

- Explore the [API Documentation](http://localhost:3000/api-docs)
- Read the [Architecture Guide](../ARCHITECTURE.md)
- Join the [Community](https://github.com/hummbl-dev/engine-ops/discussions)

## Support

- GitHub Issues: https://github.com/hummbl-dev/engine-ops/issues
- Email: hummbldev@gmail.com
- Slack: #engine-ops on CNCF Slack
