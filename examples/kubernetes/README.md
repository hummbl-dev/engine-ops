# Kubernetes Examples

This directory contains examples for integrating Engine-Ops with Kubernetes.

## Files

- **pod-optimizer.yaml**: CronJob that optimizes pod placement every 30 minutes
- **cost-report.ts**: TypeScript script for cost analysis and reporting
- **self-healing-demo.yaml**: Demo job showcasing automated health checks and remediation

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

### 3. Test Self-Healing Infrastructure

```bash
# Deploy the demo job
kubectl apply -f self-healing-demo.yaml

# Watch the demo output
kubectl logs -f job/self-healing-demo

# Test automatic pod replacement
kubectl delete pod -l app=engine-ops --force
kubectl get pods -l app=engine-ops -w

# Check remediation logs
kubectl logs -l app=engine-ops-health-monitor
curl http://<ENGINE-OPS-URL>/api/v1/health/remediation
```

## Self-Healing Features

The self-healing infrastructure includes:

1. **Automated Health Checks**: Continuous monitoring of CPU, memory, and uptime
2. **Smart Probes**: Liveness, readiness, and startup probes detect failures quickly
3. **Automatic Replacement**: Kubernetes automatically replaces unhealthy pods
4. **Remediation Logging**: All remedial actions are logged for auditability
5. **Health Monitor**: Active pod monitoring with event tracking

For full deployment instructions, see `infra/k8s/health-monitor.yaml` and `infra/k8s/pdb.yaml`.

## Documentation

See [KUBERNETES.md](../../docs/KUBERNETES.md) for comprehensive integration guide.
