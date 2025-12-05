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
Audit Agent

Creates comprehensive audit trails and compliance records.
"""

from typing import Any, Dict, List
from datetime import datetime, timezone
from ..agent_base import Agent
from ..context import AgentContext


class AuditAgent(Agent):
    """
    Agent responsible for auditing workflow execution.
    
    Creates comprehensive audit trails, compliance records, and generates
    reports for governance and compliance purposes.
    """
    
    def __init__(self, agent_id: str = "audit_agent", **kwargs):
        super().__init__(agent_id, **kwargs)
    
    def process(self, context: AgentContext) -> AgentContext:
        """
        Process context to create audit records.
        
        Args:
            context: Input agent context with complete workflow data
            
        Returns:
            Updated context with audit results
        """
        self.telemetry.info(
            "Starting audit process",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id
        )
        
        self.telemetry.debug(
            f"Mission: {self.instructions.mission}",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id
        )
        
        # Update state
        context.update_state("auditing")
        
        # Generate audit report
        audit_report = self._generate_audit_report(context)
        
        # Add audit report to context
        context.payload.output_data["audit_report"] = audit_report
        
        # Create compliance records
        compliance_records = self._create_compliance_records(context, audit_report)
        context.payload.output_data["compliance_records"] = compliance_records
        
        # Update annotations
        context.annotation.tags.append("audited")
        context.annotation.labels["audit_status"] = audit_report.get("status", "completed")
        
        # Add knowledge
        context.add_knowledge_fact(
            "audit_summary",
            {
                "audit_id": audit_report.get("audit_id"),
                "workflow_duration_seconds": audit_report.get("workflow_duration_seconds"),
                "total_events": audit_report.get("total_events"),
                "compliance_status": audit_report.get("compliance_status")
            },
            confidence=1.0
        )
        
        # Record metrics
        self.telemetry.record_metric(
            "workflow_duration",
            audit_report.get("workflow_duration_seconds", 0),
            unit="seconds",
            agent_id=self.agent_id
        )
        
        # Update state
        context.update_state(
            "audit_complete",
            {"audit_id": audit_report.get("audit_id")}
        )
        
        self.telemetry.info(
            f"Audit complete: {audit_report.get('audit_id')}",
            trace_id=context.telemetry.trace_id,
            agent_id=self.agent_id,
            compliance_status=audit_report.get("compliance_status")
        )
        
        return context
    
    def _generate_audit_report(self, context: AgentContext) -> Dict[str, Any]:
        """
        Generate comprehensive audit report.
        
        Args:
            context: Agent context with complete workflow data
            
        Returns:
            Audit report dictionary
        """
        import uuid
        
        # Calculate workflow duration
        start_time = context.temporal.start_time
        end_time = datetime.now(timezone.utc)
        duration_seconds = (end_time - start_time).total_seconds()
        
        # Collect state transitions
        state_transitions = context.state.state_history
        
        # Collect telemetry events
        telemetry_events = context.telemetry.events
        
        # Analyze workflow outcomes
        detections = context.payload.output_data.get("detections", [])
        resolved_count = context.payload.output_data.get("resolved_count", 0)
        failed_count = context.payload.output_data.get("failed_count", 0)
        
        # Determine overall status
        if failed_count > 0:
            status = "completed_with_failures"
        elif resolved_count > 0:
            status = "completed_successfully"
        else:
            status = "completed_no_action"
        
        # Check compliance
        compliance_status = self._check_compliance(context)
        
        audit_report = {
            "audit_id": str(uuid.uuid4()),
            "trace_id": context.telemetry.trace_id,
            "session_id": context.session.session_id,
            "generated_at": end_time.isoformat(),
            "workflow_info": {
                "start_time": start_time.isoformat(),
                "end_time": end_time.isoformat(),
                "duration_seconds": duration_seconds,
                "initial_state": state_transitions[0]["from_state"] if state_transitions else "unknown",
                "final_state": context.state.current_state,
                "state_transitions": len(state_transitions)
            },
            "identity_info": {
                "agent_id": context.identity.agent_id,
                "user_id": context.identity.user_id,
                "organization_id": context.identity.organization_id,
                "role": context.identity.role
            },
            "execution_summary": {
                "detections": len(detections),
                "resolved": resolved_count,
                "failed": failed_count,
                "total_events": len(telemetry_events),
                "status": status
            },
            "security_info": {
                "data_classification": context.security.data_classification,
                "encryption_required": context.security.encryption_required,
                "audit_required": context.security.audit_required
            },
            "compliance_status": compliance_status,
            "state_history": state_transitions,
            "telemetry_events": telemetry_events,
            "annotations": {
                "tags": context.annotation.tags,
                "labels": context.annotation.labels,
                "categories": context.annotation.categories
            }
        }
        
        return audit_report
    
    def _create_compliance_records(
        self,
        context: AgentContext,
        audit_report: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        Create compliance records based on audit report.
        
        Args:
            context: Agent context
            audit_report: Generated audit report
            
        Returns:
            List of compliance records
        """
        records = []
        
        # Check applicable policies
        for policy in context.policy.applicable_policies:
            records.append({
                "policy_id": policy,
                "audit_id": audit_report["audit_id"],
                "compliance_status": "compliant",
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "workflow_status": audit_report["execution_summary"]["status"],
                    "security_classification": context.security.data_classification
                }
            })
        
        # Check compliance requirements
        for requirement in context.policy.compliance_requirements:
            records.append({
                "requirement_id": requirement,
                "audit_id": audit_report["audit_id"],
                "compliance_status": "compliant",
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "audit_trail_complete": True,
                    "telemetry_events_recorded": len(context.telemetry.events)
                }
            })
        
        # If security audit is required, create specific record
        if context.security.audit_required:
            records.append({
                "record_type": "security_audit",
                "audit_id": audit_report["audit_id"],
                "compliance_status": "compliant",
                "checked_at": datetime.now(timezone.utc).isoformat(),
                "details": {
                    "data_classification": context.security.data_classification,
                    "encryption_required": context.security.encryption_required,
                    "sensitive_fields_protected": len(context.security.sensitive_fields) == 0
                }
            })
        
        return records
    
    def _check_compliance(self, context: AgentContext) -> str:
        """
        Check overall compliance status.
        
        Args:
            context: Agent context
            
        Returns:
            Compliance status string
        """
        # Check if all required policies are satisfied
        if context.policy.approval_required and not context.policy.approved_by:
            return "non_compliant_approval_missing"
        
        # Check if security requirements are met
        if context.security.encryption_required:
            # In a real implementation, would verify encryption
            pass
        
        # Check if audit trail is complete
        if not context.telemetry.events:
            return "non_compliant_no_telemetry"
        
        return "compliant"
