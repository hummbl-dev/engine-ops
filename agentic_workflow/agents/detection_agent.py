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
Detection Agent

Detects anomalies, issues, or events from input data.
"""

from typing import Any, Dict, List
from ..agent_base import Agent
from ..context import AgentContext


class DetectionAgent(Agent):
    """
    Agent responsible for detecting issues, anomalies, or events.
    
    Analyzes input data and identifies potential problems or notable patterns.
    """
    
    def __init__(self, agent_id: str = "detection_agent", **kwargs):
        super().__init__(agent_id, **kwargs)
        self.detection_rules = self._initialize_detection_rules()
    
    def _initialize_detection_rules(self) -> List[Dict[str, Any]]:
        """Initialize detection rules."""
        return [
            {
                "rule_id": "high_error_rate",
                "name": "High Error Rate",
                "threshold": 0.05,
                "severity": "high"
            },
            {
                "rule_id": "resource_exhaustion",
                "name": "Resource Exhaustion",
                "threshold": 0.90,
                "severity": "critical"
            },
            {
                "rule_id": "anomalous_pattern",
                "name": "Anomalous Pattern",
                "threshold": 2.0,  # Standard deviations
                "severity": "medium"
            }
        ]
    
    def process(self, context: AgentContext) -> AgentContext:
        """
        Process context to detect issues or anomalies.
        
        Args:
            context: Input agent context
            
        Returns:
            Updated context with detection results
        """
        self.telemetry.info(
            "Starting detection analysis",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id
        )
        
        self.telemetry.debug(
            f"Mission: {self.instructions.mission}",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id
        )
        
        # Update state
        context.update_state("detecting")
        
        # Get input data
        input_data = context.payload.input_data
        
        # Perform detection
        detections = self._detect_issues(input_data)
        
        # Add detections to context
        context.payload.output_data["detections"] = detections
        context.payload.output_data["detection_count"] = len(detections)
        
        # Add knowledge facts
        for detection in detections:
            context.add_knowledge_fact(
                f"detection_{detection['rule_id']}",
                detection,
                confidence=detection.get("confidence", 0.8)
            )
        
        # Add annotations
        if detections:
            context.annotation.tags.append("issues_detected")
            context.annotation.categories.append("detection")
            highest_severity = max(
                (d.get("severity", "low") for d in detections),
                key=lambda s: ["low", "medium", "high", "critical"].index(s)
            )
            context.annotation.labels["highest_severity"] = highest_severity
        
        # Record metrics
        self.telemetry.record_metric(
            "detections_found",
            len(detections),
            agent_id=self.agent_id
        )
        
        # Update state
        context.update_state(
            "detection_complete",
            {"detections": len(detections)}
        )
        
        self.telemetry.info(
            f"Detection complete: found {len(detections)} issues",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id,
            detection_count=len(detections)
        )
        
        return context
    
    def _detect_issues(self, data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Perform actual detection logic using the Neural Link (LLM).
        
        Args:
            data: Input data to analyze
            
        Returns:
            List of detected issues
        """
        import json
        import re
        
        prompt = """
        Analyze the provided input data for any anomalies, errors, security threats, or resource exhaustion issues.
        
        Return a JSON array of detected issues. Each issue object must have:
        - rule_id: A short identifier (e.g., "high_error_rate")
        - name: A human-readable name
        - severity: "low", "medium", "high", or "critical"
        - confidence: A float between 0.0 and 1.0
        - details: A dictionary of supporting evidence
        
        If no issues are found, return an empty array [].
        Do not include markdown formatting (```json) in your response, just the raw JSON string.
        """
        
        response = self.ask_brain(prompt, data)
        
        try:
            # Clean up response if it contains markdown
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            
            detections = json.loads(cleaned_response.strip())
            
            # Validate structure (basic check)
            if not isinstance(detections, list):
                self.telemetry.warning("LLM returned non-list detection result", agent_id=self.agent_id)
                return []
                
            return detections
            
        except json.JSONDecodeError:
            self.telemetry.error(f"Failed to parse LLM detection response: {response}", agent_id=self.agent_id)
            return []
        except Exception as e:
            self.telemetry.error(f"Error in detection analysis: {e}", agent_id=self.agent_id)
            return []
