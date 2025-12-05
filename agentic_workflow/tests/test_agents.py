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

"""Tests for agent implementations."""

import pytest
from ..context import AgentContext, IdentityContext
from ..agent_base import Agent
from ..agents.detection_agent import DetectionAgent
from ..agents.triage_agent import TriageAgent
from ..agents.resolution_agent import ResolutionAgent
from ..agents.audit_agent import AuditAgent
from ..telemetry import TelemetryCollector


class TestDetectionAgent:
    """Tests for DetectionAgent."""

    def test_detection_agent_creation(self):
        """Test creating a detection agent."""
        agent = DetectionAgent()
        assert agent.agent_id == "detection_agent"

    def test_detection_with_high_error_rate(self):
        """Test detection of high error rate."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.payload.input_data = {"error_rate": 0.10}

        agent = DetectionAgent()
        result = agent.execute(context)

        detections = result.payload.output_data.get("detections", [])
        assert len(detections) > 0
        assert any(d["rule_id"] == "high_error_rate" for d in detections)

    def test_detection_with_resource_exhaustion(self):
        """Test detection of resource exhaustion."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.payload.input_data = {"resource_usage": {"memory": 0.95, "cpu": 0.92}}

        agent = DetectionAgent()
        result = agent.execute(context)

        detections = result.payload.output_data.get("detections", [])
        assert len(detections) >= 2  # Should detect both memory and CPU
        assert any("memory" in d["details"].get("resource", "") for d in detections)

    def test_detection_no_issues(self):
        """Test detection when no issues are present."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.payload.input_data = {"error_rate": 0.01, "resource_usage": {"memory": 0.50}}

        agent = DetectionAgent()
        result = agent.execute(context)

        detections = result.payload.output_data.get("detections", [])
        assert len(detections) == 0


class TestTriageAgent:
    """Tests for TriageAgent."""

    def test_triage_agent_creation(self):
        """Test creating a triage agent."""
        agent = TriageAgent()
        assert agent.agent_id == "triage_agent"

    def test_triage_prioritization(self):
        """Test triage prioritization logic."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.payload.output_data = {
            "detections": [
                {"rule_id": "high_error_rate", "severity": "high", "confidence": 0.9},
                {"rule_id": "resource_exhaustion", "severity": "critical", "confidence": 0.95},
                {"rule_id": "anomalous_pattern", "severity": "low", "confidence": 0.6},
            ]
        }

        agent = TriageAgent()
        result = agent.execute(context)

        prioritized = result.payload.output_data.get("prioritized_issues", [])
        assert len(prioritized) == 3

        # Critical should be first
        assert prioritized[0]["severity"] == "critical"
        assert prioritized[0]["priority"] == "critical"

        # Should have assigned resolution paths
        assert all("resolution_path" in issue for issue in prioritized)

    def test_triage_empty_detections(self):
        """Test triage with no detections."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.payload.output_data = {"detections": []}

        agent = TriageAgent()
        result = agent.execute(context)

        assert result.state.current_state == "triage_complete"


class TestResolutionAgent:
    """Tests for ResolutionAgent."""

    def test_resolution_agent_creation(self):
        """Test creating a resolution agent."""
        agent = ResolutionAgent()
        assert agent.agent_id == "resolution_agent"

    def test_resolution_with_immediate_escalation(self):
        """Test resolution with immediate escalation path."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.payload.output_data = {
            "prioritized_issues": [
                {
                    "rule_id": "critical_issue",
                    "severity": "critical",
                    "priority": "critical",
                    "resolution_path": "immediate_escalation",
                }
            ]
        }

        agent = ResolutionAgent()
        result = agent.execute(context)

        resolution_results = result.payload.output_data.get("resolution_results", {})
        assert resolution_results.get("resolved_count", 0) >= 1

        resolved = resolution_results.get("resolved", [])
        assert len(resolved) > 0
        assert resolved[0]["resolution_status"] == "resolved"

    def test_resolution_success_rate(self):
        """Test resolution success rate calculation."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.payload.output_data = {
            "prioritized_issues": [
                {
                    "rule_id": "issue1",
                    "resolution_path": "resource_optimization",
                    "details": {"resource": "memory"},
                },
                {
                    "rule_id": "issue2",
                    "resolution_path": "error_mitigation",
                    "details": {"error_rate": 0.1},
                },
            ]
        }

        agent = ResolutionAgent()
        result = agent.execute(context)

        resolution_results = result.payload.output_data.get("resolution_results", {})
        assert "success_rate" in resolution_results
        assert 0.0 <= resolution_results["success_rate"] <= 1.0


class TestAuditAgent:
    """Tests for AuditAgent."""

    def test_audit_agent_creation(self):
        """Test creating an audit agent."""
        agent = AuditAgent()
        assert agent.agent_id == "audit_agent"

    def test_audit_report_generation(self):
        """Test audit report generation."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.update_state("processing")
        context.update_state("complete")
        context.payload.output_data = {
            "detections": [{"id": 1}],
            "resolved_count": 1,
            "failed_count": 0,
        }

        agent = AuditAgent()
        result = agent.execute(context)

        audit_report = result.payload.output_data.get("audit_report", {})
        assert "audit_id" in audit_report
        assert "trace_id" in audit_report
        assert "workflow_info" in audit_report
        assert "execution_summary" in audit_report
        assert "compliance_status" in audit_report

        # Check workflow info
        workflow_info = audit_report["workflow_info"]
        assert "duration_seconds" in workflow_info
        assert "state_transitions" in workflow_info

    def test_compliance_records(self):
        """Test compliance records creation."""
        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)
        context.policy.applicable_policies = ["policy1", "policy2"]
        context.security.audit_required = True

        agent = AuditAgent()
        result = agent.execute(context)

        compliance_records = result.payload.output_data.get("compliance_records", [])
        assert len(compliance_records) > 0


class TestAgentBase:
    """Tests for base Agent class."""

    def test_agent_lifecycle(self):
        """Test agent execution lifecycle."""

        class TestAgent(Agent):
            def process(self, context):
                context.update_state("test_processed")
                return context

        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)

        agent = TestAgent(agent_id="test_agent")
        result = agent.execute(context)

        assert result.state.current_state == "test_processed"
        assert result.identity.agent_id == "test_agent"

    def test_agent_error_handling(self):
        """Test agent error handling."""

        class FailingAgent(Agent):
            def process(self, context):
                raise ValueError("Test error")

        identity = IdentityContext(agent_id="test")
        context = AgentContext(identity=identity)

        agent = FailingAgent(agent_id="failing_agent")

        with pytest.raises(ValueError):
            agent.execute(context)

        # Context should be updated with error state
        assert context.state.current_state == "error"
