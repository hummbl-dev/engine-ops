# Kubernetes Examples

This directory contains examples for integrating Engine-Ops with Kubernetes.

## Files

- **pod-optimizer.yaml**: CronJob that optimizes pod placement every 30 minutes
- **cost-report.ts**: TypeScript script for cost analysis and reporting

## Quick Start

### 1. Deploy Pod Optimizer

```bash
# Create API key secret
kubectl create secret generic engine-ops-api-key \
  --from-literal=api-key=your-secure-api-key

# Deploy the optimizer
kubectl apply -f pod-optimizer.yaml

# Check the logs
kubectl logs -l app=pod-optimizer
```

### 2. Run Cost Analysis

```bash
# Install dependencies
npm install

# Run the cost report
npx ts-node examples/kubernetes/cost-report.ts
```

## Documentation

See [KUBERNETES.md](../../docs/KUBERNETES.md) for comprehensive integration guide.
