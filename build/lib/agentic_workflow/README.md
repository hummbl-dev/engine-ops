# Agentic Workflow System

A comprehensive, context-aware multi-agent workflow system for operational context management and agent collaboration. This system provides enterprise-grade orchestration with full observability, policy enforcement, and audit trails.

## Overview

The Agentic Workflow System enables building sophisticated multi-agent workflows where context flows seamlessly between agents, policies are enforced at runtime, and every operation is auditable. It's designed for operational scenarios requiring high reliability, compliance, and traceability.

## Core Components

### 1. Context Management (`context.py`)

The **AgentContext** is the central data structure that flows through all agents, capturing 15 comprehensive context types:

#### Context Types

1. **IdentityContext**: Who is executing the workflow
   - Agent ID, User ID, Organization ID
   - Role and permissions

2. **StateContext**: Current workflow state
   - Current state, previous state
   - State transition history with timestamps

3. **SessionContext**: Session-level tracking
   - Unique session ID
   - Creation time, last updated, TTL
   - Session attributes

4. **IntentContext**: Goals and objectives
   - Primary intent and sub-intents
   - Goals list and constraints
   - Priority level (low, normal, high, critical)

5. **PolicyContext**: Compliance and policies
   - Applicable policies
   - Compliance requirements
   - Escalation rules and approval tracking

6. **TelemetryContext**: Observability
   - Trace ID, Span ID, Parent Span ID
   - Metrics and events for distributed tracing

7. **KnowledgeContext**: Learned information
   - Facts and confidence scores
   - Learned patterns
   - Recommendations

8. **DependenciesContext**: System relationships
   - Upstream/downstream services
   - External system mappings
   - Required capabilities

9. **AnnotationContext**: Classification
   - Tags, labels, categories
   - Human-readable notes

10. **SecurityContext**: Security requirements
    - Encryption requirements
    - Data classification levels
    - Sensitive field tracking

11. **ResourceContext**: Resource allocation
    - Memory and CPU allocations
    - Execution time limits
    - Cost tracking

12. **TemporalContext**: Time management
    - Start time, deadline, duration estimates
    - Timezone and schedule information

13. **PayloadContext**: Data being processed
    - Input data, output data
    - Intermediate results
    - Data format and size tracking

14. **RelationshipContext**: Workflow relationships
    - Parent/child context relationships
    - Related workflows
    - Correlation IDs

15. **TopologyContext**: Infrastructure information
    - Region, availability zone
    - Cluster and node information
    - Deployment environment

### 2. Policy Engine (`policy.py`)

Runtime policy evaluation and escalation management:

#### Features

- **Rule-based evaluation**: Define policies as conditions with actions
- **Priority-based execution**: Higher priority rules evaluated first
- **Multiple actions**: Allow, Deny, Escalate, Log, Require Approval
- **Escalation levels**: Info, Warning, Critical, Emergency
- **Handler registration**: Custom handlers for each escalation level
- **Evaluation history**: Full audit trail of policy decisions

#### Default Policies

- High-privilege access control requiring approval
- Memory allocation limit enforcement
- Critical deadline validation

#### Usage Example

```python
from agentic_workflow.policy import PolicyEngine, PolicyRule, PolicyAction

engine = PolicyEngine()

# Add custom rule
engine.add_rule(PolicyRule(
    rule_id="data_validation",
    name="Data Size Limit",
    description="Prevent processing datasets > 1GB",
    condition=lambda ctx: ctx.get("payload", {}).get("data_size_bytes", 0) > 1_000_000_000,
    action=PolicyAction.DENY,
    priority=95
))

# Evaluate policies
evaluations = engine.evaluate(context.to_dict())
```

### 3. Telemetry & Observability (`telemetry.py`)

Comprehensive logging and metrics collection:

#### Features

- **Structured logging**: Multiple log levels with metadata
- **Event tracking**: Domain-specific events (agent start/complete/error, state changes)
- **Metrics collection**: Time-series metrics with tags
- **Audit reports**: Generate compliance-ready audit trails
- **Distributed tracing**: Trace ID and Span ID propagation

#### Log Levels

- DEBUG, INFO, WARNING, ERROR, CRITICAL

#### Event Types

- Agent lifecycle: START, COMPLETE, ERROR
- State changes
- Policy evaluations
- Escalations
- Custom metrics and audit events

### 4. Agent Base Class (`agent_base.py`)

Abstract base class for all agents with lifecycle management:

#### Key Methods

- `process(context)`: Core agent logic (must be implemented)
- `execute(context)`: Full lifecycle with telemetry and error handling
- `validate_context(context)`: Input validation

#### Lifecycle

1. Record agent start event
2. Log execution start
3. Update context identity
4. Execute process() method
5. Record completion/error events
6. Return updated context

### 5. Agent Implementations

#### DetectionAgent (`agents/detection_agent.py`)

Detects issues, anomalies, or events from input data.

**Capabilities:**

