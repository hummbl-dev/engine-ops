# Deployment Procedures Playbook

## Purpose
Standard operating procedures for deploying `engine-ops` using Blue-Green and Rolling deployment strategies.

## Deployment Strategies Overview

| Strategy | Downtime | Rollback Speed | Resource Cost | Use Case |
|----------|----------|----------------|---------------|----------|
| **Blue-Green** | Zero | Instant | 2x (temporary) | Major releases, high-risk changes |
| **Rolling** | Zero | Gradual | 1x | Minor updates, patches |

---

## Pre-Deployment Checklist

### Required Verifications
- [ ] All CI checks passing on target branch
- [ ] Code reviewed and approved
- [ ] Tests passing (104+ tests)
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Database migrations tested (if applicable)
- [ ] Secrets/config verified in target environment

### Stakeholder Communication
- [ ] Notify team in deployment channel
- [ ] Schedule deployment window (if needed)
- [ ] Prepare rollback plan
- [ ] Assign deployment lead

---

## Blue-Green Deployment

### Overview
Deploy new version to "green" environment while "blue" (current) remains active. Switch traffic after validation.

### Prerequisites
```bash
# Verify both environments exist
kubectl get deployments -n engine-ops | grep -E "blue|green"

# Check current active environment
kubectl get service engine-ops -n engine-ops -o jsonpath='{.spec.selector.version}'
```

### Procedure

#### Step 1: Identify Current Environment
```bash
# Get current active version
CURRENT=$(kubectl get service engine-ops -n engine-ops -o jsonpath='{.spec.selector.version}')
echo "Current active: $CURRENT"

# Set target environment
if [ "$CURRENT" = "blue" ]; then
  TARGET="green"
else
  TARGET="blue"
fi
echo "Deploying to: $TARGET"
```

#### Step 2: Deploy to Target Environment
```bash
# Update target deployment
kubectl set image deployment/engine-ops-$TARGET \
  engine-ops=ghcr.io/hummbl-dev/engine-ops:$NEW_VERSION \
  -n engine-ops

# Wait for rollout
kubectl rollout status deployment/engine-ops-$TARGET -n engine-ops --timeout=5m
```

#### Step 3: Validate Target Environment
```bash
# Get target pod IP
TARGET_POD=$(kubectl get pods -n engine-ops -l version=$TARGET -o jsonpath='{.items[0].metadata.name}')

# Health check
kubectl exec -n engine-ops $TARGET_POD -- curl -f http://localhost:3000/api/v1/health

# Smoke tests
kubectl exec -n engine-ops $TARGET_POD -- npm test -- --testPathPattern=smoke
```

#### Step 4: Switch Traffic
```bash
# Update service selector
kubectl patch service engine-ops -n engine-ops -p \
  '{"spec":{"selector":{"version":"'$TARGET'"}}}'

# Verify traffic switch
kubectl get service engine-ops -n engine-ops -o jsonpath='{.spec.selector.version}'
```

#### Step 5: Monitor New Environment
```bash
# Watch logs
kubectl logs -f deployment/engine-ops-$TARGET -n engine-ops

# Check metrics
kubectl top pods -n engine-ops -l version=$TARGET

# Monitor error rate (5 minutes)
# Expected: < 1% error rate
```

#### Step 6: Decommission Old Environment (Optional)
```bash
# Scale down old environment after 24 hours
kubectl scale deployment/engine-ops-$CURRENT --replicas=0 -n engine-ops
```

### Rollback Procedure
```bash
# Immediate rollback: switch service back
kubectl patch service engine-ops -n engine-ops -p \
  '{"spec":{"selector":{"version":"'$CURRENT'"}}}'

# Verify rollback
kubectl get service engine-ops -n engine-ops -o jsonpath='{.spec.selector.version}'
```

---

## Rolling Deployment

### Overview
Gradually replace pods with new version, maintaining service availability throughout.

### Prerequisites
```bash
# Verify deployment exists
kubectl get deployment engine-ops -n engine-ops

# Check current replica count
kubectl get deployment engine-ops -n engine-ops -o jsonpath='{.spec.replicas}'
```

### Procedure

#### Step 1: Update Deployment
```bash
# Set new image
kubectl set image deployment/engine-ops \
  engine-ops=ghcr.io/hummbl-dev/engine-ops:$NEW_VERSION \
  -n engine-ops

# Configure rolling update strategy (if not set)
kubectl patch deployment engine-ops -n engine-ops -p '{
  "spec": {
    "strategy": {
      "type": "RollingUpdate",
      "rollingUpdate": {
        "maxSurge": 1,
        "maxUnavailable": 0
      }
    }
  }
}'
```

