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
from ..enforcer import get_policy_enforcer
from ..telemetry import TelemetryCollector, EventType
from ..debate import get_debate_orchestrator


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
            # Populate empty resolution results for consistency
            empty_resolution = {
                "resolved": [],
                "failed": [],
                "resolved_count": 0,
                "failed_count": 0,
                "success_rate": 0.0
            }
            context.payload.output_data["resolution_results"] = empty_resolution
            context.payload.output_data["resolved_count"] = 0
            context.payload.output_data["failed_count"] = 0
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
        
        # Check if any issues are critical/high severity - use debate
        critical_issues = [i for i in issues if i.get("severity") in ["critical", "high"]]
        
        if critical_issues:
            self.telemetry.info(
                f"Detected {len(critical_issues)} critical/high severity issues - triggering multi-agent debate",
                agent_id=self.agent_id
            )
            return self._resolve_with_debate(critical_issues, issues, context)
        
        # Standard resolution for low/medium severity
        return self._standard_resolution(issues)
        
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
    
    def _resolve_with_debate(
        self,
        critical_issues: List[Dict[str, Any]],
        all_issues: List[Dict[str, Any]],
        context: AgentContext
    ) -> Dict[str, Any]:
        """
        Resolve critical issues using multi-agent debate.
        
        Args:
            critical_issues: List of critical/high severity issues
            all_issues: All issues (for fallback)
            context: Agent context
            
        Returns:
            Resolution results with debate metadata
        """
        import json
        
        orchestrator = get_debate_orchestrator()
        resolved = []
        failed = []
        
        for issue in critical_issues:
            try:
                self.telemetry.info(
                    f"Starting debate for issue: {issue.get('name', 'Unknown')}",
                    agent_id=self.agent_id,
                    rule_id=issue.get("rule_id")
                )
                
                # Run debate
                debate_result = orchestrator.orchestrate_debate(
                    issue,
                    max_rounds=3,
                    convergence_threshold=0.7
                )
                
                # Extract decision from debate
                decision = debate_result.final_decision
                
                # Add debate metadata to resolution
                resolution_item = {
                    **issue,
                    "resolution_status": "resolved",
                    "resolution_action": decision.get("resolution_action", "unknown"),
                    "resolution_details": decision.get("resolution_details", decision.get("rationale", "")),
                    "debate_metadata": {
                        "consensus_reached": debate_result.consensus_reached,
                        "debate_rounds": debate_result.debate_rounds,
                        "convergence_score": debate_result.convergence_score,
                        "transcript": debate_result.transcript[:5]  # First 5 lines for brevity
                    }
                }
                
                resolved.append(resolution_item)
                
                self.telemetry.info(
                    f"Debate completed for {issue.get('name')}: {decision.get('resolution_action')}",
                    agent_id=self.agent_id,
                    consensus=debate_result.consensus_reached,
                    rounds=debate_result.debate_rounds
                )
                
            except Exception as e:
                self.telemetry.error(
                    f"Debate failed for {issue.get('name')}: {e}",
                    agent_id=self.agent_id
                )
                failed.append({
                    **issue,
                    "resolution_status": "failed",
                    "reason": f"Debate error: {str(e)}"
                })
        
        # Process non-critical issues with standard resolution
        non_critical = [i for i in all_issues if i not in critical_issues]
        if non_critical:
            standard_results = self._standard_resolution(non_critical)
            resolved.extend(standard_results.get("resolved", []))
            failed.extend(standard_results.get("failed", []))
        
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
    
    def _standard_resolution(self, issues: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Standard resolution without debate (for low/medium severity).
        
        This is the original _resolve_issues logic extracted for reuse.
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
                    "reason": (string reason for failure)
                }
            ]
        }
        
        Do not include markdown formatting (```json) in your response, just the raw JSON string.
        """
        
        # Use the issues list as the query for memory retrieval
        response = self.ask_brain(prompt, issues, use_memory=True, memory_query=str(issues))
        
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
            
            # Enforce policy on all proposed resolutions
            enforcer = get_policy_enforcer()
            validated_resolved = []
            
            for item in resolved:
                enforcement_result = enforcer.validate_resolution(item)
                
                if enforcement_result.allowed:
                    validated_resolved.append(item)
                    self.telemetry.info(
                        f"Resolution passed policy check: {item.get('rule_id')}",
                        agent_id=self.agent_id
                    )
                else:
                    # Move to failed list with enforcement reason
                    failed.append({
                        "rule_id": item.get("rule_id"),
                        "resolution_status": "blocked",
                        "reason": enforcement_result.reason,
                        "severity": enforcement_result.severity
                    })
                    self.telemetry.warning(
                        f"Resolution blocked by policy: {enforcement_result.reason}",
                        agent_id=self.agent_id,
                        rule_id=item.get("rule_id")
                    )
            
            resolved = validated_resolved
            resolved_count = len(resolved)
            failed_count = len(failed)
            total = resolved_count + failed_count
            success_rate = resolved_count / total if total > 0 else 0.0
            
            # Memorize successful resolutions (only those that passed enforcement)
            for item in resolved:
                memory_content = (
                    f"Issue: {item.get('rule_id')} ({item.get('name')}). "
                    f"Action: {item.get('resolution_action')}. "
                    f"Details: {item.get('resolution_details')}."
                )
                self.memorize(
                    memory_content,
                    metadata={
                        "rule_id": item.get("rule_id"),
                        "action": item.get("resolution_action"),
                        "type": "resolution_success"
                    }
                )
            
            return {
                "resolved": resolved,
                "failed": failed,
                "resolved_count": resolved_count,
                "failed_count": failed_count,
                "success_rate": success_rate
            }
            
        except json.JSONDecodeError as e:
            self.telemetry.error(
                f"Failed to parse resolution response: {e}",
                agent_id=self.agent_id
            )
            return {
                "resolved": [],
                "failed": issues,
                "resolved_count": 0,
                "failed_count": len(issues),
                "success_rate": 0.0
            }

