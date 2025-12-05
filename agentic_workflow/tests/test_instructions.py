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

"""Tests for agent instructions."""

import pytest
from ..instructions import get_instructions, SystemPrompt
from ..agents.detection_agent import DetectionAgent
from ..agents.triage_agent import TriageAgent


class TestInstructions:
    """Tests for instruction system."""

    def test_get_instructions(self):
        """Test retrieving instructions by ID."""
        instructions = get_instructions("detection_agent")
        assert instructions.name == "Sovereign Detector"
        assert "Anomaly Detection Specialist" in instructions.role

        # Test default
        default = get_instructions("unknown_agent")
        assert default.name == "Generic Agent"

    def test_system_prompt_formatting(self):
        """Test formatting of system prompt."""
        prompt = SystemPrompt(
            name="Test Bot",
            role="Tester",
            mission="To test things.",
            capabilities=["Run tests", "Report results"],
            constraints=["Do not fail"],
            tone="Cheery",
        )

        formatted = prompt.to_prompt_string()

        assert "Name: Test Bot" in formatted
        assert "Role: Tester" in formatted
        assert "# MISSION" in formatted
        assert "To test things." in formatted
        assert "- Run tests" in formatted
        assert "- Do not fail" in formatted
        assert "# TONE" in formatted
        assert "Cheery" in formatted


class TestAgentIntegration:
    """Test integration of instructions into agents."""

    def test_agent_has_instructions(self):
        """Test that agents load their instructions."""
        agent = DetectionAgent()
        assert agent.instructions.name == "Sovereign Detector"
        assert "Mission: Analyze input data" in f"Mission: {agent.instructions.mission}"

    def test_agent_system_prompt(self):
        """Test retrieving system prompt from agent."""
        agent = TriageAgent()
        prompt = agent.get_system_prompt()
        assert "Sovereign Triager" in prompt
        assert "# MISSION" in prompt
