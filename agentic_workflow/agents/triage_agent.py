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
Triage Agent

Prioritizes and categorizes detected issues for resolution.
"""

from typing import Any, Dict, List
from ..agent_base import Agent
from ..context import AgentContext


class TriageAgent(Agent):
    """
    Agent responsible for triaging detected issues.
    
    Prioritizes issues based on severity, impact, and urgency, and assigns
    them to appropriate resolution paths.
    """
    
    def __init__(self, agent_id: str = "triage_agent", **kwargs):
        super().__init__(agent_id, **kwargs)
        self.severity_weights = {
            "critical": 10,
            "high": 7,
            "medium": 4,
            "low": 1
        }
    
    def process(self, context: AgentContext) -> AgentContext:
        """
        Process context to triage detected issues.
        
        Args:
            context: Input agent context with detections
            
        Returns:
            Updated context with triage results
        """
        self.telemetry.info(
            "Starting triage analysis",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id
        )
        
        self.telemetry.debug(
            f"Mission: {self.instructions.mission}",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id
        )
        
        # Update state
        context.update_state("triaging")
        
        # Get detections from previous agent
        detections = context.payload.output_data.get("detections", [])
        
        if not detections:
            # Populate empty triage results for consistency
            empty_triage = {
                "prioritized": [],
                "critical_count": 0,
                "requires_immediate_action": False,
                "total_triaged": 0
            }
            context.payload.output_data["triage_results"] = empty_triage
            context.payload.output_data["prioritized_issues"] = []
            context.update_state("triage_complete", {"triaged": 0})
            return context
        
        # Perform triage
        triage_results = self._triage_issues(detections, context)
        
        # Add triage results to context
        context.payload.output_data["triage_results"] = triage_results
        context.payload.output_data["prioritized_issues"] = triage_results.get("prioritized", [])
        
        # Update intent based on highest priority
        if triage_results.get("prioritized"):
            highest_priority = triage_results["prioritized"][0]
            if context.intent:
                context.intent.priority = highest_priority.get("priority", "normal")
            context.annotation.labels["triage_priority"] = highest_priority.get("priority", "normal")
        
        # Add knowledge
        context.add_knowledge_fact(
            "triage_summary",
            {
                "total_issues": len(detections),
                "critical_count": triage_results.get("critical_count", 0),
                "requires_immediate_action": triage_results.get("requires_immediate_action", False)
            },
            confidence=0.9
        )
        
        # Record metrics
        self.telemetry.record_metric(
            "issues_triaged",
            len(detections),
            agent_id=self.agent_id
        )
        
        self.telemetry.record_metric(
            "critical_issues",
            triage_results.get("critical_count", 0),
            agent_id=self.agent_id
        )
        
        # Update state
        context.update_state(
            "triage_complete",
            {"triaged": len(detections), "critical": triage_results.get("critical_count", 0)}
        )
        
        self.telemetry.info(
            f"Triage complete: {len(detections)} issues processed",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id,
            critical_count=triage_results.get("critical_count", 0)
        )
        
        return context
    
    def _triage_issues(
        self,
        detections: List[Dict[str, Any]],
        context: AgentContext
    ) -> Dict[str, Any]:
        """
        Perform triage logic on detected issues using the Neural Link (LLM).
        
        Args:
            detections: List of detected issues
            context: Agent context for additional information
            
        Returns:
            Triage results with prioritization
        """
        import json
        
        prompt = """
        Review the detected issues and prioritize them for resolution.
        
        Return a JSON object with the following structure:
        {
            "prioritized": [
                {
                    ... (original issue fields) ...
                    "priority": "low" | "normal" | "high" | "critical",
                    "priority_score": (float 0-10),
                    "resolution_path": "immediate_escalation" | "resource_optimization" | "error_mitigation" | "priority_queue" | "standard_queue"
                }
            ],
            "critical_count": (int),
            "requires_immediate_action": (bool)
        }
        
        Do not include markdown formatting (```json) in your response, just the raw JSON string.
        """
        
        response = self.ask_brain(prompt, detections)
        
        try:
            # Clean up response if it contains markdown
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            
            result = json.loads(cleaned_response.strip())
            
            # Ensure prioritized list exists
            if "prioritized" not in result:
                result["prioritized"] = []
                
            # Add triaged_at timestamp
            for item in result["prioritized"]:
                item["triaged_at"] = context.temporal.start_time.isoformat()
                
            result["total_triaged"] = len(detections)
            return result
            
        except json.JSONDecodeError:
            self.telemetry.error(f"Failed to parse LLM triage response: {response}", agent_id=self.agent_id)
            # Fallback to empty result
            return {
                "prioritized": [],
                "critical_count": 0,
                "requires_immediate_action": False,
                "total_triaged": len(detections)
            }
        except Exception as e:
            self.telemetry.error(f"Error in triage analysis: {e}", agent_id=self.agent_id)
            return {
                "prioritized": [],
                "critical_count": 0,
                "requires_immediate_action": False,
                "total_triaged": len(detections)
            }
    
    def _assign_resolution_path(
        self,
        detection: Dict[str, Any],
        priority: str
    ) -> str:
        """
        Assign an appropriate resolution path based on detection and priority.
        
        Args:
            detection: Detection details
            priority: Assigned priority level
            
        Returns:
            Resolution path identifier
        """
        rule_id = detection.get("rule_id", "")
        
        # Map to resolution paths
        if priority == "critical":
            return "immediate_escalation"
        elif "resource" in rule_id.lower():
            return "resource_optimization"
        elif "error" in rule_id.lower():
            return "error_mitigation"
        elif priority == "high":
            return "priority_queue"
        else:
            return "standard_queue"
