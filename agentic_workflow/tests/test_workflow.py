# Copyright (c) 2025, HUMMBL, LLC
#
# Licensed under the Business Source License 1.1 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://github.com/hummbl-dev/engine-ops/blob/main/LICENSE
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
# Change Date: 2029-01-01
# Change License: Apache License, Version 2.0

"""Tests for workflow orchestration."""

import pytest
from ..context import AgentContext, IdentityContext, IntentContext
from ..workflow import WorkflowOrchestrator
from ..agents.detection_agent import DetectionAgent
from ..agents.triage_agent import TriageAgent
from ..agents.resolution_agent import ResolutionAgent
from ..agents.audit_agent import AuditAgent
from ..policy import PolicyEngine
from ..telemetry import TelemetryCollector


class TestWorkflowOrchestrator:
    """Tests for WorkflowOrchestrator."""

    def test_orchestrator_creation(self):
        """Test creating a workflow orchestrator."""
        orchestrator = WorkflowOrchestrator(workflow_id="test_workflow")
        assert orchestrator.workflow_id == "test_workflow"
        assert len(orchestrator.agents) == 0

    def test_add_agent(self):
        """Test adding agents to workflow."""
        orchestrator = WorkflowOrchestrator(workflow_id="test_workflow")
        agent = DetectionAgent()

        orchestrator.add_agent(agent)
        assert len(orchestrator.agents) == 1
        assert orchestrator.agents[0] == agent

    def test_simple_workflow_execution(self):
        """Test executing a simple workflow."""
        orchestrator = WorkflowOrchestrator(workflow_id="test_workflow")

        # Add detection agent
        orchestrator.add_agent(DetectionAgent())

        # Create context with test data
        identity = IdentityContext(agent_id="test")
        intent = IntentContext(primary_intent="detect_issues", priority="high")
        context = AgentContext(identity=identity, intent=intent)
        context.payload.input_data = {"error_rate": 0.10, "resource_usage": {"memory": 0.95}}

        # Execute workflow
        result = orchestrator.execute(context)

        # Should have detections
        detections = result.payload.output_data.get("detections", [])
        assert len(detections) > 0
        assert result.state.current_state == "workflow_complete"

    def test_full_workflow_execution(self):
        """Test executing a complete workflow with all agents."""
        orchestrator = WorkflowOrchestrator(workflow_id="full_workflow")

        # Add all agents in sequence
        orchestrator.add_agent(DetectionAgent())
        orchestrator.add_agent(TriageAgent())
        orchestrator.add_agent(ResolutionAgent())
        orchestrator.add_agent(AuditAgent())

        # Create context
        identity = IdentityContext(agent_id="test", user_id="user123")
        intent = IntentContext(primary_intent="incident_response", priority="critical")
        context = AgentContext(identity=identity, intent=intent)
        context.payload.input_data = {
            "error_rate": 0.15,
            "resource_usage": {"memory": 0.92, "cpu": 0.88},
            "metrics": {"latency": 5000},
        }

        # Execute workflow
        result = orchestrator.execute(context)

        # Verify each stage completed
        assert "detections" in result.payload.output_data
        assert "prioritized_issues" in result.payload.output_data
        assert "resolution_results" in result.payload.output_data
        assert "audit_report" in result.payload.output_data

        # Verify final state
        assert result.state.current_state == "workflow_complete"

        # Verify state history shows all transitions
        state_history = result.state.state_history
        assert len(state_history) > 0

    def test_workflow_with_policy_violation(self):
        """Test workflow execution with policy violations."""
        from ..policy import PolicyAction, PolicyRule

        # Create policy engine with a deny rule
        policy_engine = PolicyEngine()
        policy_engine.add_rule(
            PolicyRule(
                rule_id="test_deny",
                name="Test Deny",
                description="Always deny",
                condition=lambda ctx: True,
                action=PolicyAction.DENY,
                escalation_level=None,
                priority=100,
                metadata={},
            )
        )

        orchestrator = WorkflowOrchestrator(
            workflow_id="test_workflow", policy_engine=policy_engine
        )
        orchestrator.add_agent(DetectionAgent())

        # Create context
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)

        # Execute workflow - should stop due to policy violation
        result = orchestrator.execute(context)

        assert result.state.current_state == "policy_violation"

    def test_workflow_error_handling(self):
        """Test workflow error handling."""
        from ..agent_base import Agent

        class FailingAgent(Agent):
            def process(self, context):
                raise RuntimeError("Test error")

        orchestrator = WorkflowOrchestrator(workflow_id="test_workflow")
        orchestrator.add_agent(FailingAgent(agent_id="failing"))

        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)

        # Execute workflow with stop_on_error - should catch error and stop
        result = orchestrator.execute(context, stop_on_error=True)

        # Workflow should have failed state
        assert result.state.current_state == "workflow_failed"

    def test_get_agent_by_id(self):
        """Test retrieving agent by ID."""
        orchestrator = WorkflowOrchestrator(workflow_id="test_workflow")

        agent1 = DetectionAgent(agent_id="detection1")
        agent2 = TriageAgent(agent_id="triage1")

        orchestrator.add_agent(agent1)
        orchestrator.add_agent(agent2)

        found = orchestrator.get_agent_by_id("detection1")
        assert found == agent1

        not_found = orchestrator.get_agent_by_id("nonexistent")
        assert not_found is None

    def test_clear_agents(self):
        """Test clearing agents from workflow."""
        orchestrator = WorkflowOrchestrator(workflow_id="test_workflow")

        orchestrator.add_agent(DetectionAgent())
        orchestrator.add_agent(TriageAgent())

        assert len(orchestrator.agents) == 2

        orchestrator.clear_agents()
        assert len(orchestrator.agents) == 0

    def test_parallel_workflow_execution(self):
        """Test parallel workflow execution."""
        orchestrator = WorkflowOrchestrator(workflow_id="parallel_workflow")

        # Create two detection agents for parallel execution
        agent1 = DetectionAgent(agent_id="detector1")
        agent2 = DetectionAgent(agent_id="detector2")

        # Create context
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.payload.input_data = {"error_rate": 0.10}

        # Execute in parallel groups
        result = orchestrator.execute_parallel(context, agent_groups=[[agent1, agent2]])

        assert result.state.current_state == "parallel_workflow_complete"

    def test_workflow_context_propagation(self):
        """Test that context is properly propagated through workflow."""
        orchestrator = WorkflowOrchestrator(workflow_id="propagation_test")

        orchestrator.add_agent(DetectionAgent())
        orchestrator.add_agent(TriageAgent())

        # Create context with specific trace ID
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        initial_trace_id = context.telemetry.trace_id
        context.payload.input_data = {"error_rate": 0.10}

        result = orchestrator.execute(context)

        # Trace ID should be preserved
        assert result.telemetry.trace_id == initial_trace_id

        # Should have state history from workflow execution
        assert len(result.state.state_history) > 0


