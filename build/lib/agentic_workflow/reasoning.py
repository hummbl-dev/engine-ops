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
Self-Reflective Reasoning Module (The Mind)

Implements test-time compute with explicit reasoning traces and self-critique.
Combines o1-style reasoning with Reflexion pattern for improved accuracy.
"""

from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime, timezone
import re

@dataclass
class ReasoningTrace:
    """Captures an agent's explicit reasoning process."""
    steps: List[str] = field(default_factory=list)
    confidence: float = 0.0
    assumptions: List[str] = field(default_factory=list)
    alternatives_considered: List[str] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    raw_trace: str = ""
    
    def to_dict(self):
        return {
            "steps": self.steps,
            "confidence": self.confidence,
            "assumptions": self.assumptions,
            "alternatives_considered": self.alternatives_considered,
            "timestamp": self.timestamp
        }

@dataclass
class CritiqueResult:
    """Result of critiquing a reasoning trace."""
    needs_revision: bool
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)
    severity: str = "info"  # info, warning, critical
    confidence_score: float = 0.0
    
    def to_dict(self):
        return {
            "needs_revision": self.needs_revision,
            "issues": self.issues,
            "suggestions": self.suggestions,
            "severity": self.severity,
            "confidence_score": self.confidence_score
        }

class CritiqueEngine:
    """
    Validates reasoning quality and suggests improvements.
    
    Checks for:
    - Logical fallacies
    - Unstated assumptions
    - Missing edge cases
    - Insufficient evidence
    """
    
    def __init__(self):
        # Logical fallacy patterns
        self.fallacy_patterns = [
            (re.compile(r'\b(always|never|all|none)\b', re.IGNORECASE), 
             "Absolute statement detected - may be overgeneralization"),
            (re.compile(r'\b(obviously|clearly|everyone knows)\b', re.IGNORECASE),
             "Appeal to obviousness - may hide unstated assumptions"),
            (re.compile(r'\b(therefore|thus|hence)\b.*\b(because|since)\b', re.IGNORECASE),
             "Circular reasoning pattern detected"),
        ]
        
        # Required reasoning elements
        self.required_elements = [
            ("assumption", "Missing explicit assumptions"),
            ("alternative", "No alternatives considered"),
            ("risk", "Missing risk assessment"),
        ]
    
    def critique_reasoning(self, trace: ReasoningTrace) -> CritiqueResult:
        """
        Critique a reasoning trace for quality.
        
        Args:
            trace: The reasoning trace to critique
            
        Returns:
            CritiqueResult with issues and suggestions
        """
        issues = []
        suggestions = []
        severity = "info"
        
        # Check for logical fallacies
        for pattern, description in self.fallacy_patterns:
            if pattern.search(trace.raw_trace):
                issues.append(description)
                suggestions.append(f"Revise to avoid: {description}")
                severity = "warning"
        
        # Check for missing elements
        trace_lower = trace.raw_trace.lower()
        for keyword, description in self.required_elements:
            if keyword not in trace_lower:
                issues.append(description)
                suggestions.append(f"Add explicit {keyword}s to reasoning")
                if keyword == "risk":
                    severity = "warning"
        
        # Check reasoning depth
        if len(trace.steps) < 3:
            issues.append("Reasoning too shallow - needs more steps")
            suggestions.append("Break down the problem into more granular steps")
            severity = "warning"
        
        # Check confidence calibration
        if trace.confidence > 0.9 and len(trace.assumptions) == 0:
            issues.append("High confidence without stated assumptions")
            suggestions.append("Identify and state key assumptions")
            severity = "warning"
        
        # Determine if revision is needed
        needs_revision = severity in ["warning", "critical"] and len(issues) > 2
        
        # Calculate confidence score (inverse of issues)
        confidence_score = max(0.0, 1.0 - (len(issues) * 0.15))
        
        return CritiqueResult(
            needs_revision=needs_revision,
            issues=issues,
            suggestions=suggestions,
            severity=severity,
            confidence_score=confidence_score
        )
    
    def parse_reasoning_trace(self, llm_output: str) -> ReasoningTrace:
        """
        Parse LLM output with <thinking> tags into ReasoningTrace.
        
        Expected format:
        <thinking>
        Step 1: ...
        Step 2: ...
        Assumptions: ...
        Alternatives: ...
        Confidence: 0.85
        </thinking>
        
        Args:
            llm_output: Raw LLM response with thinking tags
            
        Returns:
            Parsed ReasoningTrace
        """
        trace = ReasoningTrace()
        
        # Extract thinking block
        thinking_match = re.search(r'<thinking>(.*?)</thinking>', llm_output, re.DOTALL)
        if not thinking_match:
            # No thinking block found - return empty trace
            return trace
        
        thinking_text = thinking_match.group(1).strip()
        trace.raw_trace = thinking_text
        
        # Parse steps
        step_pattern = re.compile(r'Step \d+:(.*?)(?=Step \d+:|Assumptions:|Alternatives:|Confidence:|$)', re.DOTALL)
        steps = step_pattern.findall(thinking_text)
        trace.steps = [s.strip() for s in steps if s.strip()]
        
        # Parse assumptions
        assumptions_match = re.search(r'Assumptions?:(.*?)(?=Alternatives:|Confidence:|$)', thinking_text, re.DOTALL)
        if assumptions_match:
            assumptions_text = assumptions_match.group(1).strip()
            trace.assumptions = [a.strip('- ').strip() for a in assumptions_text.split('\n') if a.strip()]
        
        # Parse alternatives
        alternatives_match = re.search(r'Alternatives?:(.*?)(?=Confidence:|$)', thinking_text, re.DOTALL)
        if alternatives_match:
            alternatives_text = alternatives_match.group(1).strip()
            trace.alternatives_considered = [a.strip('- ').strip() for a in alternatives_text.split('\n') if a.strip()]
        
        # Parse confidence
        confidence_match = re.search(r'Confidence:\s*(0?\.\d+|\d+\.?\d*)', thinking_text)
        if confidence_match:
            trace.confidence = float(confidence_match.group(1))
        
        return trace

# Global critique engine instance
_global_critique_engine: Optional[CritiqueEngine] = None

def get_critique_engine() -> CritiqueEngine:
    """Get the global critique engine instance."""
    global _global_critique_engine
    if _global_critique_engine is None:
        _global_critique_engine = CritiqueEngine()
    return _global_critique_engine
