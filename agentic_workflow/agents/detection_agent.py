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
        # Rule‑based deterministic detection (no LLM)
        detections = []
        input_data = data
        # High error rate rule
        err_rate = input_data.get('error_rate')
        if err_rate is not None:
            rule = next((r for r in self.detection_rules if r['rule_id'] == 'high_error_rate'), None)
            if rule and err_rate > rule['threshold']:
                detections.append({
                    'rule_id': rule['rule_id'],
                    'name': rule['name'],
                    'severity': rule['severity'],
                    'confidence': min(1.0, err_rate),
                    'details': {'error_rate': err_rate}
                })
        # Resource exhaustion rule
        resources = input_data.get('resource_usage', {})
        rule_res = next((r for r in self.detection_rules if r['rule_id'] == 'resource_exhaustion'), None)
        if rule_res:
            for res_name, usage in resources.items():
                if usage > rule_res['threshold']:
                    detections.append({
                        'rule_id': rule_res['rule_id'],
                        'name': rule_res['name'],
                        'severity': rule_res['severity'],
                        'confidence': min(1.0, usage),
                        'details': {'resource': res_name, 'usage': usage}
                    })
        # Anomalous pattern rule – placeholder simple check
        rule_anom = next((r for r in self.detection_rules if r['rule_id'] == 'anomalous_pattern'), None)
        if rule_anom:
            # For demonstration, flag if any metric exceeds 2 standard deviations (simulated)
            metrics = input_data.get('metrics', {})
            for metric, value in metrics.items():
                if isinstance(value, (int, float)) and abs(value) > 2 * rule_anom['threshold']:
                    detections.append({
                        'rule_id': rule_anom['rule_id'],
                        'name': rule_anom['name'],
                        'severity': rule_anom['severity'],
                        'confidence': 0.9,
                        'details': {'metric': metric, 'value': value}
                    })
        return detections
```
