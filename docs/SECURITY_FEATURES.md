# Advanced Security Controls

This document describes the advanced security features added to Engine-Ops.

## Features

### 1. External Secrets Manager Support

Engine-Ops now supports integration with external secrets managers for secure credential and configuration management.

#### Supported Providers

- **HashiCorp Vault**: Enterprise-grade secrets management with advanced authentication
- **AWS Secrets Manager**: Native AWS integration for cloud deployments
- **Environment Variables**: For development and testing

#### Usage

```typescript
import { SecretsManagerFactory } from './infra/secrets/secrets-factory.js';

// HashiCorp Vault
const vaultManager = SecretsManagerFactory.create({
  provider: 'vault',
  vault: {
    endpoint: 'https://vault.example.com',
    token: 'your-token',
    // or use AppRole authentication
    roleId: 'role-id',
    secretId: 'secret-id',
  },
});

await vaultManager.init();
const secret = await vaultManager.getSecret('api-key');

// AWS Secrets Manager
const awsManager = SecretsManagerFactory.create({
  provider: 'aws',
  aws: {
    region: 'us-east-1',
    accessKeyId: 'your-access-key',
    secretAccessKey: 'your-secret-key',
  },
});

await awsManager.init();
const secret = await awsManager.getSecret('database-password');
```

#### Configuration

Configure the secrets provider through environment variables:

```bash
SECRETS_PROVIDER=vault
VAULT_ENDPOINT=https://vault.example.com
VAULT_TOKEN=your-token
```

### 2. Kubernetes Mutating Admission Webhooks

Automatic security policy enforcement for Kubernetes resources through mutating admission webhooks.

#### Security Policies

**Non-Root Containers Policy**

- Enforces `runAsNonRoot: true` for all containers
- Adds security context automatically if missing
- Prevents privilege escalation

**Resource Limits Policy**

- Ensures all containers have resource limits
- Sets default limits if not specified
- Prevents resource exhaustion

**No Privileged Containers Policy**

- Denies creation of privileged containers
- Enforces security best practices
- Protects cluster security

**Security Labels Policy**

- Validates required labels (app, version, environment)
- Warns about missing labels
- Improves resource tracking

#### Deployment

Deploy the webhook server to your Kubernetes cluster:

```bash
# Apply webhook deployment
kubectl apply -f infra/k8s/webhook-deployment.yaml
kubectl apply -f infra/k8s/webhook-service.yaml

# Configure mutating webhook
kubectl apply -f infra/k8s/mutating-webhook-config.yaml
```

#### Certificate Management

The webhook requires TLS certificates. Generate them using:

```bash
# Generate self-signed certificates
openssl req -x509 -newkey rsa:4096 -keyout tls.key -out tls.crt \
    -days 365 -nodes -subj "/CN=engine-ops-webhook.default.svc"

# Create Kubernetes secret
kubectl create secret tls engine-ops-webhook-certs \
    --cert=tls.crt --key=tls.key

# Update the caBundle in mutating-webhook-config.yaml
cat tls.crt | base64 -w 0
```

#### Testing

Test the webhook locally:

```typescript
import { MutatingWebhookServer } from './infra/webhooks/webhook-server.js';

const server = new MutatingWebhookServer(8443);
await server.start();
```

### 3. Real-time Anomaly Detection

Statistical anomaly detection for engine operations with configurable thresholds.

#### Features

- **Statistical Analysis**: Z-score based anomaly detection
- **Sliding Window**: Maintains history for accurate baselines
- **Severity Classification**: Critical, high, medium, low alerts
- **Real-time Monitoring**: Immediate detection and alerting

#### Usage

```typescript
import { AnomalyDetector } from './core/anomaly/detector.js';

const detector = new AnomalyDetector({
  windowSize: 100, // Number of data points to analyze
  threshold: 3, // Standard deviations for anomaly
  minSamples: 10, // Minimum samples before detection
  verbose: true, // Enable logging
});

// Record metrics
detector.recordMetric('response_time', 150);
detector.recordMetric('error_rate', 0.02);

// Get alerts
const alerts = detector.getAlerts();
const recentAlerts = detector.getRecentAlerts(Date.now() - 3600000); // Last hour

// Get statistics
const stats = detector.getMetricStats('response_time');
console.log(`Mean: ${stats.mean}, StdDev: ${stats.stddev}`);
```

#### API Endpoints

**Get All Alerts**

```bash
GET /api/v1/anomaly/alerts
```

**Get Recent Alerts**

```bash
GET /api/v1/anomaly/alerts/recent?hours=1
```

**Get Monitored Metrics**

```bash
GET /api/v1/anomaly/metrics
```

**Get Metric Details**

```bash
GET /api/v1/anomaly/metrics/request_duration_ms
```

**Clear Alerts**

```bash
DELETE /api/v1/anomaly/alerts
```

#### Integration with Engine

The anomaly detector is automatically integrated with the optimization engine:

```typescript
// Metrics are automatically recorded during optimization
const result = await engine.optimize(request);

// Access anomaly detector
const detector = engine.getAnomalyDetector();
const alerts = detector.getAlerts();
```

#### Configuration

Configure anomaly detection thresholds:

```typescript
const engine = new OptimizationEngine({
  verbose: true,
});

// Anomaly detector is initialized with:
// - windowSize: 100
// - threshold: 3 standard deviations
// - minSamples: 10
```

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to version control
   - Use external secrets managers in production
   - Rotate secrets regularly
   - Use least-privilege access

2. **Webhook Security**
   - Always use TLS certificates
   - Regularly update certificates
   - Monitor webhook logs
   - Test policies before enforcement

3. **Anomaly Detection**
   - Set appropriate thresholds for your workload
   - Review alerts regularly
   - Integrate with monitoring systems
   - Adjust baselines as needed

## Monitoring and Alerting

All security features emit metrics and logs:

- **Prometheus Metrics**: Available at `/metrics`
- **Application Logs**: Structured logging with severity levels
- **Anomaly Alerts**: Real-time alerts via API

## Testing

Run security feature tests:

```bash
# Test secrets managers
npm test -- infra/secrets

# Test admission webhooks
npm test -- infra/webhooks

# Test anomaly detection
npm test -- core/anomaly
```

## License

These security features are licensed under Apache License 2.0 (infra/) and BSL 1.1 (core/).
