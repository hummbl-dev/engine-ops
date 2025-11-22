"""
Example ML models and plugins for Engine-Ops
"""

from .simple_predictor import SimplePredictorModel, SimplePredictorPlugin
from .resource_optimizer import ResourceOptimizerModel, ResourceOptimizerPlugin

__all__ = [
    "SimplePredictorModel",
    "SimplePredictorPlugin",
    "ResourceOptimizerModel",
    "ResourceOptimizerPlugin",
]