- High error rate detection
- Resource exhaustion detection
- Anomalous pattern identification
- Configurable thresholds
- Confidence scoring

**Output:**

- List of detections with severity and confidence
- Detection count metrics
- Annotated context with issue tags

#### TriageAgent (`agents/triage_agent.py`)

Prioritizes and categorizes detected issues.

**Capabilities:**

- Multi-factor prioritization (severity × confidence)
- Resolution path assignment
- Critical issue identification
- Priority scoring

**Output:**

- Prioritized issue list
- Resolution path assignments
- Critical count tracking

#### ResolutionAgent (`agents/resolution_agent.py`)

Resolves or mitigates triaged issues.

**Capabilities:**

- Multiple resolution strategies
- Success/failure tracking
- Success rate calculation
- Auto-rollback support

**Resolution Strategies:**

- Immediate escalation
- Resource optimization
- Error mitigation
- Priority queue management

**Output:**

- Resolved and failed issue lists
- Success rate metrics
- Resolution details

#### AuditAgent (`agents/audit_agent.py`)

Creates comprehensive audit trails and compliance records.

**Capabilities:**

- Workflow duration tracking
- State transition analysis
- Compliance checking
- Audit report generation

**Output:**

- Detailed audit report
- Compliance records
- Audit ID for reference

### 6. Workflow Orchestrator (`workflow.py`)

Coordinates multi-agent workflows with context propagation.

#### Features

- **Sequential execution**: Run agents in order
- **Parallel execution**: Run agent groups in parallel
- **Policy enforcement**: Check policies before and during execution
- **Error handling**: Configurable stop-on-error behavior
- **Context propagation**: Automatic context flow between agents

#### Usage Example

```python
from agentic_workflow import WorkflowOrchestrator, AgentContext, IdentityContext
from agentic_workflow.agents import DetectionAgent, TriageAgent, ResolutionAgent, AuditAgent

# Create orchestrator
orchestrator = WorkflowOrchestrator(workflow_id="incident_response")

# Add agents
orchestrator.add_agent(DetectionAgent())
orchestrator.add_agent(TriageAgent())
orchestrator.add_agent(ResolutionAgent())
orchestrator.add_agent(AuditAgent())

# Create initial context
identity = IdentityContext(agent_id="responder", user_id="user123")
context = AgentContext(identity=identity)
context.payload.input_data = {
    "error_rate": 0.15,
    "resource_usage": {"memory": 0.95}
}

# Execute workflow
result = orchestrator.execute(context)

# Access results
audit_report = result.payload.output_data["audit_report"]
print(f"Workflow completed: {audit_report['audit_id']}")
```

### 7. Utilities (`utils.py`)

Helper functions for common operations:

- **Serialization**: Context to/from JSON
- **Time utilities**: Timestamp formatting, duration calculation
- **Data sanitization**: Redact sensitive fields
- **Validation**: Context completeness checks
- **Comparison**: Context diff generation
- **Reporting**: Audit report formatting

## Design Patterns

### 1. Context Propagation Pattern

Context flows through all agents, accumulating information:

```
Initial Context → DetectionAgent → TriageAgent → ResolutionAgent → AuditAgent → Final Context
```

Each agent:

- Receives full context
- Adds its results to `payload.output_data`
- Updates state and telemetry
- Returns enriched context

### 2. Telemetry Integration Pattern

Every significant operation is logged and traced:

```python
# Automatic telemetry in agent.execute()
- Log agent start
- Record start event
- Execute process()
- Log completion/error
- Record completion/error event
```

### 3. Policy Enforcement Pattern

Policies are evaluated at key points:

```python
# Before workflow
violations = policy_engine.get_violations(context.to_dict())
if violations:
    # Stop workflow

# After each agent
evaluations = policy_engine.evaluate(context.to_dict())
# Handle escalations
```

### 4. State Machine Pattern

Workflow progresses through well-defined states:

```
initialized → detecting → detection_complete → triaging →
triage_complete → resolving → resolution_complete →
auditing → audit_complete → workflow_complete
```

State history is fully tracked for audit purposes.

### 5. Child Context Pattern

For parallel or nested operations:

```python
child_context = parent_context.clone_for_child()
# Child has new session/span IDs
# Child references parent
# Child inherits state but has clean output
```

## Usage Examples

### Example 1: Simple Detection

```python
from agentic_workflow import AgentContext, IdentityContext
from agentic_workflow.agents import DetectionAgent

identity = IdentityContext(agent_id="detector")
context = AgentContext(identity=identity)
context.payload.input_data = {"error_rate": 0.10}

agent = DetectionAgent()
result = agent.execute(context)

detections = result.payload.output_data["detections"]
print(f"Found {len(detections)} issues")
```

### Example 2: Full Incident Response

