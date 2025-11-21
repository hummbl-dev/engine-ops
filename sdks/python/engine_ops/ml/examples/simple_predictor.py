"""
Simple predictor model example
Demonstrates basic ML model integration
"""

from typing import Dict, Any, List, Optional
import statistics
from ..base_model import BaseMLModel, PredictionResult
from ..plugin_interface import MLPluginInterface, PluginMetadata
from ..workload_data import WorkloadDataPoint


class SimplePredictorModel(BaseMLModel):
    """
    Simple statistical predictor model
    
    This model uses historical averages to predict resource requirements
    and success probability.
    """

    def __init__(self, model_id: str = "simple-predictor"):
        super().__init__(model_id)
        self.avg_duration = 0.0
        self.success_rate = 0.0
        self.resource_averages: Dict[str, float] = {}

    def train(self, data: List[WorkloadDataPoint]) -> None:
        """Train model with historical data"""
        if not self.validate_training_data(data):
            raise ValueError("Insufficient training data")

        # Calculate averages
        durations = [dp.duration for dp in data]
        self.avg_duration = statistics.mean(durations)
        
        success_count = sum(1 for dp in data if dp.success)
        self.success_rate = success_count / len(data)

        # Calculate resource averages
        all_resources: Dict[str, List[float]] = {}
        for dp in data:
            for key, value in dp.resource_usage.items():
                if key not in all_resources:
                    all_resources[key] = []
                all_resources[key].append(value)

        self.resource_averages = {
            key: statistics.mean(values)
            for key, values in all_resources.items()
        }

        self.is_trained = True
        self.training_metadata = {
            'training_samples': len(data),
            'avg_duration': self.avg_duration,
            'success_rate': self.success_rate,
            'resource_types': list(self.resource_averages.keys())
        }

    def predict(self, input_data: Dict[str, Any]) -> PredictionResult:
        """Make prediction based on input"""
        if not self.is_trained:
            raise RuntimeError("Model not trained")

        # Simple prediction based on historical averages
        prediction = {
            'expected_duration': self.avg_duration,
            'success_probability': self.success_rate,
            'recommended_resources': self.resource_averages.copy()
        }

        # Adjust based on input if provided
        if 'workload_size' in input_data:
            workload_size = input_data['workload_size']
            if isinstance(workload_size, (int, float)):
                # Scale predictions based on workload size
                scale_factor = workload_size / 100.0  # Assume 100 is baseline
                prediction['expected_duration'] *= scale_factor
                prediction['recommended_resources'] = {
                    k: v * scale_factor
                    for k, v in self.resource_averages.items()
                }

        return PredictionResult(
            prediction=prediction,
            confidence=self.success_rate,
            model_id=self.model_id,
            metadata={'training_samples': self.training_metadata.get('training_samples', 0)}
        )


class SimplePredictorPlugin(MLPluginInterface):
    """Simple predictor plugin implementation"""

    def __init__(self):
        metadata = PluginMetadata(
            name="simple-predictor",
            version="1.0.0",
            description="Simple statistical predictor for resource optimization",
            author="HUMMBL, LLC",
            supported_types=["ml-driven", "resource", "scheduling"]
        )
        model = SimplePredictorModel()
        super().__init__(metadata, model)

    def optimize(
        self, 
        request_data: Dict[str, Any], 
        historical_data: Optional[List[WorkloadDataPoint]] = None
    ) -> Dict[str, Any]:
        """Execute optimization"""
        # Train model if we have historical data
        if historical_data and len(historical_data) >= 10 and not self.model.is_trained:
            self.train_model(historical_data)

        # Make prediction if model is trained
        if self.model.is_trained:
            prediction_result = self.predict(request_data)
            return {
                'success': True,
                'result': prediction_result.prediction,
                'confidence': prediction_result.confidence,
                'model_id': prediction_result.model_id
            }
        else:
            # Fallback to basic response
            return {
                'success': False,
                'error': 'Insufficient training data',
                'model_id': self.model.model_id
            }
