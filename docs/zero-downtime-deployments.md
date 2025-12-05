# Zero-Downtime Deployments Guide

This guide covers zero-downtime deployment strategies for Engine-Ops, including blue-green deployments, rolling updates, database migrations, and API versioning.

## Table of Contents

1. [Overview](#overview)
2. [Blue-Green Deployments](#blue-green-deployments)
3. [Rolling Updates](#rolling-updates)
4. [Database Migrations](#database-migrations)
5. [API Versioning](#api-versioning)
6. [Deployment Best Practices](#deployment-best-practices)
7. [Rollback Strategies](#rollback-strategies)
8. [Troubleshooting](#troubleshooting)

## Overview

Zero-downtime deployments ensure that your application remains available during updates. Engine-Ops supports multiple deployment strategies:

- **Blue-Green Deployments**: Two identical environments with instant traffic switching
- **Rolling Updates**: Gradual pod replacement with configurable parameters
- **Canary Deployments**: Progressive rollout to subset of users
- **Database Migrations**: Schema changes with rollback safety
- **API Versioning**: Backward compatibility during transitions

## Blue-Green Deployments

### What is Blue-Green Deployment?

Blue-green deployment maintains two identical production environments. At any time, only one serves production traffic.

```
Production Traffic → Blue Environment (v1.0) ✓
                     Green Environment (v1.1) ○ (idle/testing)
```

After deploying and testing the green environment:

```
Production Traffic → Blue Environment (v1.0) ○ (standby)
                     Green Environment (v1.1) ✓
```

### Quick Start

#### 1. Deploy Initial Setup

```bash
cd infra/k8s/blue-green

# Apply manifests
kubectl apply -f deployment-blue.yaml
kubectl apply -f deployment-green.yaml
kubectl apply -f service-blue-green.yaml
```

#### 2. Deploy New Version

```bash
cd infra/scripts
./blue-green-deploy.sh v0.3.0
```

The script will:

1. Detect current active environment
2. Build and deploy to inactive environment
3. Run health checks and smoke tests
4. Prompt for confirmation
5. Switch traffic
6. Monitor new active environment

#### 3. Rollback if Needed

```bash
./rollback.sh
```

### Manual Blue-Green Deployment

If you prefer manual control:

```bash
# 1. Determine active environment
ACTIVE=$(kubectl get service engine-ops-active -o jsonpath='{.spec.selector.version}')
INACTIVE=$([ "$ACTIVE" = "blue" ] && echo "green" || echo "blue")

# 2. Deploy to inactive environment
kubectl set image deployment/engine-ops-${INACTIVE} \
    engine-ops=engine-ops:v0.3.0

# 3. Wait for rollout
kubectl rollout status deployment/engine-ops-${INACTIVE}

# 4. Test preview service
kubectl port-forward service/engine-ops-preview 8080:80 &
curl http://localhost:8080/api/v1/health

# 5. Switch traffic
kubectl patch service engine-ops-active \
    -p "{\"spec\":{\"selector\":{\"version\":\"${INACTIVE}\"}}}"
```

### Advantages

- ✅ **Zero downtime**: Instant traffic switch
- ✅ **Quick rollback**: Switch back immediately if issues arise
- ✅ **Production testing**: Test in real environment before switch
- ✅ **Risk mitigation**: Old version remains untouched

### Considerations

- ⚠️ **Resource usage**: Requires 2x resources during deployment
- ⚠️ **Database migrations**: Must be backward compatible
- ⚠️ **Complexity**: More complex than rolling updates

## Rolling Updates

### What are Rolling Updates?

Rolling updates gradually replace pods with new versions, maintaining application availability throughout the process.

```
Start:    [v1.0] [v1.0] [v1.0]
Step 1:   [v1.0] [v1.0] [v1.1]
Step 2:   [v1.0] [v1.1] [v1.1]
End:      [v1.1] [v1.1] [v1.1]
```

### Configuration

The enhanced deployment configuration in `infra/k8s/deployment.yaml` includes:

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1 # Max additional pods during update
    maxUnavailable: 0 # Min pods that must be available
```

Key features:

- **Startup Probe**: 60 seconds grace period for startup
- **Liveness Probe**: Ensures pods are healthy
- **Readiness Probe**: Controls when pod receives traffic
- **PreStop Hook**: 15 second graceful shutdown
- **Pod Anti-Affinity**: Spreads pods across nodes

### Deploying with Rolling Updates

```bash
# Update image
kubectl set image deployment/engine-ops \
    engine-ops=engine-ops:v0.3.0

# Watch rollout
kubectl rollout status deployment/engine-ops

# Check rollout history
kubectl rollout history deployment/engine-ops
```

### Rollback Rolling Update

```bash
# Rollback to previous version
kubectl rollout undo deployment/engine-ops

# Rollback to specific revision
kubectl rollout undo deployment/engine-ops --to-revision=2
```

### Advantages

- ✅ **Resource efficient**: Only requires minimal extra resources
- ✅ **Simple setup**: Built into Kubernetes
- ✅ **Progressive**: Issues affect limited number of pods
- ✅ **Automatic**: Kubernetes handles the process

### Considerations

- ⚠️ **Gradual rollout**: Takes time to complete
- ⚠️ **Mixed versions**: Old and new versions run simultaneously
- ⚠️ **Rollback time**: Not instant like blue-green

## Database Migrations

### Migration Framework

Engine-Ops includes a migration framework for safe database schema changes:

```typescript
import { MigrationManager } from './core/migrations/migration-manager';

const manager = new MigrationManager('./schemas/migrations');

// Register migrations
manager.registerMigration({
  version: '001',
  name: 'add-versioning',
  up: async () => {
    /* migration code */
  },
  down: async () => {
    /* rollback code */
  },
  validateUp: async () => true,
  validateDown: async () => true,
});
```

### Migration CLI

```bash
# Apply all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback

# Rollback multiple migrations
npm run migrate down 3

# Verify migration integrity
npm run migrate verify
```

### Migration Best Practices

#### 1. Make Migrations Backward Compatible

```typescript
// ✅ Good: Additive change
export const migration: Migration = {
  version: '003',
  name: 'add-email-field',
  async up() {
    // Add new optional field
    // Old code can still function
  },
};

// ❌ Bad: Breaking change
export const migration: Migration = {
  version: '003',
  name: 'rename-user-field',
  async up() {
    // Renaming breaks old code immediately
  },
};
```

#### 2. Use Multi-Step Migrations for Breaking Changes

```typescript
// Step 1: Add new field (backward compatible)
export const migration001: Migration = {
  version: '001',
  name: 'add-new-field',
  async up() {
    // Add new field, keep old field
  },
};

// Step 2: Migrate data (after code update)
export const migration002: Migration = {
  version: '002',
  name: 'migrate-data',
  async up() {
    // Copy data from old to new field
  },
};

// Step 3: Remove old field (after all instances updated)
export const migration003: Migration = {
  version: '003',
  name: 'remove-old-field',
  async up() {
    // Safe to remove old field now
  },
};
```

#### 3. Always Provide Rollback

```typescript
export const migration: Migration = {
  version: '004',
  name: 'add-index',
  async up() {
    // Add index for performance
    console.log('Creating index...');
  },
  async down() {
    // Remove index on rollback
    console.log('Dropping index...');
  },
  async validateUp() {
    // Verify index exists
    return true;
  },
};
```

### Pre-Deployment Migration Workflow

```bash
# 1. Run migrations before deployment
npm run migrate

# 2. Verify migrations succeeded
npm run migrate:status

# 3. Deploy new version
cd infra/scripts
./blue-green-deploy.sh v0.3.0

# 4. If deployment fails, rollback migrations
npm run migrate:rollback
```

## API Versioning

### Overview

Engine-Ops supports multiple API versions simultaneously for backward compatibility during migrations.

### Version Detection

The API supports three methods of version specification:

1. **URL Path**: `/api/v1/optimize` or `/api/v2/optimize`
2. **Header**: `X-API-Version: v1`
3. **Query Parameter**: `?api_version=v1`

### Using API Versioning

```typescript
import {
  apiVersionMiddleware,
  deprecationWarningMiddleware,
  autoTransformMiddleware,
} from './middleware/api-version';

// Apply to routes
app.use('/api', apiVersionMiddleware);
app.use(
  '/api/v1',
  deprecationWarningMiddleware(ApiVersion.V1, 'Please migrate to v2', '2025-12-31'),
);
app.use('/api', autoTransformMiddleware);
```

### Backward Compatibility

The framework automatically transforms requests/responses:

```typescript
// Client sends v1 request
POST /api/v1/optimize
{ "type": "scheduling", "tasks": [...] }

// Server receives transformed v2 format
{
    "type": "scheduling",
    "tasks": [...],
    "version": "1.0",    // Added by transformer
    "metadata": {}        // Added by transformer
}

// Server responds with v2 format
{
    "result": {...},
    "version": "2.0",
    "metadata": {...}
}

// Client receives v1 format
{
    "result": {...}
    // version and metadata removed by transformer
}
```

### Deprecation Warnings

Deprecated API versions receive special headers:

```
Warning: 299 - "API version v1 is deprecated. Please migrate to v2"
Sunset: 2025-12-31
Link: </api/v2>; rel="successor-version"
```

### API Version Migration Strategy

1. **Release v2 alongside v1**

   ```bash
   # Both versions available
   /api/v1/optimize  # Original
   /api/v2/optimize  # New
   ```

2. **Announce deprecation**

   ```typescript
   deprecationWarningMiddleware(ApiVersion.V1, 'v1 will be sunset on 2025-12-31', '2025-12-31');
   ```

3. **Monitor v1 usage**

   ```bash
   # Check logs for v1 requests
   kubectl logs -l app=engine-ops | grep "X-API-Version: v1"
   ```

4. **Remove v1 support**
   ```typescript
   // After sunset date
   app.use('/api/v1', (req, res) => {
     res.status(410).json({
       error: 'Gone',
       message: 'API v1 is no longer supported. Use v2.',
     });
   });
   ```

## Deployment Best Practices

### 1. Pre-Deployment Checklist

- [ ] Run database migrations
- [ ] Update API documentation
- [ ] Test backward compatibility
- [ ] Review resource quotas
- [ ] Check monitoring/alerting
- [ ] Verify rollback plan
- [ ] Notify stakeholders

### 2. Deployment Execution

```bash
#!/bin/bash
# Deployment script with safety checks

set -e

echo "Starting deployment..."

# 1. Verify cluster health
kubectl get nodes
kubectl top nodes

# 2. Run migrations
npm run migrate

# 3. Deploy new version
NAMESPACE=production ./infra/scripts/blue-green-deploy.sh v0.3.0

# 4. Run smoke tests
./tests/smoke-tests.sh

# 5. Monitor metrics
./scripts/monitor-deployment.sh

echo "Deployment complete!"
```

### 3. Post-Deployment Monitoring

Monitor key metrics after deployment:

```bash
# Watch pod status
kubectl get pods -l app=engine-ops -w

# Check logs for errors
kubectl logs -f -l app=engine-ops | grep ERROR

# Monitor metrics
kubectl port-forward service/engine-ops 8080:80
curl http://localhost:8080/metrics

# Check resource usage
kubectl top pods -l app=engine-ops
```

### 4. Gradual Traffic Migration (Canary)

For high-risk changes, use canary deployments:

```bash
# Deploy canary with 10% traffic
kubectl apply -f infra/k8s/canary/deployment-canary.yaml

# Monitor canary metrics
# If successful, gradually increase traffic
# If issues, rollback canary
```

## Rollback Strategies

### Immediate Rollback (Blue-Green)

```bash
# Switch traffic back to previous version
./infra/scripts/rollback.sh
```

**Time to rollback**: < 10 seconds

### Rollback Rolling Update

```bash
# Undo last deployment
kubectl rollout undo deployment/engine-ops

# Undo to specific revision
kubectl rollout undo deployment/engine-ops --to-revision=3
```

**Time to rollback**: 1-3 minutes (depending on pod count)

### Database Rollback

```bash
# Rollback last migration
npm run migrate:rollback

# Rollback multiple migrations
npm run migrate down 3
```

**Important**: Only rollback migrations if absolutely necessary. Ensure data integrity.

### Emergency Procedures

#### Total Failure

```bash
# 1. Switch to last known good version immediately
kubectl patch service engine-ops-active \
    -p '{"spec":{"selector":{"version":"blue"}}}'

# 2. Scale down problematic deployment
kubectl scale deployment/engine-ops-green --replicas=0

# 3. Rollback migrations if needed
npm run migrate:rollback

# 4. Investigate and fix issues
kubectl logs -l app=engine-ops,version=green
```

#### Partial Failure

```bash
# 1. Reduce traffic to new version (if using canary)
kubectl scale deployment/engine-ops-canary --replicas=1

# 2. Increase stable version capacity
kubectl scale deployment/engine-ops --replicas=5

# 3. Investigate issues while maintaining service
kubectl logs -f deployment/engine-ops-canary
```

## Troubleshooting

### Health Check Failures

**Symptom**: Pods not becoming ready

```bash
# Check probe configuration
kubectl describe pod <pod-name>

# Check application logs
kubectl logs <pod-name>

# Test health endpoint
kubectl exec <pod-name> -- curl localhost:3000/health/ready
```

**Common causes**:

- Application startup time exceeds probe timeout
- Database connection issues
- Missing configuration

**Solutions**:

- Increase `initialDelaySeconds` in probes
- Add startup probe for slow-starting applications
- Verify ConfigMap and Secrets are present

### Image Pull Errors

**Symptom**: `ImagePullBackOff` or `ErrImagePull`

```bash
# Check image availability
docker images | grep engine-ops

# Verify image pull secrets
kubectl get secrets

# Check pod events
kubectl describe pod <pod-name>
```

**Solutions**:

- Verify image exists and tag is correct
- Add image pull secrets if using private registry
- Check network connectivity to registry

### Traffic Not Routing

**Symptom**: 503 errors or connection refused

```bash
# Check service endpoints
kubectl get endpoints engine-ops-active

# Verify service selector
kubectl get service engine-ops-active -o yaml

# Check pod labels
kubectl get pods --show-labels
```

**Solutions**:

- Ensure pod labels match service selector
- Verify pods are in Ready state
- Check network policies

### Migration Failures

**Symptom**: Migration script fails

```bash
# Check migration status
npm run migrate:status

# Verify migration integrity
npm run migrate verify

# View detailed logs
npm run migrate 2>&1 | tee migration.log
```

**Solutions**:

- Rollback failed migration: `npm run migrate:rollback`
- Fix migration code and retry
- Check database connectivity

### Resource Exhaustion

**Symptom**: Pods pending or evicted

```bash
# Check cluster resources
kubectl top nodes
kubectl describe nodes

# Check pod resource requests
kubectl describe deployment engine-ops
```

**Solutions**:

- Scale down non-critical workloads
- Adjust resource requests/limits
- Add more nodes to cluster
- Use horizontal pod autoscaling

## Summary

Engine-Ops provides comprehensive zero-downtime deployment capabilities:

- **Blue-Green**: Instant switching, highest safety
- **Rolling Updates**: Resource efficient, gradual rollout
- **Migrations**: Safe schema changes with rollback
- **API Versioning**: Backward compatibility during transitions

Choose the strategy that best fits your requirements and risk tolerance. For critical production systems, blue-green deployment with comprehensive testing is recommended.

For more information:

- [Blue-Green Deployment README](../infra/k8s/blue-green/README.md)
- [Kubernetes Deployment README](../infra/k8s/README.md)
- [Migration Examples](../schemas/migrations/)
