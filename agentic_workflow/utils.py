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
Utility Functions Module

Helper functions and utilities for the agentic workflow system.
"""

from typing import Any, Dict, Optional
from datetime import datetime, timedelta
import json


def serialize_context(context: Any) -> str:
    """
    Serialize an AgentContext to JSON string.

    Args:
        context: AgentContext instance

    Returns:
        JSON string representation
    """
    context_dict = context.to_dict()
    return json.dumps(context_dict, default=str, indent=2)


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """
    Format a datetime object to ISO 8601 string.

    Args:
        dt: Datetime object (defaults to current UTC time)

    Returns:
        ISO 8601 formatted string
    """
    if dt is None:
        dt = datetime.utcnow()
    return dt.isoformat()


def calculate_duration(start_time: datetime, end_time: Optional[datetime] = None) -> float:
    """
    Calculate duration between two timestamps in seconds.

    Args:
        start_time: Start timestamp
        end_time: End timestamp (defaults to current UTC time)

    Returns:
        Duration in seconds
    """
    if end_time is None:
        end_time = datetime.utcnow()
    return (end_time - start_time).total_seconds()


def is_deadline_exceeded(deadline: Optional[datetime]) -> bool:
    """
    Check if a deadline has been exceeded.

    Args:
        deadline: Deadline timestamp

    Returns:
        True if deadline has passed
    """
    if deadline is None:
        return False
    return datetime.utcnow() > deadline


def calculate_deadline(duration_seconds: int) -> datetime:
    """
    Calculate a deadline timestamp from a duration.

    Args:
        duration_seconds: Duration in seconds from now

    Returns:
        Deadline timestamp
    """
    return datetime.utcnow() + timedelta(seconds=duration_seconds)


def sanitize_sensitive_data(data: Dict[str, Any], sensitive_fields: list) -> Dict[str, Any]:
    """
    Sanitize sensitive fields from data dictionary.

    Args:
        data: Data dictionary to sanitize
        sensitive_fields: List of field names to redact

    Returns:
        Sanitized data dictionary
    """
    sanitized = data.copy()

    for field in sensitive_fields:
        if field in sanitized:
            sanitized[field] = "***REDACTED***"

    return sanitized


def merge_dicts(dict1: Dict[str, Any], dict2: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deep merge two dictionaries.

    Args:
        dict1: First dictionary
        dict2: Second dictionary (takes precedence)

    Returns:
        Merged dictionary
    """
    result = dict1.copy()

    for key, value in dict2.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value

    return result


def extract_metrics_summary(context: Any) -> Dict[str, Any]:
    """
    Extract key metrics from context for reporting.

    Args:
        context: AgentContext instance

    Returns:
        Dictionary of key metrics
    """
    return {
        "session_id": context.session.session_id,
        "trace_id": context.telemetry.trace_id,
        "current_state": context.state.current_state,
        "state_transitions": len(context.state.state_history),
        "telemetry_events": len(context.telemetry.events),
        "knowledge_facts": len(context.knowledge.facts),
        "tags": context.annotation.tags,
        "priority": context.intent.priority if context.intent else None,
        "data_classification": context.security.data_classification,
    }


def validate_context_completeness(context: Any) -> tuple[bool, list]:
    """
    Validate that a context has all required fields populated.

    Args:
        context: AgentContext instance

    Returns:
        Tuple of (is_valid, list_of_missing_fields)
    """
    missing_fields = []

    # Check required fields
    if not context.identity or not context.identity.agent_id:
        missing_fields.append("identity.agent_id")

    if not context.session or not context.session.session_id:
        missing_fields.append("session.session_id")

    if not context.telemetry or not context.telemetry.trace_id:
        missing_fields.append("telemetry.trace_id")

    if not context.state or not context.state.current_state:
        missing_fields.append("state.current_state")

    return len(missing_fields) == 0, missing_fields


def create_context_snapshot(context: Any) -> Dict[str, Any]:
    """
    Create a lightweight snapshot of context for checkpointing.

    Args:
        context: AgentContext instance

    Returns:
        Snapshot dictionary with essential fields
    """
    return {
        "session_id": context.session.session_id,
        "trace_id": context.telemetry.trace_id,
        "current_state": context.state.current_state,
        "timestamp": format_timestamp(),
        "agent_id": context.identity.agent_id,
        "state_history_length": len(context.state.state_history),
        "output_keys": list(context.payload.output_data.keys()),
    }


def compare_contexts(ctx1: Any, ctx2: Any) -> Dict[str, Any]:
    """
    Compare two contexts and identify differences.

    Args:
        ctx1: First AgentContext
        ctx2: Second AgentContext

    Returns:
        Dictionary describing differences
    """
    differences = {
        "state_changed": ctx1.state.current_state != ctx2.state.current_state,
        "state_transitions_added": len(ctx2.state.state_history) - len(ctx1.state.state_history),
        "telemetry_events_added": len(ctx2.telemetry.events) - len(ctx1.telemetry.events),
        "knowledge_facts_added": len(ctx2.knowledge.facts) - len(ctx1.knowledge.facts),
        "new_output_keys": [
            k for k in ctx2.payload.output_data.keys() if k not in ctx1.payload.output_data
        ],
        "tags_added": [t for t in ctx2.annotation.tags if t not in ctx1.annotation.tags],
    }

    return differences


def format_audit_summary(audit_report: Dict[str, Any]) -> str:
    """
    Format an audit report for human-readable output.

    Args:
        audit_report: Audit report dictionary

    Returns:
        Formatted string
    """
    lines = [
        "=" * 60,
        "AUDIT REPORT",
        "=" * 60,
        f"Audit ID: {audit_report.get('audit_id')}",
        f"Trace ID: {audit_report.get('trace_id')}",
        f"Generated: {audit_report.get('generated_at')}",
        "",
        "Workflow Information:",
        f"  Duration: {audit_report.get('workflow_info', {}).get('duration_seconds', 0):.2f} seconds",
        f"  State Transitions: {audit_report.get('workflow_info', {}).get('state_transitions', 0)}",
        f"  Final State: {audit_report.get('workflow_info', {}).get('final_state')}",
        "",
        "Execution Summary:",
        f"  Detections: {audit_report.get('execution_summary', {}).get('detections', 0)}",
        f"  Resolved: {audit_report.get('execution_summary', {}).get('resolved', 0)}",
        f"  Failed: {audit_report.get('execution_summary', {}).get('failed', 0)}",
        f"  Status: {audit_report.get('execution_summary', {}).get('status')}",
        "",
        f"Compliance Status: {audit_report.get('compliance_status')}",
        "=" * 60,
    ]

    return "\n".join(lines)