#### Step 2: Monitor Rollout
```bash
# Watch rollout progress
kubectl rollout status deployment/engine-ops -n engine-ops --timeout=10m

# View rollout history
kubectl rollout history deployment/engine-ops -n engine-ops
```

#### Step 3: Validate Deployment
```bash
# Check pod status
kubectl get pods -n engine-ops -l app=engine-ops

# Verify all pods running new version
kubectl get pods -n engine-ops -l app=engine-ops \
  -o jsonpath='{.items[*].spec.containers[0].image}'

# Health check
kubectl exec -n engine-ops deployment/engine-ops -- \
  curl -f http://localhost:3000/api/v1/health
```

#### Step 4: Monitor Metrics
```bash
# Watch resource usage
kubectl top pods -n engine-ops -l app=engine-ops

# Check logs for errors
kubectl logs -n engine-ops -l app=engine-ops --tail=100 | grep -i error

# Monitor for 15 minutes
# Expected: Stable CPU/memory, < 1% error rate
```

### Rollback Procedure
```bash
# Rollback to previous version
kubectl rollout undo deployment/engine-ops -n engine-ops

# Rollback to specific revision
kubectl rollout undo deployment/engine-ops -n engine-ops --to-revision=3

# Monitor rollback
kubectl rollout status deployment/engine-ops -n engine-ops
```

---

## Manual Workflow Trigger (Blue-Green)

### Using GitHub Actions
```bash
# Trigger blue-green deployment workflow
gh workflow run blue-green-deploy.yml \
  --ref main \
  -f environment=production \
  -f version=v0.3.0

# Monitor workflow
gh run watch
```

### Workflow File Location
[`.github/workflows/blue-green-deploy.yml`](file:///.github/workflows/blue-green-deploy.yml)

---

## Post-Deployment Tasks

### Immediate (0-1 hour)
- [ ] Verify deployment in production
- [ ] Check error rates and latency
- [ ] Review application logs
- [ ] Confirm all endpoints responding
- [ ] Update deployment tracking (e.g., Jira, Linear)

### Short-term (1-24 hours)
- [ ] Monitor metrics dashboard
- [ ] Review user feedback/reports
- [ ] Check database performance
- [ ] Verify background jobs running
- [ ] Document any issues encountered

### Long-term (1-7 days)
- [ ] Analyze performance trends
- [ ] Review cost impact
- [ ] Update runbooks if needed
- [ ] Schedule retrospective (if issues)
- [ ] Archive old deployment artifacts

---

## Troubleshooting

### Deployment Stuck
```bash
# Check pod events
kubectl describe pod <pod-name> -n engine-ops

# Common issues:
# - ImagePullBackOff: Check image tag exists
# - CrashLoopBackOff: Check application logs
# - Pending: Check resource quotas
```

### Health Check Failing
```bash
# Check health endpoint directly
kubectl port-forward -n engine-ops deployment/engine-ops 3000:3000
curl http://localhost:3000/api/v1/health

# Review application logs
kubectl logs -n engine-ops deployment/engine-ops --tail=50
```

### High Error Rate After Deployment
```bash
# Immediate: Rollback
kubectl rollout undo deployment/engine-ops -n engine-ops

# Investigate: Download logs
kubectl logs -n engine-ops -l app=engine-ops --since=10m > deployment-errors.log

# Analyze error patterns
grep -i "error\|exception\|failed" deployment-errors.log | sort | uniq -c
```

---

## Environment-Specific Notes

### Staging
- **URL**: `https://staging.engine-ops.hummbl.dev`
- **Namespace**: `engine-ops-staging`
- **Auto-deploy**: On merge to `develop` branch
- **Retention**: 7 days

### Production
- **URL**: `https://engine-ops.hummbl.dev`
- **Namespace**: `engine-ops`
- **Deploy**: Manual trigger only
- **Approval**: Required from 2 team members

---

## Related Documentation

- [CI Failure Response](file:///docs/playbooks/ci-failure-response.md)
- [Kubernetes Deployment Configs](file:///infra/k8s/)
- [Helm Charts](file:///infra/helm/engine-ops/)
- [Blue-Green Workflow](file:///.github/workflows/blue-green-deploy.yml)

---

**Last Updated:** 2025-11-22  
**Maintained By:** Engine Ops Team
