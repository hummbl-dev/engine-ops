# Blue-Green Deployment for Engine-Ops

This directory contains Kubernetes manifests and automation scripts for zero-downtime blue-green deployments.

## Overview

Blue-green deployment is a release pattern that reduces downtime and risk by running two identical production environments called Blue and Green. At any time, only one environment serves production traffic while the other is idle or used for testing.

### Benefits

- **Zero downtime**: Traffic switches instantaneously between environments
- **Quick rollback**: Instant rollback by switching traffic back
- **Testing in production**: Test new version in production-like environment before switching
- **Risk mitigation**: Issues in new version don't affect current production

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                (engine-ops-active)                       │
└────────────────────┬────────────────────────────────────┘
                     │ (switches between blue/green)
          ┌──────────┴──────────┐
          │                     │
    ┌─────▼─────┐         ┌────▼──────┐
    │   Blue    │         │   Green   │
    │ Deployment│         │ Deployment│
    │  (v1.0)   │         │  (v1.1)   │
    └───────────┘         └───────────┘
     Active/Inactive      Inactive/Active
```

## Files

- **deployment-blue.yaml** - Blue environment deployment
- **deployment-green.yaml** - Green environment deployment
- **service-blue-green.yaml** - Services for routing traffic
  - `engine-ops-active` - LoadBalancer pointing to active environment
  - `engine-ops-preview` - ClusterIP for testing inactive environment
  - `engine-ops-blue` - Direct access to blue environment
  - `engine-ops-green` - Direct access to green environment

## Prerequisites

- Kubernetes cluster (v1.20+)
- `kubectl` configured
- Docker images built and available
- ConfigMap `engine-ops-config` created

## Quick Start

### 1. Initial Deployment

Deploy both blue and green environments:

```bash
# Create ConfigMap if not exists
kubectl apply -f ../configmap.yaml

# Deploy both environments
kubectl apply -f deployment-blue.yaml
kubectl apply -f deployment-green.yaml

# Create services
kubectl apply -f service-blue-green.yaml
```

Initial state: Blue is active, Green is inactive

### 2. Deploy New Version

Use the automated script:

```bash
cd ../../scripts
./blue-green-deploy.sh v0.3.0
```

Or manually:

```bash
# Determine inactive environment (if blue is active, deploy to green)
INACTIVE="green"

# Update image
docker build -t engine-ops:v0.3.0 -f ../../Dockerfile ../../../
docker tag engine-ops:v0.3.0 engine-ops:green

# Deploy to inactive environment
kubectl set image deployment/engine-ops-${INACTIVE} \
    engine-ops=engine-ops:${INACTIVE}

# Wait for rollout
kubectl rollout status deployment/engine-ops-${INACTIVE}

# Test the preview environment
kubectl port-forward service/engine-ops-preview 8080:80
curl http://localhost:8080/api/v1/health

# Switch traffic (after validation)
kubectl patch service engine-ops-active \
    -p '{"spec":{"selector":{"version":"green"}}}'

# Update preview to point to blue
kubectl patch service engine-ops-preview \
    -p '{"spec":{"selector":{"version":"blue"}}}'
```

### 3. Rollback

If issues are detected:

```bash
cd ../../scripts
./rollback.sh
```

Or manually switch traffic back:

```bash
kubectl patch service engine-ops-active \
    -p '{"spec":{"selector":{"version":"blue"}}}'
```

## Automated Deployment Script

The `blue-green-deploy.sh` script automates the entire process:

```bash
# Basic usage
./infra/scripts/blue-green-deploy.sh v0.3.0

# With custom namespace
NAMESPACE=production ./infra/scripts/blue-green-deploy.sh v0.3.0

# With custom health check settings
HEALTH_CHECK_RETRIES=15 ./infra/scripts/blue-green-deploy.sh v0.3.0
```

### Script Features

1. **Automatic detection** of active/inactive environments
2. **Docker image** building and tagging
3. **Deployment** to inactive environment
4. **Health checks** with configurable retries
5. **Smoke tests** on preview service
6. **Interactive confirmation** before traffic switch
7. **Automatic rollback** on health check failures
8. **Post-deployment monitoring**

### Environment Variables

- `NAMESPACE` - Kubernetes namespace (default: default)
- `SMOKE_TEST_TIMEOUT` - Timeout for smoke tests in seconds (default: 60)
- `HEALTH_CHECK_RETRIES` - Number of health check attempts (default: 10)
- `HEALTH_CHECK_INTERVAL` - Seconds between health checks (default: 5)

## Deployment Process

### Step-by-Step Flow

1. **Determine Active Environment**
   - Check which environment (blue/green) is currently serving traffic
   - Target the inactive environment for new deployment

2. **Build and Deploy**
   - Build Docker image with new version
   - Tag image for target environment
   - Update deployment with new image
   - Wait for rollout completion

3. **Health Verification**
   - Wait for all pods to be ready
   - Run liveness and readiness probes
   - Execute health checks on preview service

4. **Smoke Testing**
   - Test critical API endpoints
   - Verify metrics collection
   - Validate application functionality

5. **Traffic Switch**
   - Manual confirmation required
   - Update active service selector
   - Switch preview to old active
   - Instant traffic cutover

6. **Post-Deployment**
   - Monitor new active environment
   - Keep old environment running for quick rollback
   - After verification, optionally scale down old environment

## Health Checks

### Kubernetes Probes

Each deployment includes three types of probes:

```yaml
startupProbe:
  # Allows up to 60 seconds for application startup
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 12