```python
from agentic_workflow import WorkflowOrchestrator, AgentContext, IdentityContext, IntentContext
from agentic_workflow.agents import DetectionAgent, TriageAgent, ResolutionAgent, AuditAgent

# Setup
orchestrator = WorkflowOrchestrator(workflow_id="incident_response")
orchestrator.add_agent(DetectionAgent())
orchestrator.add_agent(TriageAgent())
orchestrator.add_agent(ResolutionAgent())
orchestrator.add_agent(AuditAgent())

# Create context
identity = IdentityContext(agent_id="responder", user_id="ops_team")
intent = IntentContext(primary_intent="resolve_incident", priority="critical")
context = AgentContext(identity=identity, intent=intent)

context.payload.input_data = {
    "error_rate": 0.25,
    "resource_usage": {"memory": 0.98, "cpu": 0.95}
}
context.security.audit_required = True

# Execute
result = orchestrator.execute(context)

# Results
print(f"Detections: {result.payload.output_data['detection_count']}")
print(f"Resolved: {result.payload.output_data['resolved_count']}")
print(f"Audit ID: {result.payload.output_data['audit_report']['audit_id']}")
```

### Example 3: Custom Agent

```python
from agentic_workflow.agent_base import Agent
from agentic_workflow.context import AgentContext

class CustomAnalysisAgent(Agent):
    def process(self, context: AgentContext) -> AgentContext:
        # Update state
        context.update_state("analyzing")

        # Get input
        data = context.payload.input_data

        # Perform analysis
        analysis_result = self.analyze(data)

        # Add results to context
        context.payload.output_data["analysis"] = analysis_result

        # Add knowledge
        context.add_knowledge_fact("analysis_complete", True, confidence=1.0)

        # Update state
        context.update_state("analysis_complete")

        return context

    def analyze(self, data):
        # Your analysis logic here
        return {"status": "analyzed"}
```

### Example 4: Policy Enforcement

```python
from agentic_workflow.policy import PolicyEngine, PolicyRule, PolicyAction, EscalationLevel

engine = PolicyEngine()

# Add custom policy
engine.add_rule(PolicyRule(
    rule_id="security_check",
    name="Confidential Data Encryption",
    description="Confidential data must be encrypted",
    condition=lambda ctx: (
        ctx.get("security", {}).get("data_classification") == "confidential" and
        not ctx.get("security", {}).get("encryption_required")
    ),
    action=PolicyAction.ESCALATE,
    escalation_level=EscalationLevel.CRITICAL,
    priority=100
))

# Register escalation handler
def handle_critical_escalation(event):
    print(f"CRITICAL: {event.reason}")
    # Send alert, page on-call, etc.

engine.register_escalation_handler(
    EscalationLevel.CRITICAL,
    handle_critical_escalation
)

# Evaluate
violations = engine.get_violations(context.to_dict())
```

## Testing

Run tests with pytest:

```bash
# Install test dependencies
pip install pytest pytest-cov

# Run all tests
pytest agentic_workflow/tests/

# Run with coverage
pytest --cov=agentic_workflow agentic_workflow/tests/

# Run specific test file
pytest agentic_workflow/tests/test_context.py
```

## Best Practices

### 1. Always Initialize Required Context

```python
identity = IdentityContext(agent_id="my_agent")
context = AgentContext(identity=identity)
```

### 2. Use State Transitions

```python
context.update_state("processing", {"step": 1})
```

### 3. Add Telemetry Events

```python
context.add_telemetry_event("custom_event", {"detail": "value"})
```

### 4. Track Knowledge with Confidence

```python
context.add_knowledge_fact("key", value, confidence=0.95)
```

### 5. Implement Error Handling

```python
try:
    result = agent.execute(context)
except Exception as e:
    # Handle error
    context.update_state("error", {"error": str(e)})
```

### 6. Use Policy Engine

Always check policies before critical operations.

### 7. Generate Audit Reports

For compliance, always run AuditAgent as final step.

## Security Considerations

1. **Sensitive Data**: Use `SecurityContext.sensitive_fields` and `utils.sanitize_sensitive_data()`
2. **Encryption**: Set `SecurityContext.encryption_required = True` for confidential data
3. **Audit Trail**: Enable `SecurityContext.audit_required = True` for compliance
4. **Policy Enforcement**: Use PolicyEngine to enforce security policies
5. **Access Control**: Leverage `IdentityContext.permissions` for authorization

## Performance Tips

1. **Parallel Execution**: Use `execute_parallel()` for independent agents
2. **Context Size**: Keep `payload.intermediate_results` lean
3. **Telemetry**: Disable console output in production: `TelemetryCollector(enable_console_output=False)`
4. **State History**: Limit state transitions for long-running workflows

## License

Copyright (c) 2025, HUMMBL, LLC

Licensed under the Business Source License 1.1 (BSL 1.1)
Change Date: 2029-01-01
Change License: Apache License, Version 2.0

See LICENSE file for full details.

## Contributing

Please follow the contribution guidelines in the main repository CONTRIBUTING.md file.

## Support

For issues, questions, or contributions:

- GitHub Issues: https://github.com/hummbl-dev/engine-ops/issues
- Email: hummbldev@gmail.com
