# Production Deployment Guide

## Prerequisites

- Kubernetes cluster (local or cloud)
- `kubectl` configured and connected to your cluster
- Docker installed
- Python 3.13+

## Quick Start

### Option 1: Local Deployment (Colima)

```bash
# 1. Start Colima
colima start --kubernetes

# 2. Deploy using helper script
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# 3. Verify deployment
kubectl get pods -l app=sovereign-stack
kubectl get svc sovereign-stack-lb
```

### Option 2: Manual Deployment

```bash
# 1. Build Docker image
docker build -t sovereign-stack:latest .

# 2. Apply K8s manifests
kubectl apply -f infra/k8s/sovereign-stack-deployment.yaml

# 3. Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app=sovereign-stack --timeout=300s
```

## Configuration

### Environment Variables

Set these in your K8s deployment or `.env` file:

- `FEDERATION_MODE`: Enable federated memory (`enabled` | `disabled`)
- `POD_NAME`: Auto-set by K8s, used for federation identity
- `GEMINI_API_KEY`: Your Gemini API key (for LLM calls)

### Secrets Management

```bash
# Create secret for API keys
kubectl create secret generic sovereign-secrets \
  --from-literal=gemini-api-key=YOUR_API_KEY

# Reference in deployment
# env:
#   - name: GEMINI_API_KEY
#     valueFrom:
#       secretKeyRef:
#         name: sovereign-secrets
#         key: gemini-api-key
```

## Pre-Deployment Checklist

- [ ] All tests passing locally
- [ ] Docker image built and tagged
- [ ] K8s cluster accessible (`kubectl cluster-info`)
- [ ] Persistent volumes provisioned (for ChromaDB)
- [ ] Secrets configured (if using external APIs)
- [ ] Resource limits set appropriately

## Post-Deployment Verification

```bash
# 1. Check pod status
kubectl get pods -l app=sovereign-stack
# Expected: 3/3 pods RUNNING

# 2. Check logs
kubectl logs -l app=sovereign-stack --tail=50

# 3. Health check
kubectl port-forward svc/sovereign-stack-lb 8000:8000
curl http://localhost:8000/health
# Expected: {"status": "healthy"}

# 4. SovereignOps TUI
python sovereign_ops.py --api-url http://localhost:8000
```

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod -l app=sovereign-stack

# Common issues:
# - Image pull errors: Verify image tag
# - Resource limits: Check node capacity
# - PVC not bound: Verify storage class
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -l app=sovereign-stack

# Adjust memory limits in deployment.yaml
# resources:
#   limits:
#     memory: "2Gi"
#   requests:
#     memory: "1Gi"
```

### Federated Sync Not Working

```bash
# Check federated-sync sidecar logs
kubectl logs -l app=sovereign-stack -c federated-sync

# Verify POD_NAME is set correctly
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
```

## Rollback Procedure

```bash
# 1. Get previous deployment
kubectl rollout history deployment/sovereign-stack

# 2. Rollback to previous version
kubectl rollout undo deployment/sovereign-stack

# 3. Verify rollback
kubectl rollout status deployment/sovereign-stack
```

## Monitoring

### Prometheus Metrics

Metrics are exposed at `/metrics` endpoint:

```bash
curl http://localhost:8000/metrics
```

### Key Metrics to Monitor

- `agent_execution_duration_seconds`: Agent processing time
- `debate_rounds_total`: Number of debate rounds
- `policy_violations_total`: Constitution violations
- `memory_query_duration_seconds`: ChromaDB query latency
- `federated_sync_success_rate`: Federation health

## Production Best Practices

1. **Resource Limits**: Always set CPU/memory limits
2. **Autoscaling**: Use HPA for traffic spikes
3. **Logging**: Centralize logs (ELK, Splunk)
4. **Backups**: Backup ChromaDB PVC regularly
5. **Secrets**: Use external secrets (Vault, AWS Secrets Manager)

## Next Steps

- Set up Grafana dashboards for metrics
- Configure alerting (PagerDuty, Slack)
- Implement blue-green deployments
- Add canary releases for safer rollouts
