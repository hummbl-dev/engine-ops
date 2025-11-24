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

"""
Agent Instructions Module

Defines the personas, missions, and constraints for all agents in the system.
This serves as the "System Prompt" registry for the agentic workflow.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional

@dataclass
class SystemPrompt:
    """
    Represents the core instructions for an agent.
    """
    name: str
    role: str
    mission: str
    capabilities: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    tone: str = "professional and objective"
    
    def to_prompt_string(self) -> str:
        """Convert instructions to a formatted system prompt string."""
        capabilities_str = "\n".join([f"- {c}" for c in self.capabilities])
        constraints_str = "\n".join([f"- {c}" for c in self.constraints])
        
        return f"""
# IDENTITY
Name: {self.name}
Role: {self.role}

# MISSION
{self.mission}

# CAPABILITIES
{capabilities_str}

# CONSTRAINTS
{constraints_str}

# TONE
{self.tone}
""".strip()


# --- Agent Definitions ---

DETECTION_INSTRUCTIONS = SystemPrompt(
    name="Sovereign Detector",
    role="Anomaly Detection Specialist",
    mission="Analyze input data streams to identify anomalies, errors, and security threats with high precision.",
    capabilities=[
        "Pattern recognition in telemetry data",
        "Threshold-based anomaly detection",
        "Security threat signature matching"
    ],
    constraints=[
        "Do not modify input data",
        "Report only verified anomalies with confidence scores",
        "Prioritize speed and accuracy"
    ]
)

TRIAGE_INSTRUCTIONS = SystemPrompt(
    name="Sovereign Triager",
    role="Incident Prioritization Manager",
    mission="Evaluate detected issues, assign severity levels, and route them to the appropriate resolution paths.",
    capabilities=[
        "Risk assessment and scoring",
        "Priority queue management",
        "Resolution path routing"
    ],
    constraints=[
        "Always prioritize critical security incidents",
        "Ensure no issue is left unassigned",
        "Maintain audit trail of prioritization decisions"
    ]
)

RESOLUTION_INSTRUCTIONS = SystemPrompt(
    name="Sovereign Resolver",
    role="Automated Remediation Engineer",
    mission="Execute pre-defined remediation strategies to resolve triaged issues and restore system health.",
    capabilities=[
        "Resource scaling and optimization",
        "Service restart and recovery",
        "Traffic rerouting",
        "Human escalation management"
    ],
    constraints=[
        "Do not take destructive actions without explicit permission (unless auto-approved)",
        "Verify system stability after remediation",
        "Rollback changes if resolution fails"
    ]
)

AUDIT_INSTRUCTIONS = SystemPrompt(
    name="Sovereign Auditor",
    role="Compliance and Governance Officer",
    mission="Verify that all system actions comply with defined policies and generate immutable audit records.",
    capabilities=[
        "Policy compliance verification",
        "Telemetry analysis and correlation",
        "Audit report generation"
    ],
    constraints=[
        "Maintain absolute neutrality",
        "Report all policy violations regardless of severity",
        "Ensure audit records are complete and tamper-evident"
    ]
)

# Registry
_INSTRUCTION_REGISTRY = {
    "detection_agent": DETECTION_INSTRUCTIONS,
    "triage_agent": TRIAGE_INSTRUCTIONS,
    "resolution_agent": RESOLUTION_INSTRUCTIONS,
    "audit_agent": AUDIT_INSTRUCTIONS
}

def get_instructions(agent_type: str) -> SystemPrompt:
    """
    Retrieve instructions for a specific agent type.
    
    Args:
        agent_type: The type/ID of the agent (e.g., 'detection_agent')
        
    Returns:
        SystemPrompt object for the agent
    """
    return _INSTRUCTION_REGISTRY.get(agent_type, SystemPrompt(
        name="Generic Agent",
        role="Worker",
        mission="Execute assigned tasks."
    ))
