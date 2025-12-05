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
Policy Enforcement Layer (The Guardian)

Provides centralized validation and enforcement of security policies
before agent actions are executed.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Pattern
import re


@dataclass
class EnforcementResult:
    """Result of policy enforcement validation."""

    allowed: bool
    reason: str = ""
    severity: str = "info"  # info, warning, critical
    violated_rules: List[str] = field(default_factory=list)

    def __post_init__(self):
        if self.violated_rules is None:
            self.violated_rules = []


class PolicyEnforcer:
    """
    Centralized policy enforcement for agent actions.

    Validates proposed actions against security policies including:
    - Dangerous command detection
    - PII exposure prevention
    - Resource exhaustion prevention
    """

    def __init__(self):
        # Dangerous command patterns
        self.dangerous_commands = [
            (re.compile(r"\brm\s+-rf\s+/"), "Recursive deletion of root directory"),
            (re.compile(r"\bDROP\s+TABLE", re.IGNORECASE), "SQL table deletion"),
            (re.compile(r"\bDROP\s+DATABASE", re.IGNORECASE), "SQL database deletion"),
            (re.compile(r"\bTRUNCATE\s+TABLE", re.IGNORECASE), "SQL table truncation"),
            (
                re.compile(r"\bDELETE\s+FROM.*WHERE\s+1\s*=\s*1", re.IGNORECASE),
                "Unconditional SQL deletion",
            ),
            (re.compile(r"\bmkfs\b"), "Filesystem formatting"),
            (re.compile(r"\bdd\s+if=/dev/zero"), "Disk overwrite"),
            (re.compile(r":\(\)\{.*:\|:.*\};:", re.IGNORECASE), "Fork bomb"),
            (re.compile(r"\bchmod\s+777\s+/"), "Insecure permissions on root"),
            (re.compile(r"\bkill\s+-9\s+1\b"), "Killing init process"),
        ]

        # PII patterns
        self.pii_patterns = [
            (re.compile(r"\b\d{3}-\d{2}-\d{4}\b"), "SSN pattern"),
            (re.compile(r"\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b"), "Credit card pattern"),
            (re.compile(r"\b[A-Z]{2}\d{6,8}\b"), "Passport pattern"),
        ]

        # Resource exhaustion patterns
        self.resource_exhaustion = [
            (re.compile(r"while\s+true", re.IGNORECASE), "Infinite loop"),
            (re.compile(r"for\s*\(\s*;\s*;\s*\)", re.IGNORECASE), "Infinite for loop"),
        ]

    def validate_action(self, action: str, details: str = "") -> EnforcementResult:
        """
        Validate a proposed action against all policies.

        Args:
            action: The action type (e.g., "execute_command", "query_database")
            details: The action details/payload to validate

        Returns:
            EnforcementResult indicating if action is allowed
        """
        combined_text = f"{action} {details}"

        # Check for dangerous commands
        for pattern, description in self.dangerous_commands:
            if pattern.search(combined_text):
                return EnforcementResult(
                    allowed=False,
                    reason=f"Blocked dangerous action: {description}",
                    severity="critical",
                    violated_rules=["dangerous_command"],
                )

        # Check for PII exposure
        for pattern, description in self.pii_patterns:
            if pattern.search(combined_text):
                return EnforcementResult(
                    allowed=False,
                    reason=f"Blocked PII exposure: {description}",
                    severity="critical",
                    violated_rules=["pii_exposure"],
                )

        # Check for resource exhaustion
        for pattern, description in self.resource_exhaustion:
            if pattern.search(combined_text):
                return EnforcementResult(
                    allowed=False,
                    reason=f"Blocked resource exhaustion: {description}",
                    severity="warning",
                    violated_rules=["resource_exhaustion"],
                )

        # All checks passed
        return EnforcementResult(
            allowed=True, reason="Action passed all policy checks", severity="info"
        )

    def validate_resolution(self, resolution: dict) -> EnforcementResult:
        """
        Validate a resolution action from ResolutionAgent.

        Args:
            resolution: Resolution dictionary with 'resolution_action' and 'resolution_details'

        Returns:
            EnforcementResult
        """
        action = resolution.get("resolution_action", "")
        details = resolution.get("resolution_details", "")

        return self.validate_action(action, details)


# Global enforcer instance
_global_enforcer: Optional[PolicyEnforcer] = None


def get_policy_enforcer() -> PolicyEnforcer:
    """Get the global policy enforcer instance."""
    global _global_enforcer
    if _global_enforcer is None:
        _global_enforcer = PolicyEnforcer()
    return _global_enforcer
