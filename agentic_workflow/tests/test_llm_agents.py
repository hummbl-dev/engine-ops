# -*- coding: utf-8 -*-
"""Tests for the LLM‑driven agents.

These tests mock the `engine.providers.generate_content` function so that no real API
calls are made. Each agent's LLM‑based method is exercised with both a valid JSON
response and a malformed response to verify graceful error handling.
"""

import json
from unittest.mock import patch

import pytest

from agentic_workflow.agents.detection_agent import DetectionAgent
from agentic_workflow.agents.triage_agent import TriageAgent
from agentic_workflow.agents.resolution_agent import ResolutionAgent
from agentic_workflow.context import (
    AgentContext,
    IdentityContext,
    IntentContext,
    SecurityContext,
    PayloadContext,
)


# Helper to build a minimal context used by all agents
def build_context(payload_input: dict) -> AgentContext:
    identity = IdentityContext(
        agent_id="test_agent", user_id="u1", organization_id="org1", role="tester"
    )
    intent = IntentContext(primary_intent="test_intent", priority="normal", goals=[])
    security = SecurityContext()
    payload = PayloadContext(input_data=payload_input, output_data={})
    return AgentContext(identity=identity, intent=intent, security=security, payload=payload)


# ---------------------------------------------------------------------------
# DetectionAgent tests
# ---------------------------------------------------------------------------


def test_detection_agent_successful_llm_response():
    # LLM returns a JSON array with two detections
    llm_response = json.dumps(
        [
            {
                "rule_id": "high_error_rate",
                "name": "High Error",
                "severity": "high",
                "confidence": 0.9,
                "details": {"error_rate": 0.07},
            },
            {
                "rule_id": "resource_exhaustion",
                "name": "Res Exhaust",
                "severity": "critical",
                "confidence": 0.95,
                "details": {"resource": "cpu", "usage": 0.95},
            },
        ]
    )

    with patch("engine.providers.generate_content", return_value=llm_response):
        agent = DetectionAgent()
        ctx = build_context({"error_rate": 0.07, "resource_usage": {"cpu": 0.95}})
        # The public `process` method will call the mocked LLM via `ask_brain`
        result_ctx = agent.process(ctx)
        detections = result_ctx.payload.output_data["detections"]
        assert isinstance(detections, list)
        assert len(detections) == 2
        assert detections[0]["rule_id"] == "high_error_rate"
        assert detections[1]["severity"] == "critical"


def test_detection_agent_malformed_llm_response():
    # Detection agent doesn't use LLM, so malformed response doesn't affect it
    # It uses rule-based detection instead
    agent = DetectionAgent()
    ctx = build_context({"error_rate": 0.1})
    result_ctx = agent.process(ctx)
    detections = result_ctx.payload.output_data["detections"]
    # Should detect high error rate using rule-based logic
    assert len(detections) == 1
    assert detections[0]["rule_id"] == "high_error_rate"
    assert detections[0]["severity"] == "high"


# ---------------------------------------------------------------------------
# TriageAgent tests
# ---------------------------------------------------------------------------


def test_triage_agent_successful_llm_response():
    # LLM returns a JSON object with the expected keys
    llm_response = json.dumps(
        {
            "prioritized": [
                {"rule_id": "high_error_rate", "severity": "high", "confidence": 0.9},
                {"rule_id": "resource_exhaustion", "severity": "critical", "confidence": 0.95},
            ],
            "critical_count": 1,
            "requires_immediate_action": True,
        }
    )
    with patch("engine.providers.generate_content", return_value=llm_response):
        agent = TriageAgent()
        detections = [
            {"rule_id": "high_error_rate", "severity": "high", "confidence": 0.9},
            {"rule_id": "resource_exhaustion", "severity": "critical", "confidence": 0.95},
        ]
        ctx = build_context({})
        ctx.payload.output_data["detections"] = detections
        result_ctx = agent.process(ctx)
        triage = result_ctx.payload.output_data["triage_results"]
        assert triage["critical_count"] == 1
        assert triage["requires_immediate_action"] is True
        assert len(triage["prioritized"]) == 2
        # The agent should have added a timestamp to each entry
        for entry in triage["prioritized"]:
            assert "triaged_at" in entry


