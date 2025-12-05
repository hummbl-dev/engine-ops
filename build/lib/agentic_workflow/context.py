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
Context Management Module

Provides comprehensive context tracking for agent operations including identity,
state, session, intent, policy, telemetry, and more.
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid


@dataclass
class IdentityContext:
    """Identity information for the agent or user initiating the workflow."""
    agent_id: str
    user_id: Optional[str] = None
    organization_id: Optional[str] = None
    role: Optional[str] = None
    permissions: List[str] = field(default_factory=list)


@dataclass
class StateContext:
    """Current state of the workflow or agent."""
    current_state: str = "initialized"
    previous_state: Optional[str] = None
    state_history: List[Dict[str, Any]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SessionContext:
    """Session-level tracking information."""
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    ttl_seconds: Optional[int] = 3600
    attributes: Dict[str, Any] = field(default_factory=dict)


@dataclass
class IntentContext:
    """Captures the intent and goals of the workflow."""
    primary_intent: str
    sub_intents: List[str] = field(default_factory=list)
    goals: List[str] = field(default_factory=list)
    constraints: Dict[str, Any] = field(default_factory=dict)
    priority: str = "normal"  # low, normal, high, critical


@dataclass
class PolicyContext:
    """Policy and compliance requirements."""
    applicable_policies: List[str] = field(default_factory=list)
    compliance_requirements: List[str] = field(default_factory=list)
    escalation_rules: Dict[str, Any] = field(default_factory=dict)
    approval_required: bool = False
    approved_by: Optional[str] = None


@dataclass
class TelemetryContext:
    """Telemetry and observability tracking."""
    trace_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    span_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    parent_span_id: Optional[str] = None
    metrics: Dict[str, Any] = field(default_factory=dict)
    events: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class KnowledgeContext:
    """Knowledge base and learned information."""
    facts: Dict[str, Any] = field(default_factory=dict)
    learned_patterns: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    confidence_scores: Dict[str, float] = field(default_factory=dict)


@dataclass
class DependenciesContext:
    """Dependencies and relationships to other systems."""
    upstream_services: List[str] = field(default_factory=list)
    downstream_services: List[str] = field(default_factory=list)
    external_systems: Dict[str, str] = field(default_factory=dict)
    required_capabilities: List[str] = field(default_factory=list)


@dataclass
class AnnotationContext:
    """Annotations and tags for classification."""
    tags: List[str] = field(default_factory=list)
    labels: Dict[str, str] = field(default_factory=dict)
    categories: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)


@dataclass
class SecurityContext:
    """Security-related context information."""
    encryption_required: bool = False
    data_classification: str = "internal"  # public, internal, confidential, restricted
    access_level: str = "standard"
    audit_required: bool = True
    sensitive_fields: List[str] = field(default_factory=list)


@dataclass
class ResourceContext:
    """Resource allocation and constraints."""
    allocated_memory_mb: Optional[int] = None
    allocated_cpu_cores: Optional[float] = None
    max_execution_time_seconds: Optional[int] = None
    resource_pool: Optional[str] = None
    cost_tracking: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TemporalContext:
    """Temporal information and scheduling."""
    start_time: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    deadline: Optional[datetime] = None
    estimated_duration_seconds: Optional[int] = None
    timezone: str = "UTC"
    schedule_info: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PayloadContext:
    """Actual data payload being processed."""
    input_data: Dict[str, Any] = field(default_factory=dict)
    output_data: Dict[str, Any] = field(default_factory=dict)
    intermediate_results: List[Dict[str, Any]] = field(default_factory=list)
    data_format: str = "json"
    data_size_bytes: int = 0


@dataclass
class RelationshipContext:
    """Relationships between entities in the workflow."""
    parent_context_id: Optional[str] = None
    child_context_ids: List[str] = field(default_factory=list)
    related_workflows: List[str] = field(default_factory=list)
    correlation_ids: Dict[str, str] = field(default_factory=dict)


@dataclass
class TopologyContext:
    """Infrastructure and deployment topology."""
    region: Optional[str] = None
    availability_zone: Optional[str] = None
    cluster_id: Optional[str] = None
    node_id: Optional[str] = None
    network_segment: Optional[str] = None
    deployment_environment: str = "production"  # development, staging, production


@dataclass
class AgentContext:
    """
    Comprehensive context object for agent operations.
    
    Aggregates all major context types for complete operational visibility
    and traceability across agent workflows.
    """
    identity: IdentityContext
    state: StateContext = field(default_factory=StateContext)
    session: SessionContext = field(default_factory=SessionContext)
    intent: Optional[IntentContext] = None
    policy: PolicyContext = field(default_factory=PolicyContext)
    telemetry: TelemetryContext = field(default_factory=TelemetryContext)
    knowledge: KnowledgeContext = field(default_factory=KnowledgeContext)
    dependencies: DependenciesContext = field(default_factory=DependenciesContext)
    annotation: AnnotationContext = field(default_factory=AnnotationContext)
    security: SecurityContext = field(default_factory=SecurityContext)
    resource: ResourceContext = field(default_factory=ResourceContext)
    temporal: TemporalContext = field(default_factory=TemporalContext)
    payload: PayloadContext = field(default_factory=PayloadContext)
    relationship: RelationshipContext = field(default_factory=RelationshipContext)
    topology: TopologyContext = field(default_factory=TopologyContext)
    
    def update_state(self, new_state: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """Update the current state and track history."""
        self.state.state_history.append({
            "from_state": self.state.current_state,
            "to_state": new_state,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {}
        })
        self.state.previous_state = self.state.current_state
        self.state.current_state = new_state
        self.session.last_updated = datetime.now(timezone.utc)
    
    def add_telemetry_event(self, event_type: str, event_data: Dict[str, Any]) -> None:
        """Add a telemetry event for tracking."""
        self.telemetry.events.append({
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": event_data
        })
    
    def add_knowledge_fact(self, key: str, value: Any, confidence: float = 1.0) -> None:
        """Add a knowledge fact with confidence score."""
        self.knowledge.facts[key] = value
        self.knowledge.confidence_scores[key] = confidence
    
    def clone_for_child(self) -> "AgentContext":
        """Create a child context that inherits from this context."""
        from copy import deepcopy
        child_ctx = deepcopy(self)
        
        # Generate new IDs for child
        child_ctx.session.session_id = str(uuid.uuid4())
        child_ctx.telemetry.span_id = str(uuid.uuid4())
        child_ctx.telemetry.parent_span_id = self.telemetry.span_id
        
        # Update relationships
        child_ctx.relationship.parent_context_id = self.session.session_id
        
        # Clear child-specific data
        child_ctx.payload.output_data = {}
        child_ctx.payload.intermediate_results = []
        
        return child_ctx
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert context to dictionary representation."""
        from dataclasses import asdict
        return asdict(self)
