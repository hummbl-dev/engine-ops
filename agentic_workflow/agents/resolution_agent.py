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
Resolution Agent

Resolves or mitigates detected and triaged issues.
"""

from typing import Any, Dict, List
from ..agent_base import Agent
from ..context import AgentContext


class ResolutionAgent(Agent):
    """
    Agent responsible for resolving triaged issues.
    
    Applies appropriate remediation strategies based on issue type and priority.
    """
    
    def __init__(self, agent_id: str = "resolution_agent", **kwargs):
        super().__init__(agent_id, **kwargs)
        self.resolution_strategies = self._initialize_strategies()
    
    def _initialize_strategies(self) -> Dict[str, Any]:
        """Initialize resolution strategies."""
        return {
            "immediate_escalation": {
                "action": "escalate_to_human",
                "timeout_seconds": 300,
                "auto_rollback": True
            },
            "resource_optimization": {
                "action": "optimize_resources",
                "timeout_seconds": 600,
                "auto_rollback": False
            },
            "error_mitigation": {
                "action": "apply_error_fixes",
                "timeout_seconds": 900,
                "auto_rollback": True
            },
            "priority_queue": {
                "action": "queue_for_resolution",
                "timeout_seconds": 1800,
                "auto_rollback": False
            },
            "standard_queue": {
                "action": "queue_for_resolution",
                "timeout_seconds": 3600,
                "auto_rollback": False
            }
        }
    
    def process(self, context: AgentContext) -> AgentContext:
        """
        Process context to resolve triaged issues.
        
        Args:
            context: Input agent context with triage results
            
        Returns:
            Updated context with resolution results
        """
        self.telemetry.info(
            "Starting resolution process",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id
        )
        
        self.telemetry.debug(
            f"Mission: {self.instructions.mission}",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id
        )
        
        # Update state
        context.update_state("resolving")
        
        # Get prioritized issues from triage
        prioritized_issues = context.payload.output_data.get("prioritized_issues", [])
        
        if not prioritized_issues:
            self.telemetry.warning(
                "No prioritized issues found for resolution",
                trace_id=context.telemetry.trace_id,
                agent_id=self.agent_id
            )
            context.update_state("resolution_complete", {"resolved": 0})
            return context
        
        # Perform resolution
        resolution_results = self._resolve_issues(prioritized_issues, context)
        
        # Add resolution results to context
        context.payload.output_data["resolution_results"] = resolution_results
        context.payload.output_data["resolved_count"] = resolution_results.get("resolved_count", 0)
        context.payload.output_data["failed_count"] = resolution_results.get("failed_count", 0)
        
        # Update annotations
        if resolution_results.get("resolved_count", 0) > 0:
            context.annotation.tags.append("issues_resolved")
        if resolution_results.get("failed_count", 0) > 0:
            context.annotation.tags.append("resolution_failures")
        
        # Add knowledge
        context.add_knowledge_fact(
            "resolution_summary",
            {
                "total_attempted": len(prioritized_issues),
                "resolved": resolution_results.get("resolved_count", 0),
                "failed": resolution_results.get("failed_count", 0),
                "success_rate": resolution_results.get("success_rate", 0.0)
            },
            confidence=0.85
        )
        
        # Record metrics
        self.telemetry.record_metric(
            "issues_resolved",
            resolution_results.get("resolved_count", 0),
            agent_id=self.agent_id
        )
        
        self.telemetry.record_metric(
            "resolution_failures",
            resolution_results.get("failed_count", 0),
            agent_id=self.agent_id
        )
        
        # Update state
        context.update_state(
            "resolution_complete",
            {
                "resolved": resolution_results.get("resolved_count", 0),
                "failed": resolution_results.get("failed_count", 0)
            }
        )
        
        self.telemetry.info(
            f"Resolution complete: {resolution_results.get('resolved_count', 0)} resolved, "
            f"{resolution_results.get('failed_count', 0)} failed",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id,
            success_rate=resolution_results.get("success_rate", 0.0)
        )
        
        return context
    
    def _resolve_issues(
        self,
        issues: List[Dict[str, Any]],
        context: AgentContext
    ) -> Dict[str, Any]:
        """
        Perform resolution logic on issues using the Neural Link (LLM).
        
        Args:
            issues: List of prioritized issues
            context: Agent context for additional information
            
        Returns:
            Resolution results
        """
        import json
        
        prompt = """
        Determine the best resolution action for each issue.
        
        Return a JSON object with the following structure:
        {
            "resolved": [
                {
                    ... (original issue fields) ...
                    "resolution_status": "resolved",
                    "resolution_action": (string describing action taken),
                    "resolution_details": (string details)
                }
            ],
            "failed": [
                {
                    ... (original issue fields) ...
                    "resolution_status": "failed",
                    "resolution_action": (string attempted action),
                    "failure_reason": (string reason)
                }
            ]
        }
        
        Do not include markdown formatting (```json) in your response, just the raw JSON string.
        """
        
        response = self.ask_brain(prompt, issues)
        
        try:
            # Clean up response if it contains markdown
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            
            result = json.loads(cleaned_response.strip())
            
            resolved = result.get("resolved", [])
            failed = result.get("failed", [])
            
            resolved_count = len(resolved)
            failed_count = len(failed)
            total = resolved_count + failed_count
            success_rate = resolved_count / total if total > 0 else 0.0
            
            return {
                "resolved": resolved,
                "failed": failed,
                "resolved_count": resolved_count,
                "failed_count": failed_count,
                "success_rate": success_rate
            }
            
        except json.JSONDecodeError:
            self.telemetry.error(f"Failed to parse LLM resolution response: {response}", agent_id=self.agent_id)
            return {
                "resolved": [],
                "failed": [],
                "resolved_count": 0,
                "failed_count": 0,
                "success_rate": 0.0
            }
        except Exception as e:
            self.telemetry.error(f"Error in resolution analysis: {e}", agent_id=self.agent_id)
            return {
                "resolved": [],
                "failed": [],
                "resolved_count": 0,
                "failed_count": 0,
                "success_rate": 0.0
            }
    
    def _apply_resolution_strategy(
        self,
        issue: Dict[str, Any],
        strategy: Dict[str, Any],
        context: AgentContext
    ) -> tuple[bool, str]:
        """
        Apply a resolution strategy to an issue.
        
        Args:
            issue: Issue to resolve
            strategy: Resolution strategy to apply
            context: Agent context
            
        Returns:
            Tuple of (success, result_message)
        """
        action = strategy.get("action")
        
        # Simulate resolution actions
        if action == "escalate_to_human":
            return True, "Escalated to human operator"
        
        elif action == "optimize_resources":
            # Simulated resource optimization
            resource = issue.get("details", {}).get("resource")
            if resource:
                return True, f"Optimized {resource} usage"
            return False, "No resource information available"
        
        elif action == "apply_error_fixes":
            # Simulated error fix
            error_rate = issue.get("details", {}).get("error_rate")
            if error_rate:
                return True, "Applied error mitigation strategies"
            return False, "No error information available"
        
        elif action == "queue_for_resolution":
            # Queue for later processing
            return True, f"Queued with priority {issue.get('priority')}"
        
        else:
            return False, f"Unknown action: {action}"