livenessProbe:
  # Ensures container is running
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  # Ensures container can receive traffic
  initialDelaySeconds: 10
  periodSeconds: 5
  failureThreshold: 3
  successThreshold: 2
```

### Custom Health Checks

The deployment script performs additional checks:

- API availability: `GET /api/v1/health`
- Readiness: `GET /api/v1/health/ready`
- Metrics: `GET /metrics`

## Rollback Strategy

### Immediate Rollback

Switch traffic back to previous environment:

```bash
# Automated
./infra/scripts/rollback.sh

# Manual
kubectl patch service engine-ops-active \
    -p '{"spec":{"selector":{"version":"<previous-version>"}}}'
```

### Characteristics

- **Instant**: Traffic switches immediately
- **No data loss**: Both environments share same backend
- **Safe**: Old environment unchanged during deployment
- **Testing**: Can re-test new environment after rollback

## Best Practices

### 1. Database Migrations

For database schema changes:

```bash
# Run migrations before deployment
cd ../../..
npm run migrate

# Then deploy new version
cd infra/scripts
./blue-green-deploy.sh v0.3.0
```

### 2. Backward Compatibility

Ensure new version is backward compatible:

- Database changes are additive
- API changes maintain v1 compatibility
- Use feature flags for breaking changes

### 3. Monitoring

Monitor both environments:

```bash
# Active environment
kubectl logs -f -l app=engine-ops,version=blue

# All pods
kubectl get pods -l app=engine-ops -w
```

### 4. Cleanup

After successful deployment and verification:

```bash
# Scale down old environment
kubectl scale deployment/engine-ops-blue --replicas=0

# Or keep it warm for quick rollback
# (keep 1 replica running)
kubectl scale deployment/engine-ops-blue --replicas=1
```

### 5. Resource Management

Consider resource implications:

- Running two full environments requires 2x resources during deployment
- Use smaller replica counts in development
- Consider using canary deployments for resource-constrained clusters

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod -l app=engine-ops,version=green
kubectl logs -l app=engine-ops,version=green
```

### Health Check Failures

```bash
# Check pod status
kubectl get pods -l app=engine-ops,version=green

# Test health endpoint directly
kubectl port-forward service/engine-ops-green 8080:80
curl -v http://localhost:8080/api/v1/health/ready
```

### Traffic Not Switching

```bash
# Verify service configuration
kubectl describe service engine-ops-active

# Check service selector
kubectl get service engine-ops-active -o yaml | grep -A 2 selector
```

### Image Pull Errors

```bash
# Check image availability
docker images | grep engine-ops

# Verify image pull policy
kubectl get deployment engine-ops-green -o yaml | grep imagePullPolicy
```

## Advanced Usage

### Canary Testing

Test with a subset of users before full switch:

```bash
# Deploy to green
kubectl apply -f deployment-green.yaml

# Create canary service with weight distribution
# (requires service mesh like Istio or traffic splitting capability)
```

### Automated Testing

Integrate with CI/CD:

```bash
# In CI/CD pipeline
- name: Deploy to Green
  run: |
    ./infra/scripts/blue-green-deploy.sh ${{ github.sha }}

- name: Run Integration Tests
  run: |
    kubectl port-forward service/engine-ops-preview 8080:80 &
    npm run test:integration

- name: Switch Traffic
  run: |
    # Auto-switch if tests pass
    echo "yes" | ./infra/scripts/blue-green-deploy.sh ${{ github.sha }}
```

### Multi-Region Deployment

For global deployments:

```bash
# Deploy to each region
for region in us-east us-west eu-west; do
    kubectl config use-context $region
    NAMESPACE=production ./infra/scripts/blue-green-deploy.sh v0.3.0
done
```

## Comparison with Rolling Updates

| Feature    | Blue-Green           | Rolling Update         |
| ---------- | -------------------- | ---------------------- |
| Downtime   | Zero                 | Near-zero              |
| Resources  | 2x during deployment | 1.5x during deployment |
| Rollback   | Instant              | Gradual                |
| Testing    | Full production test | Progressive testing    |
| Complexity | Higher               | Lower                  |
| Risk       | Lower                | Higher                 |

Use Blue-Green when:

- Zero downtime is critical
- Instant rollback is required
- You can afford 2x resources temporarily
- Testing in production is needed

Use Rolling Update when:

- Resources are constrained
- Gradual rollout is acceptable
- Simpler setup is preferred

## See Also

- [Rolling Updates](../README.md#rolling-updates)
- [Helm Deployments](../../helm/engine-ops/README.md)
- [Migration Guide](../../../docs/migrations.md)
- [CI/CD Integration](../../../docs/cicd.md)
