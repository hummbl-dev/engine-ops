# Engine-Ops Helm Chart

This Helm chart deploys Engine-Ops with support for both rolling updates and blue-green deployments.

## Prerequisites

- Kubernetes 1.20+
- Helm 3.0+
- kubectl configured to access your cluster

## Installation

### Quick Start

```bash
# Install with default values (rolling update strategy)
helm install engine-ops ./infra/helm/engine-ops

# Install with custom namespace
helm install engine-ops ./infra/helm/engine-ops -n production --create-namespace

# Install with custom values
helm install engine-ops ./infra/helm/engine-ops -f custom-values.yaml
```

## Configuration

### Basic Configuration

| Parameter          | Description        | Default        |
| ------------------ | ------------------ | -------------- |
| `replicaCount`     | Number of replicas | `2`            |
| `image.repository` | Image repository   | `engine-ops`   |
| `image.tag`        | Image tag          | `latest`       |
| `image.pullPolicy` | Image pull policy  | `IfNotPresent` |
| `service.type`     | Service type       | `LoadBalancer` |
| `service.port`     | Service port       | `80`           |

### Rolling Update Strategy

Rolling updates are enabled by default:

```yaml
strategy:
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

Deploy a new version:

```bash
# Update image tag
helm upgrade engine-ops ./infra/helm/engine-ops \
  --set image.tag=v0.3.0

# Watch the rollout
kubectl rollout status deployment/engine-ops
```

### Blue-Green Deployment

To enable blue-green deployments, create a values file:

**values-blue-green.yaml**:

```yaml
blueGreen:
  enabled: true
  activeVersion: 'blue'
  inactiveVersion: 'green'
  deploymentType: 'blue-green'
# You'll need to manage two separate releases
```

#### Blue-Green Workflow

1. **Install Blue Environment**:

```bash
helm install engine-ops-blue ./infra/helm/engine-ops \
  -f values-blue-green.yaml \
  --set blueGreen.activeVersion=blue \
  --set fullnameOverride=engine-ops-blue
```

2. **Install Green Environment**:

```bash
helm install engine-ops-green ./infra/helm/engine-ops \
  -f values-blue-green.yaml \
  --set blueGreen.activeVersion=green \
  --set fullnameOverride=engine-ops-green
```

3. **Switch Traffic** (update active service):

```bash
# Update active service to point to green
kubectl patch service engine-ops \
  -p '{"spec":{"selector":{"version":"green"}}}'
```

4. **Rollback if Needed**:

```bash
# Switch back to blue
kubectl patch service engine-ops \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```

### Health Probes

Configure health check behavior:

```yaml
probes:
  liveness:
    initialDelaySeconds: 30
    periodSeconds: 10
    timeoutSeconds: 5
    failureThreshold: 3
  readiness:
    initialDelaySeconds: 10
    periodSeconds: 5
    timeoutSeconds: 3
    failureThreshold: 3
    successThreshold: 2
  startup:
    enabled: true
    initialDelaySeconds: 5
    periodSeconds: 5
    timeoutSeconds: 3
    failureThreshold: 12
```

### Autoscaling

Enable horizontal pod autoscaling:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80
```

### Resource Limits

Configure resource requests and limits:

```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

### Ingress

Enable ingress for external access:

```yaml
ingress:
  enabled: true
  className: 'nginx'
  annotations:
    cert-manager.io/cluster-issuer: 'letsencrypt-prod'
  hosts:
    - host: engine-ops.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: engine-ops-tls
      hosts:
        - engine-ops.example.com
```

Install with ingress:

```bash
helm install engine-ops ./infra/helm/engine-ops \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=engine-ops.yourdomain.com
```

### Configuration Values

Application-specific configuration:

```yaml
config:
  nodeEnv: production
  port: 3000
  rateLimitWindowMs: 900000
  rateLimitMaxRequests: 100
```

## Upgrades

### Rolling Update Upgrade

```bash
# Simple upgrade
helm upgrade engine-ops ./infra/helm/engine-ops

# Upgrade with new image
helm upgrade engine-ops ./infra/helm/engine-ops \
  --set image.tag=v0.3.0

# Upgrade with custom values
helm upgrade engine-ops ./infra/helm/engine-ops \
  -f custom-values.yaml
```

### Blue-Green Upgrade

For blue-green deployments, update the inactive environment first:

```bash
# 1. Update green environment (currently inactive)
helm upgrade engine-ops-green ./infra/helm/engine-ops \
  -f values-blue-green.yaml \
  --set image.tag=v0.3.0 \
  --set blueGreen.activeVersion=green

