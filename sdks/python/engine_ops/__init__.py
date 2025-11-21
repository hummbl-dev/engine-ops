"""
Engine-Ops Python SDK
High-performance optimization engine client library
"""

__version__ = "0.2.0"

from .client import EngineOpsClient
from .models import (
    OptimizationRequest,
    OptimizationResult,
    EngineConfig
)

__all__ = [
    "EngineOpsClient",
    "OptimizationRequest",
    "OptimizationResult",
    "EngineConfig"
]
