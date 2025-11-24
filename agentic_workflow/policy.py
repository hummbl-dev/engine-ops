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
Policy Engine Module

Runtime policy evaluation and escalation management for agent workflows.
"""

from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum
import re
import sys
import os

# Add project root to path to allow importing from engine
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from engine.providers import generate_content
except ImportError:
    # Fallback for when running tests in isolation or if engine not found
    def generate_content(*args, **kwargs):
        return "SAFE"


class PolicyAction(Enum):
    """Actions that can be taken when a policy is evaluated."""
    ALLOW = "allow"
    DENY = "deny"
    ESCALATE = "escalate"
    LOG = "log"
    REQUIRE_APPROVAL = "require_approval"


class EscalationLevel(Enum):
    """Escalation severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"


@dataclass
class PolicyRule:
    """Represents a single policy rule."""
    rule_id: str
    name: str
    description: str
    condition: Callable[[Dict[str, Any]], bool]
    action: PolicyAction
    escalation_level: Optional[EscalationLevel] = None
    priority: int = 0  # Higher number = higher priority
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PolicyEvaluation:
    """Result of a policy evaluation."""
    rule_id: str
    rule_name: str
    matched: bool
    action: PolicyAction
    escalation_level: Optional[EscalationLevel] = None
    reason: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class EscalationEvent:
    """Represents an escalation event."""
    event_id: str
    rule_id: str
    level: EscalationLevel
    reason: str
    context_data: Dict[str, Any] = field(default_factory=dict)
    escalated_at: str = ""
    handled: bool = False
    handler: Optional[str] = None


