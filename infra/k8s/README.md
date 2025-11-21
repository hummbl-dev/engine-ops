# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the Engine-Ops platform.

## Prerequisites

- Kubernetes cluster (v1.20+)
- `kubectl` configured to access your cluster
- Docker image built and available

## Quick Start

### Deploy with kubectl

```bash
# Apply all manifests
kubectl apply -f infra/k8s/

# Verify deployment
kubectl get pods -l app=engine-ops
kubectl get svc engine-ops
kubectl get hpa engine-ops-hpa

# Check logs
kubectl logs -l app=engine-ops --tail=100 -f
```

### Deploy with Helm

```bash
# Install the chart
helm install engine-ops infra/helm/engine-ops

# Verify installation
helm list
kubectl get all -l app.kubernetes.io/name=engine-ops

# Upgrade
helm upgrade engine-ops infra/helm/engine-ops

# Uninstall
helm uninstall engine-ops
```

## Manifests

- **deployment.yaml** - Deployment with 2 replicas, resource limits, health probes
- **service.yaml** - LoadBalancer service exposing port 80
- **configmap.yaml** - Configuration for rate limiting
- **hpa.yaml** - Horizontal Pod Autoscaler (2-10 replicas, 70% CPU target)
- **ingress.yaml** - Ingress for external access with TLS

## Configuration

### Environment Variables

Set via ConfigMap (`configmap.yaml`):
- `RATE_LIMIT_WINDOW_MS` - Rate limit window (default: 900000ms)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)

### Resource Limits

Default limits per pod:
- CPU: 100m request, 500m limit
- Memory: 128Mi request, 512Mi limit

### Autoscaling

HPA configuration:
- Min replicas: 2
- Max replicas: 10
- CPU target: 70%
- Memory target: 80%

## Health Checks

The application exposes health endpoints:
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe
- `/api/v1/health` - General health check

## Accessing the Service

### LoadBalancer

```bash
# Get external IP
kubectl get svc engine-ops

# Access the API
curl http://<EXTERNAL-IP>/api/v1/health
```

### Ingress

Update `ingress.yaml` with your domain and apply:

```bash
kubectl apply -f infra/k8s/ingress.yaml
```

## Scaling

### Manual Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment engine-ops --replicas=5
```

### Autoscaling

HPA automatically scales based on CPU/memory usage. Monitor with:

```bash
kubectl get hpa engine-ops-hpa -w
```

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod -l app=engine-ops
kubectl logs -l app=engine-ops
```

### Service not accessible

```bash
kubectl get svc engine-ops
kubectl describe svc engine-ops
```

### HPA not scaling

```bash
kubectl describe hpa engine-ops-hpa
kubectl top pods -l app=engine-ops
```

## Production Recommendations

1. **Use specific image tags** instead of `latest`
2. **Enable Ingress** with proper TLS certificates
3. **Set resource limits** based on actual usage
4. **Configure persistent storage** if needed
5. **Set up monitoring** (Prometheus, Grafana)
6. **Enable pod disruption budgets** for high availability
