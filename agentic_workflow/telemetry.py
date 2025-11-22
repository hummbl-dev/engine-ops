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
Telemetry and Observability Module

Provides auditable logging and telemetry tracking for agent operations.
"""

from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json


class LogLevel(Enum):
    """Log severity levels."""
    DEBUG = "debug"
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class EventType(Enum):
    """Types of telemetry events."""
    AGENT_START = "agent_start"
    AGENT_COMPLETE = "agent_complete"
    AGENT_ERROR = "agent_error"
    STATE_CHANGE = "state_change"
    POLICY_EVALUATION = "policy_evaluation"
    ESCALATION = "escalation"
    METRIC = "metric"
    AUDIT = "audit"


@dataclass
class LogEntry:
    """Represents a single log entry."""
    timestamp: str
    level: LogLevel
    message: str
    trace_id: Optional[str] = None
    span_id: Optional[str] = None
    agent_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TelemetryEvent:
    """Represents a telemetry event."""
    event_id: str
    event_type: EventType
    timestamp: str
    trace_id: str
    span_id: str
    agent_id: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MetricPoint:
    """Represents a single metric data point."""
    metric_name: str
    value: float
    timestamp: str
    unit: str = "count"
    tags: Dict[str, str] = field(default_factory=dict)


class TelemetryCollector:
    """
    Collects and manages telemetry data for agent operations.
    
    Provides structured logging, event tracking, and metrics collection
    with audit trail capabilities.
    """
    
    def __init__(self, enable_console_output: bool = True):
        self.enable_console_output = enable_console_output
        self.logs: List[LogEntry] = []
        self.events: List[TelemetryEvent] = []
        self.metrics: List[MetricPoint] = []
        self._audit_mode = True
    
    def log(
        self,
        level: LogLevel,
        message: str,
        trace_id: Optional[str] = None,
        span_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        **metadata
    ) -> None:
        """
        Log a message with structured metadata.
        
        Args:
            level: Log severity level
            message: Log message
            trace_id: Optional trace ID for distributed tracing
            span_id: Optional span ID
            agent_id: Optional agent identifier
            **metadata: Additional key-value metadata
        """
        entry = LogEntry(
            timestamp=datetime.utcnow().isoformat(),
            level=level,
            message=message,
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            metadata=metadata
        )
        self.logs.append(entry)
        
        if self.enable_console_output:
            self._print_log(entry)
    
    def _print_log(self, entry: LogEntry) -> None:
        """Print log entry to console."""
        level_str = entry.level.value.upper()
        trace_info = f"[{entry.trace_id[:8]}]" if entry.trace_id else ""
        agent_info = f"[{entry.agent_id}]" if entry.agent_id else ""
        print(f"{entry.timestamp} {level_str} {trace_info}{agent_info} {entry.message}")
    
    def debug(self, message: str, **kwargs) -> None:
        """Log debug message."""
        self.log(LogLevel.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs) -> None:
        """Log info message."""
        self.log(LogLevel.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs) -> None:
        """Log warning message."""
        self.log(LogLevel.WARNING, message, **kwargs)
    
    def error(self, message: str, **kwargs) -> None:
        """Log error message."""
        self.log(LogLevel.ERROR, message, **kwargs)
    
    def critical(self, message: str, **kwargs) -> None:
        """Log critical message."""
        self.log(LogLevel.CRITICAL, message, **kwargs)
    
    def record_event(
        self,
        event_type: EventType,
        trace_id: str,
        span_id: str,
        agent_id: Optional[str] = None,
        **data
    ) -> TelemetryEvent:
        """
        Record a telemetry event.
        
        Args:
            event_type: Type of event
            trace_id: Trace ID for correlation
            span_id: Span ID
            agent_id: Optional agent identifier
            **data: Event-specific data
            
        Returns:
            The created telemetry event
        """
        import uuid
        
        event = TelemetryEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            timestamp=datetime.utcnow().isoformat(),
            trace_id=trace_id,
            span_id=span_id,
            agent_id=agent_id,
            data=data
        )
        self.events.append(event)
        
        # Also log significant events
        if event_type in [EventType.AGENT_ERROR, EventType.ESCALATION]:
            self.log(
                LogLevel.WARNING if event_type == EventType.ESCALATION else LogLevel.ERROR,
                f"Event: {event_type.value}",
                trace_id=trace_id,
                span_id=span_id,
                agent_id=agent_id,
                event_data=data
            )
        
        return event
    
    def record_metric(
        self,
        metric_name: str,
        value: float,
        unit: str = "count",
        **tags
    ) -> MetricPoint:
        """
        Record a metric data point.
        
        Args:
            metric_name: Name of the metric
            value: Metric value
            unit: Unit of measurement
            **tags: Additional tags for the metric
            
        Returns:
            The created metric point
        """
        metric = MetricPoint(
            metric_name=metric_name,
            value=value,
            timestamp=datetime.utcnow().isoformat(),
            unit=unit,
            tags=tags
        )
        self.metrics.append(metric)
        return metric
    
    def get_logs(
        self,
        level: Optional[LogLevel] = None,
        trace_id: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[LogEntry]:
        """
        Retrieve logs with optional filtering.
        
        Args:
            level: Filter by log level
            trace_id: Filter by trace ID
            limit: Maximum number of logs to return
            
        Returns:
            Filtered list of log entries
        """
        logs = self.logs
        
        if level:
            logs = [log for log in logs if log.level == level]
        
        if trace_id:
            logs = [log for log in logs if log.trace_id == trace_id]
        
        if limit:
            logs = logs[-limit:]
        
        return logs
    
    def get_events(
        self,
        event_type: Optional[EventType] = None,
        trace_id: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[TelemetryEvent]:
        """
        Retrieve events with optional filtering.
        
        Args:
            event_type: Filter by event type
            trace_id: Filter by trace ID
            limit: Maximum number of events to return
            
        Returns:
            Filtered list of telemetry events
        """
        events = self.events
        
        if event_type:
            events = [e for e in events if e.event_type == event_type]
        
        if trace_id:
            events = [e for e in events if e.trace_id == trace_id]
        
        if limit:
            events = events[-limit:]
        
        return events
    
    def get_metrics(
        self,
        metric_name: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[MetricPoint]:
        """
        Retrieve metrics with optional filtering.
        
        Args:
            metric_name: Filter by metric name
            limit: Maximum number of metrics to return
            
        Returns:
            Filtered list of metric points
        """
        metrics = self.metrics
        
        if metric_name:
            metrics = [m for m in metrics if m.metric_name == metric_name]
        
        if limit:
            metrics = metrics[-limit:]
        
        return metrics
    
    def generate_audit_report(self, trace_id: str) -> Dict[str, Any]:
        """
        Generate an audit report for a specific trace.
        
        Args:
            trace_id: Trace ID to generate report for
            
        Returns:
            Audit report dictionary
        """
        trace_logs = self.get_logs(trace_id=trace_id)
        trace_events = self.get_events(trace_id=trace_id)
        
        return {
            "trace_id": trace_id,
            "generated_at": datetime.utcnow().isoformat(),
            "summary": {
                "total_logs": len(trace_logs),
                "total_events": len(trace_events),
                "log_levels": {
                    level.value: len([l for l in trace_logs if l.level == level])
                    for level in LogLevel
                },
                "event_types": {
                    et.value: len([e for e in trace_events if e.event_type == et])
                    for et in EventType
                }
            },
            "logs": [self._log_to_dict(log) for log in trace_logs],
            "events": [self._event_to_dict(event) for event in trace_events]
        }
    
    def _log_to_dict(self, log: LogEntry) -> Dict[str, Any]:
        """Convert log entry to dictionary."""
        return {
            "timestamp": log.timestamp,
            "level": log.level.value,
            "message": log.message,
            "trace_id": log.trace_id,
            "span_id": log.span_id,
            "agent_id": log.agent_id,
            "metadata": log.metadata
        }
    
    def _event_to_dict(self, event: TelemetryEvent) -> Dict[str, Any]:
        """Convert telemetry event to dictionary."""
        return {
            "event_id": event.event_id,
            "event_type": event.event_type.value,
            "timestamp": event.timestamp,
            "trace_id": event.trace_id,
            "span_id": event.span_id,
            "agent_id": event.agent_id,
            "data": event.data
        }
    
    def clear(self) -> None:
        """Clear all collected telemetry data."""
        self.logs.clear()
        self.events.clear()
        self.metrics.clear()


# Global telemetry collector instance
_global_collector = TelemetryCollector()


def get_telemetry_collector() -> TelemetryCollector:
    """Get the global telemetry collector instance."""
    return _global_collector