class PolicyEngine:
    """
    Runtime policy evaluation engine.
    
    Evaluates policies against agent context and determines appropriate actions
    including escalations.
    """
    
    def __init__(self):
        self.rules: Dict[str, PolicyRule] = {}
        self.escalation_handlers: Dict[EscalationLevel, List[Callable]] = {
            level: [] for level in EscalationLevel
        }
        self.evaluation_history: List[PolicyEvaluation] = []
        self._register_default_rules()
        self._register_semantic_rules()

    def _register_semantic_rules(self) -> None:
        """Register semantic analysis rules."""
        self.add_rule(PolicyRule(
            rule_id="semantic_safety_check",
            name="Semantic Safety Check",
            description="LLM-based analysis of action safety",
            condition=lambda ctx: self.analyze_risk(ctx) == "BLOCK",
            action=PolicyAction.DENY,
            escalation_level=EscalationLevel.CRITICAL,
            priority=1000  # Highest priority
        ))

    def analyze_risk(self, context_dict: Dict[str, Any]) -> str:
        """
        Analyze the risk of the current context using an LLM.
        
        Args:
            context_dict: Dictionary representation of AgentContext
            
        Returns:
            'SAFE' or 'BLOCK'
        """
        # Extract relevant info for the prompt
        input_data = context_dict.get("payload", {}).get("input_data", {})
        intent = context_dict.get("intent", {})
        
        # If there's no meaningful content to analyze, default to SAFE
        if not input_data:
            return "SAFE"
            
        prompt = f"""
You are a Security Officer for the Sovereign Intelligence Stack.
Analyze the following action context for malicious intent, infinite loops, file system destruction, or data exfiltration.

CONTEXT:
Intent: {intent}
Input Data: {input_data}

Reply ONLY with 'SAFE' or 'BLOCK'.
"""
        try:
            # Use Gemini by default for the brain
            result = generate_content("gemini", prompt).strip().upper()
            
            # Handle potential chatty responses
            if "BLOCK" in result:
                return "BLOCK"
            return "SAFE"
        except Exception as e:
            # Fail safe on error
            print(f"Error in semantic analysis: {e}")
            return "BLOCK"
    
    def _register_default_rules(self) -> None:
        """Register default policy rules."""
        # Security: High-privilege operations require approval
        self.add_rule(PolicyRule(
            rule_id="security_high_privilege",
            name="High Privilege Access Control",
            description="Operations requiring elevated privileges need approval",
            condition=lambda ctx: ctx.get("security", {}).get("access_level") == "elevated",
            action=PolicyAction.REQUIRE_APPROVAL,
            priority=100
        ))
        
        # Resource: Prevent excessive resource allocation
        self.add_rule(PolicyRule(
            rule_id="resource_memory_limit",
            name="Memory Allocation Limit",
            description="Prevent allocation exceeding 8GB",
            condition=lambda ctx: ctx.get("resource", {}).get("allocated_memory_mb", 0) > 8192,
            action=PolicyAction.ESCALATE,
            escalation_level=EscalationLevel.WARNING,
            priority=90
        ))
        
        # Temporal: Critical priority items must complete within deadline
        self.add_rule(PolicyRule(
            rule_id="temporal_deadline_critical",
            name="Critical Deadline Check",
            description="Critical tasks must have defined deadline",
            condition=lambda ctx: (
                ctx.get("intent", {}).get("priority") == "critical" and
                ctx.get("temporal", {}).get("deadline") is None
            ),
            action=PolicyAction.ESCALATE,
            escalation_level=EscalationLevel.CRITICAL,
            priority=95
        ))
    
    def add_rule(self, rule: PolicyRule) -> None:
        """Add a policy rule to the engine."""
        self.rules[rule.rule_id] = rule
    
    def remove_rule(self, rule_id: str) -> None:
        """Remove a policy rule from the engine."""
        if rule_id in self.rules:
            del self.rules[rule_id]
    
    def register_escalation_handler(
        self,
        level: EscalationLevel,
        handler: Callable[[EscalationEvent], None]
    ) -> None:
        """Register a handler for specific escalation level."""
        if level not in self.escalation_handlers:
            self.escalation_handlers[level] = []
        self.escalation_handlers[level].append(handler)
    
    def evaluate(self, context_dict: Dict[str, Any]) -> List[PolicyEvaluation]:
        """
        Evaluate all policies against the given context.
        
        Args:
            context_dict: Dictionary representation of AgentContext
            
        Returns:
            List of policy evaluations
        """
        evaluations = []
        
        # Sort rules by priority (descending)
        sorted_rules = sorted(
            self.rules.values(),
            key=lambda r: r.priority,
            reverse=True
        )
        
        for rule in sorted_rules:
            try:
                matched = rule.condition(context_dict)
                evaluation = PolicyEvaluation(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    matched=matched,
                    action=rule.action,
                    escalation_level=rule.escalation_level,
                    reason=rule.description if matched else None,
                    metadata=rule.metadata
                )
                evaluations.append(evaluation)
                self.evaluation_history.append(evaluation)
                
                # Handle escalations
                if matched and rule.action == PolicyAction.ESCALATE and rule.escalation_level:
                    self._handle_escalation(rule, context_dict)
                
            except Exception as e:
                # Log evaluation error but continue
                evaluations.append(PolicyEvaluation(
                    rule_id=rule.rule_id,
                    rule_name=rule.name,
                    matched=False,
                    action=PolicyAction.LOG,
                    reason=f"Evaluation error: {str(e)}"
                ))
        
        return evaluations
    
    def _handle_escalation(
        self,
        rule: PolicyRule,
        context_dict: Dict[str, Any]
    ) -> None:
        """Handle an escalation event."""
        if not rule.escalation_level:
            return
        
        from datetime import datetime, timezone
        import uuid
        
        event = EscalationEvent(
            event_id=str(uuid.uuid4()),
            rule_id=rule.rule_id,
            level=rule.escalation_level,
            reason=rule.description,
            context_data=context_dict,
            escalated_at=datetime.now(timezone.utc).isoformat()
        )
        
        # Call registered handlers
        handlers = self.escalation_handlers.get(rule.escalation_level, [])
        for handler in handlers:
            try:
                handler(event)
                event.handled = True
                event.handler = handler.__name__
            except Exception:
                # Continue to next handler if one fails
                pass
    
    def check_approval_required(self, context_dict: Dict[str, Any]) -> bool:
        """
        Check if any policy requires approval for the given context.
        
        Args:
            context_dict: Dictionary representation of AgentContext
            
        Returns:
            True if approval is required
        """
        evaluations = self.evaluate(context_dict)
        return any(
            e.matched and e.action == PolicyAction.REQUIRE_APPROVAL
            for e in evaluations
        )
    
    def get_violations(self, context_dict: Dict[str, Any]) -> List[PolicyEvaluation]:
        """
        Get all policy violations for the given context.
        
        Args:
            context_dict: Dictionary representation of AgentContext
            
        Returns:
            List of policy violations (DENY actions)
        """
        evaluations = self.evaluate(context_dict)
        return [
            e for e in evaluations
            if e.matched and e.action == PolicyAction.DENY
        ]
    
    def get_evaluation_history(
        self,
        rule_id: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[PolicyEvaluation]:
        """Get evaluation history, optionally filtered by rule."""
        history = self.evaluation_history
        
        if rule_id:
            history = [e for e in history if e.rule_id == rule_id]
        
        if limit:
            history = history[-limit:]
        
        return history