class TestWorkflowIntegration:
    """Integration tests for complete workflows."""

    def test_incident_response_workflow(self):
        """Test a complete incident response workflow."""
        # Create workflow
        orchestrator = WorkflowOrchestrator(workflow_id="incident_response")
        orchestrator.add_agent(DetectionAgent())
        orchestrator.add_agent(TriageAgent())
        orchestrator.add_agent(ResolutionAgent())
        orchestrator.add_agent(AuditAgent())

        # Create realistic incident data
        identity = IdentityContext(
            agent_id="incident_responder", user_id="operator123", organization_id="org456"
        )
        intent = IntentContext(
            primary_intent="resolve_incident",
            priority="critical",
            goals=["detect", "triage", "resolve", "audit"],
        )
        context = AgentContext(identity=identity, intent=intent)
        context.payload.input_data = {
            "error_rate": 0.25,
            "resource_usage": {"memory": 0.98, "cpu": 0.95, "disk": 0.89},
            "metrics": {"latency": 10000, "throughput": -50},
        }
        context.security.data_classification = "confidential"
        context.security.audit_required = True

        # Execute workflow
        result = orchestrator.execute(context)

        # Verify complete execution
        assert result.state.current_state == "workflow_complete"

        # Verify all stages produced results
        assert len(result.payload.output_data.get("detections", [])) > 0
        assert len(result.payload.output_data.get("prioritized_issues", [])) > 0
        assert result.payload.output_data.get("resolved_count", 0) >= 0
        assert "audit_report" in result.payload.output_data

        # Verify audit report has proper structure
        audit = result.payload.output_data["audit_report"]
        assert audit["compliance_status"] in [
            "compliant",
            "non_compliant_approval_missing",
            "non_compliant_no_telemetry",
        ]
        assert len(audit["state_history"]) > 0

        # Verify knowledge was accumulated
        assert len(result.knowledge.facts) > 0

        # Verify annotations were added
        assert (
            "issues_detected" in result.annotation.tags
            or len(result.payload.output_data.get("detections", [])) == 0
        )
