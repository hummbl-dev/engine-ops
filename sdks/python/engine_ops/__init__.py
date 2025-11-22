"""
Engine-Ops Python SDK
High-performance optimization engine client library
"""

__version__ = "0.3.0"

from .client import EngineOpsClient
from .models import (
    OptimizationRequest,
    OptimizationResult,
    EngineConfig
)

# ML Plugin System
from .ml import (
    BaseMLModel,
    PredictionResult,
    MLPluginInterface,
    PluginMetadata,
    WorkloadDataPoint,
    WorkloadDataset
)

__all__ = [
    "EngineOpsClient",
    "OptimizationRequest",
    "OptimizationResult",
    "EngineConfig",
    # ML exports
    "BaseMLModel",
    "PredictionResult",
    "MLPluginInterface",
    "PluginMetadata",
    "WorkloadDataPoint",
    "WorkloadDataset",
]