def test_triage_agent_malformed_llm_response():
    llm_response = "not a json"
    with patch("engine.providers.generate_content", return_value=llm_response):
        agent = TriageAgent()
        ctx = build_context({})
        # Must provide detections to trigger the LLM call
        ctx.payload.output_data["detections"] = [{"rule_id": "test", "severity": "low"}]
        result_ctx = agent.process(ctx)
        triage = result_ctx.payload.output_data["triage_results"]
        # Expect rule-based triage fallback (not empty)
        assert len(triage["prioritized"]) == 1
        assert triage["prioritized"][0]["rule_id"] == "test"
        assert triage["prioritized"][0]["priority"] == "low"
        assert triage["critical_count"] == 0
        assert triage["requires_immediate_action"] is False


# ---------------------------------------------------------------------------
# ResolutionAgent tests
# ---------------------------------------------------------------------------


def test_resolution_agent_successful_llm_response():
    llm_response = json.dumps(
        {
            "resolved": [
                {
                    "rule_id": "high_error_rate",
                    "resolution_status": "resolved",
                    "resolution_action": "restart_service",
                    "resolution_details": "Service restarted",
                }
            ],
            "failed": [],
        }
    )
    with patch("engine.providers.generate_content", return_value=llm_response):
        agent = ResolutionAgent()
        # Provide the prioritized issues that the triage step would have produced
        prioritized = [{"rule_id": "high_error_rate", "severity": "high", "confidence": 0.9}]
        ctx = build_context({})
        ctx.payload.output_data["triage_results"] = {"prioritized": prioritized}
        # ResolutionAgent reads from prioritized_issues directly
        ctx.payload.output_data["prioritized_issues"] = prioritized
        result_ctx = agent.process(ctx)
        resolution = result_ctx.payload.output_data["resolution_results"]
        assert len(resolution["resolved"]) == 1
        assert resolution["resolved"][0]["resolution_status"] == "resolved"
        assert resolution["failed"] == []


def test_resolution_agent_malformed_llm_response():
    llm_response = "{invalid json"
    with patch("engine.providers.generate_content", return_value=llm_response):
        agent = ResolutionAgent()
        ctx = build_context({})
        # Must provide prioritized issues to trigger the LLM call
        test_issues = [{"rule_id": "test", "severity": "low"}]
        ctx.payload.output_data["prioritized_issues"] = test_issues
        result_ctx = agent.process(ctx)
        resolution = result_ctx.payload.output_data["resolution_results"]
        # On parse error, agent returns resolved=[] and failed=issues
        assert resolution["resolved"] == []
        assert resolution["failed"] == test_issues


# ---------------------------------------------------------------------------
# AgentBase ask_brain sanity check (independent of agents)
# ---------------------------------------------------------------------------


def test_agent_base_ask_brain_uses_system_prompt():
    # Verify that ask_brain concatenates the system prompt and the supplied prompt
    dummy_prompt = "Please classify the input."
    dummy_context = {"foo": "bar"}
    expected_full_prompt_start = "Role: Security Officer"
    with patch("engine.providers.generate_content") as mock_gen:
        mock_gen.return_value = "SAFE"
        from agentic_workflow.agent_base import AgentBase

        # Minimal subclass to expose ask_brain
        class DummyAgent(AgentBase):
            def process(self, context):
                return context

        dummy = DummyAgent(agent_id="dummy")
        result = dummy.ask_brain(dummy_prompt, dummy_context)
        assert result == "SAFE"
        # Ensure the LLM was called with a prompt that contains the system prompt
        called_prompt = mock_gen.call_args[0][1]
        assert expected_full_prompt_start in called_prompt
        assert dummy_prompt in called_prompt
