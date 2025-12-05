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

"""Tests for context module."""

import pytest
from datetime import datetime
from ..context import (
    AgentContext,
    IdentityContext,
    StateContext,
    SessionContext,
    IntentContext,
    PolicyContext,
    TelemetryContext,
    KnowledgeContext,
    DependenciesContext,
    AnnotationContext,
    SecurityContext,
    ResourceContext,
    TemporalContext,
    PayloadContext,
    RelationshipContext,
    TopologyContext,
)


class TestIdentityContext:
    """Tests for IdentityContext."""

    def test_identity_creation(self):
        """Test creating an identity context."""
        identity = IdentityContext(
            agent_id="test_agent", user_id="user123", organization_id="org456"
        )
        assert identity.agent_id == "test_agent"
        assert identity.user_id == "user123"
        assert identity.organization_id == "org456"


class TestAgentContext:
    """Tests for AgentContext."""

    def test_context_creation(self):
        """Test creating a complete agent context."""
        identity = IdentityContext(agent_id="test_agent")
        context = AgentContext(identity=identity)

        assert context.identity.agent_id == "test_agent"
        assert context.state.current_state == "initialized"
        assert context.session.session_id is not None
        assert context.telemetry.trace_id is not None

    def test_update_state(self):
        """Test state update functionality."""
        identity = IdentityContext(agent_id="test_agent")
        context = AgentContext(identity=identity)

        initial_state = context.state.current_state
        context.update_state("processing", {"step": 1})

        assert context.state.current_state == "processing"
        assert context.state.previous_state == initial_state
        assert len(context.state.state_history) == 1
        assert context.state.state_history[0]["to_state"] == "processing"

    def test_add_telemetry_event(self):
        """Test adding telemetry events."""
        identity = IdentityContext(agent_id="test_agent")
        context = AgentContext(identity=identity)

        context.add_telemetry_event("test_event", {"key": "value"})

        assert len(context.telemetry.events) == 1
        assert context.telemetry.events[0]["type"] == "test_event"
        assert context.telemetry.events[0]["data"]["key"] == "value"

    def test_add_knowledge_fact(self):
        """Test adding knowledge facts."""
        identity = IdentityContext(agent_id="test_agent")
        context = AgentContext(identity=identity)

        context.add_knowledge_fact("test_fact", "test_value", confidence=0.95)

        assert context.knowledge.facts["test_fact"] == "test_value"
        assert context.knowledge.confidence_scores["test_fact"] == 0.95

    def test_clone_for_child(self):
        """Test cloning context for child operations."""
        identity = IdentityContext(agent_id="parent_agent")
        parent_context = AgentContext(identity=identity)
        parent_context.payload.input_data = {"key": "value"}
        parent_context.update_state("processing")

        child_context = parent_context.clone_for_child()

        # Should have new session and span IDs
        assert child_context.session.session_id != parent_context.session.session_id
        assert child_context.telemetry.span_id != parent_context.telemetry.span_id

        # Should reference parent
        assert child_context.telemetry.parent_span_id == parent_context.telemetry.span_id
        assert child_context.relationship.parent_context_id == parent_context.session.session_id

        # Should have cleared output data
        assert len(child_context.payload.output_data) == 0

    def test_to_dict(self):
        """Test converting context to dictionary."""
        identity = IdentityContext(agent_id="test_agent")
        context = AgentContext(identity=identity)

        context_dict = context.to_dict()

        assert isinstance(context_dict, dict)
        assert "identity" in context_dict
        assert "state" in context_dict
        assert "session" in context_dict
        assert context_dict["identity"]["agent_id"] == "test_agent"


class TestIntentContext:
    """Tests for IntentContext."""

    def test_intent_creation(self):
        """Test creating an intent context."""
        intent = IntentContext(
            primary_intent="detect_anomalies",
            sub_intents=["analyze_metrics", "check_thresholds"],
            priority="high",
        )

        assert intent.primary_intent == "detect_anomalies"
        assert len(intent.sub_intents) == 2
        assert intent.priority == "high"


class TestSecurityContext:
    """Tests for SecurityContext."""

    def test_security_defaults(self):
        """Test security context defaults."""
        security = SecurityContext()

        assert security.encryption_required is False
        assert security.data_classification == "internal"
        assert security.audit_required is True

    def test_security_with_sensitive_fields(self):
        """Test security context with sensitive fields."""
        security = SecurityContext(
            encryption_required=True,
            data_classification="confidential",
            sensitive_fields=["password", "ssn"],
        )

        assert security.encryption_required is True
        assert len(security.sensitive_fields) == 2


class TestPayloadContext:
    """Tests for PayloadContext."""

    def test_payload_data_flow(self):
        """Test payload data flow."""
        payload = PayloadContext()

        payload.input_data = {"input": "test"}
        payload.output_data = {"result": "success"}
        payload.intermediate_results.append({"step1": "done"})

        assert payload.input_data["input"] == "test"
        assert payload.output_data["result"] == "success"
        assert len(payload.intermediate_results) == 1
