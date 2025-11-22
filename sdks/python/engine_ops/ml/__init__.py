"""
ML Plugin System for Engine-Ops
Provides base classes and utilities for building ML-driven optimization plugins
"""

from .base_model import BaseMLModel, PredictionResult
from .plugin_interface import MLPluginInterface, PluginMetadata
from .workload_data import WorkloadDataPoint, WorkloadDataset

__all__ = [
    "BaseMLModel",
    "PredictionResult",
    "MLPluginInterface",
    "PluginMetadata",
    "WorkloadDataPoint",
    "WorkloadDataset",
]
