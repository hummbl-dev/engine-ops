# Computational Context Strategy

**Version:** 1.0
**Purpose:** Define how the system's runtime state (computational context) is observed, recorded, and analyzed.

## 1. Philosophy

Context is not just static documentation; it is the dynamic state of the running system. To engineer context effectively, we must treat logs, metrics, and traces as a unified data stream that tells the story of the system's execution.

## 2. Logging Strategy (The "What")

### Structured Logging

All logs must be structured JSON.

```json
{
  "timestamp": "2025-11-22T12:00:00Z",
  "level": "INFO",
  "message": "Session created",
  "context": {
    "sessionId": "sess-123",
    "userId": "user-456",
    "region": "us-east-1"
  }
}
```

### Context Propagation

- **Trace IDs:** Every request must have a `traceId` that propagates through all service boundaries.
- **Correlation:** Logs, metrics, and traces must be correlated via `traceId`.

## 3. Metrics Strategy (The "How Much")

### Golden Signals

- **Latency:** Time taken to service a request.
- **Traffic:** Demand placed on the system (req/sec).
- **Errors:** Rate of requests that fail.
- **Saturation:** How "full" the service is (CPU/Memory).

### Business Metrics

- **Optimization Efficiency:** % resources saved.
- **Scheduling Latency:** Time to schedule a pod.
- **Plugin Health:** Status of loaded plugins.

## 4. State Management (The "Where")

- **Ephemeral State:** In-memory (Redis). Lost on restart.
- **Persistent State:** Database (PostgreSQL). Source of truth.
- **Configuration State:** Kubernetes ConfigMaps/Secrets.
- **Derived State:** Prometheus/Grafana.

## 5. Feedback Loops

- **Alerting:** PagerDuty for P0/P1. Slack for P2/P3.
- **Auto-Remediation:** K8s Operator should attempt to self-heal based on metrics (e.g., restart crashing pods).
- **Context Updates:** Incidents should trigger updates to `docs/playbooks/`.
