# Quick Start Guide - Agentic Workflow System

## Installation

The system is ready to use - no additional dependencies beyond Python standard library are required for core functionality. For testing:

```bash
pip install pytest pytest-cov
```

## 5-Minute Quick Start

### 1. Basic Workflow Execution

```python
from agentic_workflow import WorkflowOrchestrator, AgentContext
from agentic_workflow.context import IdentityContext
from agentic_workflow.agents import DetectionAgent

# Create workflow
orchestrator = WorkflowOrchestrator(workflow_id="my_workflow")
orchestrator.add_agent(DetectionAgent())

# Create context
identity = IdentityContext(agent_id="my_agent")
context = AgentContext(identity=identity)
context.payload.input_data = {"error_rate": 0.10}

# Execute
result = orchestrator.execute(context)
print(f"Found {len(result.payload.output_data['detections'])} issues")
```

### 2. Complete Incident Response

```python
from agentic_workflow import WorkflowOrchestrator, AgentContext
from agentic_workflow.context import IdentityContext, IntentContext
from agentic_workflow.agents import (
    DetectionAgent, TriageAgent, ResolutionAgent, AuditAgent, ArchitectAgent
)

# Setup workflow
orchestrator = WorkflowOrchestrator(workflow_id="incident_response")
orchestrator.add_agent(DetectionAgent())
orchestrator.add_agent(TriageAgent())
orchestrator.add_agent(ResolutionAgent())
orchestrator.add_agent(AuditAgent())

# Create context with intent
identity = IdentityContext(agent_id="responder", user_id="ops_team")
intent = IntentContext(primary_intent="resolve_incident", priority="critical")
context = AgentContext(identity=identity, intent=intent)

# Add incident data
context.payload.input_data = {
    "error_rate": 0.25,
    "resource_usage": {"memory": 0.98, "cpu": 0.95}
}

# Execute
result = orchestrator.execute(context)

# Access results
audit = result.payload.output_data["audit_report"]
print(f"Resolved: {result.payload.output_data['resolved_count']}")
print(f"Audit ID: {audit['audit_id']}")
```

### 3. Custom Agent

```python
from agentic_workflow.agent_base import Agent
from agentic_workflow.context import AgentContext

class MyAgent(Agent):
    def process(self, context: AgentContext) -> AgentContext:
        # Your logic here
        context.update_state("my_processing")
        
        # Access input
        data = context.payload.input_data
        
        # Add output
        context.payload.output_data["my_result"] = "processed"
        
        # Update state
        context.update_state("my_complete")
        return context

# Use it
agent = MyAgent(agent_id="my_custom_agent")
result = agent.execute(context)
```

### 4. Code Generation with ArchitectAgent

```python
from agentic_workflow.agents import ArchitectAgent
from agentic_workflow.context import AgentContext, IdentityContext

# Create architect agent
architect = ArchitectAgent(workspace_dir="sandbox")

# Create context for code generation
identity = IdentityContext(agent_id="architect", user_id="developer")
context = AgentContext(identity=identity)
context.update_state("mode", "generate")
context.update_state("request", "Create a Python function that calculates fibonacci numbers")

# Generate code (TDD approach: tests first, then implementation)
result = architect.process(context)

# Access generated code
test_file = result.state.get("architect_result", {}).get("test_file")
impl_file = result.state.get("architect_result", {}).get("impl_file")
print(f"Generated test: {test_file}")
print(f"Generated implementation: {impl_file}")
```

### 5. Policy Enforcement

```python
from agentic_workflow.policy import PolicyEngine, PolicyRule, PolicyAction

engine = PolicyEngine()

# Add custom policy
engine.add_rule(PolicyRule(
    rule_id="data_size_check",
    name="Data Size Limit",
    description="Max 1GB data size",
    condition=lambda ctx: ctx.get("payload", {}).get("data_size_bytes", 0) > 1_000_000_000,
    action=PolicyAction.DENY,
    priority=100
))

# Check violations
violations = engine.get_violations(context.to_dict())
if violations:
    print("Policy violated!")
```

## Context Types Reference

### Essential Context Fields

```python
# Identity - who is running this
context.identity.agent_id = "my_agent"
context.identity.user_id = "user123"

# State - current workflow state
context.update_state("processing", {"step": 1})

# Intent - what we're trying to do
context.intent.primary_intent = "detect_issues"
context.intent.priority = "high"  # low, normal, high, critical

# Payload - the actual data
context.payload.input_data = {"key": "value"}
context.payload.output_data["result"] = "done"

# Security - security requirements
context.security.data_classification = "confidential"
context.security.encryption_required = True

# Knowledge - learned information
context.add_knowledge_fact("key", value, confidence=0.9)
```

## Running Tests

```bash
# Run all tests
pytest agentic_workflow/tests/

# Run with coverage
pytest --cov=agentic_workflow agentic_workflow/tests/

# Run specific test
pytest agentic_workflow/tests/test_workflow.py
```

## Common Patterns

### Pattern 1: Sequential Agents
```python
orchestrator = WorkflowOrchestrator(workflow_id="seq")
orchestrator.add_agent(Agent1())
orchestrator.add_agent(Agent2())
orchestrator.add_agent(Agent3())
result = orchestrator.execute(context)
```

### Pattern 2: Parallel Groups
```python
result = orchestrator.execute_parallel(
    context,
    agent_groups=[
        [Agent1(), Agent2()],  # Group 1: parallel
        [Agent3()]              # Group 2: after group 1
    ]
)
```

### Pattern 3: Child Context
```python
child = parent_context.clone_for_child()
# Child has new IDs, references parent
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [examples in tests](tests/) for more patterns
- Implement your custom agents
- Add your own policies

## Troubleshooting

**Q: How do I access telemetry?**
```python
from agentic_workflow.telemetry import get_telemetry_collector
telemetry = get_telemetry_collector()
logs = telemetry.get_logs()
```

**Q: How do I validate context?**
```python
from agentic_workflow.utils import validate_context_completeness
is_valid, missing = validate_context_completeness(context)
```

**Q: How do I format audit reports?**
```python
from agentic_workflow.utils import format_audit_summary
report = format_audit_summary(audit_report)
print(report)
```

## License

Copyright (c) 2025, HUMMBL, LLC - Licensed under BSL 1.1
