"""
Base class for ML models in Engine-Ops
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, List, Optional
from .workload_data import WorkloadDataPoint


@dataclass
class PredictionResult:
    """Result of a model prediction"""
    prediction: Dict[str, Any]
    confidence: float
    model_id: str
    metadata: Optional[Dict[str, Any]] = None


class BaseMLModel(ABC):
    """
    Base class for ML models used in optimization
    
    Custom ML models should inherit from this class and implement
    the required methods for training and prediction.
    """

    def __init__(self, model_id: str):
        """
        Initialize the model
        
        Args:
            model_id: Unique identifier for this model
        """
        self.model_id = model_id
        self.is_trained = False
        self.training_metadata: Dict[str, Any] = {}

    @abstractmethod
    def train(self, data: List[WorkloadDataPoint]) -> None:
        """
        Train the model with historical workload data
        
        Args:
            data: List of historical workload data points
        """
        pass

    @abstractmethod
    def predict(self, input_data: Dict[str, Any]) -> PredictionResult:
        """
        Make a prediction based on input data
        
        Args:
            input_data: Input features for prediction
            
        Returns:
            PredictionResult containing prediction and metadata
        """
        pass

    def get_metadata(self) -> Dict[str, Any]:
        """
        Get model metadata
        
        Returns:
            Dictionary containing model information
        """
        return {
            'model_id': self.model_id,
            'is_trained': self.is_trained,
            'training_metadata': self.training_metadata
        }

    def validate_training_data(self, data: List[WorkloadDataPoint]) -> bool:
        """
        Validate training data
        
        Args:
            data: Training data to validate
            
        Returns:
            True if data is valid, False otherwise
        """
        if not data:
            return False
        
        if len(data) < 10:
            # Need minimum amount of data for training
            return False
        
        return True

    def preprocess_data(self, data: List[WorkloadDataPoint]) -> tuple:
        """
        Preprocess workload data for training
        
        Args:
            data: Raw workload data
            
        Returns:
            Tuple of (features, labels) ready for training
        """
        features = []
        labels = []
        
        for dp in data:
            # Extract features
            feature_vector = [
                float(dp.timestamp),
                float(dp.duration),
            ]
            
            # Add resource usage
            for key in sorted(dp.resource_usage.keys()):
                feature_vector.append(float(dp.resource_usage[key]))
            
            features.append(feature_vector)
            labels.append(1 if dp.success else 0)
        
        return features, labels
