"""
Plugin interface for ML-driven optimization
"""

from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod
from .base_model import BaseMLModel, PredictionResult
from .workload_data import WorkloadDataPoint


@dataclass
class PluginMetadata:
    """Plugin metadata"""
    name: str
    version: str
    description: str
    author: Optional[str] = None
    supported_types: Optional[List[str]] = None


class MLPluginInterface(ABC):
    """
    Interface for ML-driven optimization plugins
    
    Implement this interface to create custom ML plugins that can be
    integrated with the Engine-Ops optimization engine.
    """

    def __init__(self, metadata: PluginMetadata, model: BaseMLModel):
        """
        Initialize the plugin
        
        Args:
            metadata: Plugin metadata
            model: ML model instance
        """
        self.metadata = metadata
        self.model = model
        self.is_initialized = False
        self.config: Dict[str, Any] = {}

    def init(self, config: Optional[Dict[str, Any]] = None) -> None:
        """
        Initialize the plugin with configuration
        
        Args:
            config: Plugin configuration dictionary
        """
        self.config = config or {}
        self.is_initialized = True

    def can_handle(self, request_type: str) -> bool:
        """
        Check if plugin can handle a request type
        
        Args:
            request_type: Type of optimization request
            
        Returns:
            True if plugin can handle this request type
        """
        if not self.metadata.supported_types:
            return False
        return request_type in self.metadata.supported_types

    @abstractmethod
    def optimize(
        self, 
        request_data: Dict[str, Any], 
        historical_data: Optional[List[WorkloadDataPoint]] = None
    ) -> Dict[str, Any]:
        """
        Execute optimization using ML model
        
        Args:
            request_data: Optimization request data
            historical_data: Optional historical workload data
            
        Returns:
            Optimization result dictionary
        """
        pass

    def train_model(self, data: List[WorkloadDataPoint]) -> None:
        """
        Train the ML model with historical data
        
        Args:
            data: Historical workload data for training
        """
        if not self.is_initialized:
            raise RuntimeError(f"Plugin {self.metadata.name} not initialized")
        
        self.model.train(data)

    def predict(self, input_data: Dict[str, Any]) -> PredictionResult:
        """
        Make prediction using the ML model
        
        Args:
            input_data: Input data for prediction
            
        Returns:
            Prediction result
        """
        if not self.is_initialized:
            raise RuntimeError(f"Plugin {self.metadata.name} not initialized")
        
        return self.model.predict(input_data)

    def get_info(self) -> Dict[str, Any]:
        """
        Get plugin information
        
        Returns:
            Dictionary with plugin and model information
        """
        return {
            'plugin': {
                'name': self.metadata.name,
                'version': self.metadata.version,
                'description': self.metadata.description,
                'author': self.metadata.author,
                'supported_types': self.metadata.supported_types
            },
            'model': self.model.get_metadata(),
            'is_initialized': self.is_initialized
        }

    def shutdown(self) -> None:
        """Cleanup and release resources"""
        self.is_initialized = False