# 2. Test green environment
kubectl port-forward service/engine-ops-preview 8080:80
curl http://localhost:8080/api/v1/health

# 3. Switch traffic to green
kubectl patch service engine-ops \
  -p '{"spec":{"selector":{"version":"green"}}}'

# 4. Monitor new active environment
kubectl logs -f -l version=green

# 5. If successful, update blue environment for next deployment
helm upgrade engine-ops-blue ./infra/helm/engine-ops \
  -f values-blue-green.yaml \
  --set image.tag=v0.3.0 \
  --set blueGreen.activeVersion=blue
```

## Rollback

### Rolling Update Rollback

```bash
# Rollback to previous release
helm rollback engine-ops

# Rollback to specific revision
helm rollback engine-ops 2

# List releases
helm history engine-ops
```

### Blue-Green Rollback

```bash
# Switch traffic back to previous environment
kubectl patch service engine-ops \
  -p '{"spec":{"selector":{"version":"blue"}}}'
```

## Monitoring

### Check Deployment Status

```bash
# Get deployment status
helm status engine-ops

# Get pod status
kubectl get pods -l app.kubernetes.io/name=engine-ops

# View logs
kubectl logs -f -l app.kubernetes.io/name=engine-ops

# Check HPA status
kubectl get hpa

# View metrics
kubectl top pods -l app.kubernetes.io/name=engine-ops
```

### Prometheus Integration

The chart includes Prometheus annotations:

```yaml
podAnnotations:
  prometheus.io/scrape: 'true'
  prometheus.io/port: '3000'
  prometheus.io/path: '/metrics'
```

Access metrics:

```bash
kubectl port-forward service/engine-ops 8080:80
curl http://localhost:8080/metrics
```

## Advanced Configuration

### Pod Anti-Affinity

Distribute pods across nodes:

```yaml
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - engine-ops
          topologyKey: kubernetes.io/hostname
```

### Node Selector

Deploy to specific nodes:

```yaml
nodeSelector:
  workload-type: compute-intensive
```

### Tolerations

Allow pods on tainted nodes:

```yaml
tolerations:
  - key: 'dedicated'
    operator: 'Equal'
    value: 'engine-ops'
    effect: 'NoSchedule'
```

### Security Context

Configure security settings:

```yaml
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000

securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
  readOnlyRootFilesystem: true
```

## Uninstallation

```bash
# Uninstall release
helm uninstall engine-ops

# Uninstall from specific namespace
helm uninstall engine-ops -n production

# For blue-green deployments
helm uninstall engine-ops-blue
helm uninstall engine-ops-green
```

## Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod -l app.kubernetes.io/name=engine-ops

# View logs
kubectl logs -l app.kubernetes.io/name=engine-ops

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### Service Not Accessible

```bash
# Check service
kubectl get service engine-ops
kubectl describe service engine-ops

# Check endpoints
kubectl get endpoints engine-ops
```

### HPA Not Scaling

```bash
# Check HPA status
kubectl describe hpa engine-ops

# Verify metrics server
kubectl top nodes
kubectl top pods
```

### Helm Release Issues

```bash
# List releases
helm list --all-namespaces

# Get release details
helm get all engine-ops

# View release history
helm history engine-ops
```

## Examples

### Development Environment

```yaml
# values-dev.yaml
replicaCount: 1
autoscaling:
  enabled: false
resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 50m
    memory: 64Mi
service:
  type: ClusterIP
ingress:
  enabled: false
```

```bash
helm install engine-ops ./infra/helm/engine-ops \
  -f values-dev.yaml \
  -n development --create-namespace
```

### Production Environment

```yaml
# values-prod.yaml
replicaCount: 3
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 200m
    memory: 256Mi
service:
  type: LoadBalancer
ingress:
  enabled: true
  hosts:
    - host: api.production.com
```

```bash
helm install engine-ops ./infra/helm/engine-ops \
  -f values-prod.yaml \
  -n production --create-namespace
```

## Contributing

For changes to the chart:

1. Update templates and values
2. Test with `helm lint`
3. Test installation in test cluster
4. Update documentation
5. Submit pull request

## Support

For issues and questions:

- GitHub Issues: https://github.com/hummbl-dev/engine-ops/issues
- Documentation: https://github.com/hummbl-dev/engine-ops/tree/main/docs

## License

Apache License 2.0 - See LICENSE file for details
