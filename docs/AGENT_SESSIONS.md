# Agent Sessions

Agent Sessions provide a structured way to orchestrate multi-agent workflows for various operational scenarios. This feature enables you to create, manage, and monitor sessions for different types of agent-based operations.

## Overview

The Agent Sessions system supports multiple workflow types:

- **metrics**: Monitor and collect system metrics
- **policy**: Enforce and validate policies
- **simulation**: Simulate operational scenarios
- **audit**: Conduct audits and compliance checks
- **custom**: Define custom workflows

## Session Structure

Each agent session consists of:

- **Session Type**: The type of workflow (metrics, policy, simulation, audit, custom)
- **Session ID**: A unique identifier for the session
- **Context**: Initial parameters and configuration
- **State**: Current state (init, running, paused, completed, failed)
- **Result**: Optional output data when completed
- **Error**: Optional error message if failed

## API Endpoints

### Create a New Session

**POST** `/api/v1/agent-sessions`

Request body:
```json
{
  "sessionType": "simulation",
  "sessionId": "sim-ops-2025-001",
  "context": {
    "agents": ["DetectionAgent", "TriageAgent", "ResolutionAgent", "AuditAgent"],
    "state": {"status": "init"},
    "policy": "ops_policy.json",
    "dataSource": "recent_ops_logs.json",
    "objective": "Simulate incident detection and resolution",
    "additionalSettings": {"maxSteps": 10, "enableAudit": true}
  }
}
```

Response (201 Created):
```json
{
  "sessionType": "simulation",
  "sessionId": "sim-ops-2025-001",
  "context": {
    "agents": ["DetectionAgent", "TriageAgent", "ResolutionAgent", "AuditAgent"],
    "state": {"status": "init"},
    "policy": "ops_policy.json",
    "dataSource": "recent_ops_logs.json",
    "objective": "Simulate incident detection and resolution",
    "additionalSettings": {"maxSteps": 10, "enableAudit": true}
  },
  "state": "init",
  "createdAt": "2025-11-21T23:45:00.000Z",
  "updatedAt": "2025-11-21T23:45:00.000Z"
}
```

### Get a Specific Session

**GET** `/api/v1/agent-sessions/:sessionId`

Response (200 OK):
```json
{
  "sessionType": "metrics",
  "sessionId": "metrics-001",
  "context": {
    "agents": ["MetricsAgent"],
    "objective": "Monitor system metrics"
  },
  "state": "running",
  "createdAt": "2025-11-21T23:45:00.000Z",
  "updatedAt": "2025-11-21T23:46:00.000Z"
}
```

### List All Sessions

**GET** `/api/v1/agent-sessions`

Query parameters:
- `sessionType` (optional): Filter by session type
- `state` (optional): Filter by state

Response (200 OK):
```json
{
  "count": 3,
  "sessions": [
    {
      "sessionType": "metrics",
      "sessionId": "metrics-001",
      "state": "running",
      "createdAt": "2025-11-21T23:45:00.000Z",
      "updatedAt": "2025-11-21T23:46:00.000Z"
    },
    {
      "sessionType": "policy",
      "sessionId": "policy-001",
      "state": "completed",
      "createdAt": "2025-11-21T23:45:00.000Z",
      "updatedAt": "2025-11-21T23:47:00.000Z"
    }
  ]
}
```

### Get Session Statistics

**GET** `/api/v1/agent-sessions/stats`

Response (200 OK):
```json
{
  "total": 10,
  "byType": {
    "metrics": 4,
    "policy": 2,
    "simulation": 3,
    "audit": 1
  },
  "byState": {
    "init": 2,
    "running": 5,
    "completed": 2,
    "failed": 1
  }
}
```

### Update Session State

**PATCH** `/api/v1/agent-sessions/:sessionId`

Request body:
```json
{
  "state": "completed",
  "result": {
    "metricsCollected": 100,
    "errors": 0,
    "duration": "5m30s"
  }
}
```

Response (200 OK):
```json
{
  "sessionType": "metrics",
  "sessionId": "metrics-001",
  "state": "completed",
  "result": {
    "metricsCollected": 100,
    "errors": 0,
    "duration": "5m30s"
  },
  "createdAt": "2025-11-21T23:45:00.000Z",
  "updatedAt": "2025-11-21T23:50:30.000Z"
}
```

### Delete a Session

**DELETE** `/api/v1/agent-sessions/:sessionId`

Response (204 No Content)

## Usage Examples

### Example 1: Metrics Collection Session

```bash
curl -X POST http://localhost:3000/api/v1/agent-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionType": "metrics",
    "sessionId": "metrics-2025-001",
    "context": {
      "agents": ["MetricsAgent"],
      "dataSource": "prometheus",
      "objective": "Collect CPU and memory metrics",
      "additionalSettings": {
        "interval": "5s",
        "duration": "1h"
      }
    }
  }'
```

### Example 2: Policy Enforcement Session

```bash
curl -X POST http://localhost:3000/api/v1/agent-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionType": "policy",
    "sessionId": "policy-security-001",
    "context": {
      "agents": ["SecurityPolicyAgent"],
      "policy": "security_baseline.json",
      "dataSource": "kubernetes_cluster",
      "objective": "Validate security policies"
    }
  }'
```

### Example 3: Simulation Session

```bash
curl -X POST http://localhost:3000/api/v1/agent-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionType": "simulation",
    "sessionId": "sim-ops-2025-001",
    "context": {
      "agents": ["DetectionAgent", "TriageAgent", "ResolutionAgent", "AuditAgent"],
      "state": {"status": "init"},
      "policy": "ops_policy.json",
      "dataSource": "recent_ops_logs.json",
      "objective": "Simulate incident detection and resolution",
      "additionalSettings": {
        "maxSteps": 10,
        "enableAudit": true
      }
    }
  }'
```

### Example 4: Audit Session

```bash
curl -X POST http://localhost:3000/api/v1/agent-sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionType": "audit",
    "sessionId": "audit-compliance-001",
    "context": {
      "agents": ["AuditAgent"],
      "policy": "compliance_policy.json",
      "dataSource": "system_logs",
      "objective": "Audit system for compliance violations"
    }
  }'
```

## Session Lifecycle

1. **Creation**: Session is created with state `init`
2. **Execution**: Update state to `running` when agents start processing
3. **Pause** (optional): Update state to `paused` if needed
4. **Completion**: Update state to `completed` with results, or `failed` with error
5. **Cleanup**: Delete session when no longer needed

## Integration with Engine-Ops

Agent Sessions are designed to integrate with the Engine-Ops optimization platform:

- Sessions can leverage the optimization engine for resource allocation
- Use WebSocket connections for real-time session updates
- Integrate with monitoring and metrics collection
- Apply caching strategies for session data

## Security Considerations

- Validate all session inputs
- Implement authentication and authorization for session management
- Rate limit session creation to prevent abuse
- Sanitize and validate policy files and data sources
- Audit session activities for compliance

## Performance Tips

- Use session statistics endpoint to monitor overall system load
- Filter sessions by type and state to reduce response size
- Delete completed or failed sessions regularly
- Implement session expiration for inactive sessions
- Use pagination when listing large numbers of sessions

## Error Handling

Common error responses:

- **400 Bad Request**: Invalid session data or parameters
- **404 Not Found**: Session does not exist
- **409 Conflict**: Session with same ID already exists
- **500 Internal Server Error**: Server-side processing error

## License

Agent Sessions are part of the Engine-Ops platform:
- Core implementation: Business Source License 1.1 (converts to Apache 2.0 on 2029-01-01)
- Public API: Apache License 2.0
