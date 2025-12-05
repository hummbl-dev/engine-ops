"""
Production Monitoring & Observability

Prometheus metrics integration for the Sovereign Stack.
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest
from functools import wraps
import time


# Define metrics
agent_execution_duration = Histogram(
    "agent_execution_duration_seconds", "Time spent executing agent", ["agent_type"]
)

debate_rounds = Histogram(
    "debate_rounds_total", "Number of rounds in multi-agent debate", ["issue_severity"]
)

policy_violations = Counter(
    "policy_violations_total", "Total policy violations detected", ["violation_type"]
)

memory_query_duration = Histogram("memory_query_duration_seconds", "ChromaDB query latency")

federated_sync_success_rate = Gauge(
    "federated_sync_success_rate", "Success rate of federated memory synchronization"
)

active_agents = Gauge("active_agents_total", "Number of currently active agents")


def track_execution_time(agent_type: str):
    """Decorator to track agent execution time."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start
                agent_execution_duration.labels(agent_type=agent_type).observe(duration)

        return wrapper

    return decorator


def get_metrics():
    """Get current Prometheus metrics in text format."""
    return generate_latest().decode("utf-8")
