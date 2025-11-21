"""
Resource optimizer model example
Demonstrates ML-based resource allocation optimization
"""

from typing import Dict, Any, List, Optional
import statistics
from ..base_model import BaseMLModel, PredictionResult
from ..plugin_interface import MLPluginInterface, PluginMetadata
from ..workload_data import WorkloadDataPoint


class ResourceOptimizerModel(BaseMLModel):
    """
    ML model for optimizing resource allocation
    
    Uses historical patterns to recommend optimal resource configurations
    and predict performance outcomes.
    """

    def __init__(self, model_id: str = "resource-optimizer"):
        super().__init__(model_id)
        self.resource_patterns: Dict[str, Dict[str, Any]] = {}
        self.performance_metrics: Dict[str, float] = {}

    def train(self, data: List[WorkloadDataPoint]) -> None:
        """Train model with historical workload data"""
        if not self.validate_training_data(data):
            raise ValueError("Insufficient training data")

        # Analyze patterns by request type
        type_groups: Dict[str, List[WorkloadDataPoint]] = {}
        for dp in data:
            if dp.request_type not in type_groups:
                type_groups[dp.request_type] = []
            type_groups[dp.request_type].append(dp)

        # Build resource patterns for each type
        for req_type, points in type_groups.items():
            # Separate successful and failed requests
            successful = [p for p in points if p.success]
            failed = [p for p in points if not p.success]

            if not successful:
                continue

            # Calculate optimal resource configuration from successful requests
            resource_keys = set()
            for p in successful:
                resource_keys.update(p.resource_usage.keys())

            optimal_resources = {}
            for key in resource_keys:
                values = [p.resource_usage.get(key, 0) for p in successful]
                # Use median for robustness
                if values:
                    optimal_resources[key] = statistics.median(values)

            # Calculate performance metrics
            durations = [p.duration for p in successful]
            success_rate = len(successful) / len(points)

            self.resource_patterns[req_type] = {
                'optimal_resources': optimal_resources,
                'avg_duration': statistics.mean(durations),
                'median_duration': statistics.median(durations),
                'success_rate': success_rate,
                'sample_count': len(points)
            }

        # Global performance metrics
        all_durations = [dp.duration for dp in data]
        all_successes = sum(1 for dp in data if dp.success)
        
        self.performance_metrics = {
            'overall_success_rate': all_successes / len(data),
            'avg_duration': statistics.mean(all_durations),
            'total_samples': len(data)
        }

        self.is_trained = True
        self.training_metadata = {
            'training_samples': len(data),
            'request_types': list(self.resource_patterns.keys()),
            'overall_metrics': self.performance_metrics
        }

    def predict(self, input_data: Dict[str, Any]) -> PredictionResult:
        """Predict optimal resource allocation"""
        if not self.is_trained:
            raise RuntimeError("Model not trained")

        request_type = input_data.get('type', 'unknown')
        
        # Get pattern for this request type
        pattern = self.resource_patterns.get(request_type)
        
        if pattern:
            # Use learned pattern
            prediction = {
                'optimal_resources': pattern['optimal_resources'].copy(),
                'expected_duration': pattern['median_duration'],
                'success_probability': pattern['success_rate'],
                'confidence': 'high'
            }
            confidence = pattern['success_rate']
        else:
            # Fallback to global averages
            all_resources = {}
            for pattern in self.resource_patterns.values():
                for key, value in pattern['optimal_resources'].items():
                    if key not in all_resources:
                        all_resources[key] = []
                    all_resources[key].append(value)
            
            avg_resources = {
                key: statistics.mean(values)
                for key, values in all_resources.items()
            }
            
            prediction = {
                'optimal_resources': avg_resources,
                'expected_duration': self.performance_metrics['avg_duration'],
                'success_probability': self.performance_metrics['overall_success_rate'],
                'confidence': 'medium'
            }
            confidence = self.performance_metrics['overall_success_rate']

        # Apply scaling if workload size is provided
        if 'workload_size' in input_data:
            workload_size = input_data['workload_size']
            if isinstance(workload_size, (int, float)):
                scale = workload_size / 100.0
                prediction['optimal_resources'] = {
                    k: v * scale for k, v in prediction['optimal_resources'].items()
                }
                prediction['expected_duration'] *= scale

        return PredictionResult(
            prediction=prediction,
            confidence=confidence,
            model_id=self.model_id,
            metadata={
                'request_type': request_type,
                'pattern_available': pattern is not None
            }
        )


class ResourceOptimizerPlugin(MLPluginInterface):
    """Resource optimizer plugin implementation"""

    def __init__(self):
        metadata = PluginMetadata(
            name="resource-optimizer",
            version="1.0.0",
            description="ML-driven resource allocation optimizer",
            author="HUMMBL, LLC",
            supported_types=["resource", "ml-driven"]
        )
        model = ResourceOptimizerModel()
        super().__init__(metadata, model)

    def optimize(
        self, 
        request_data: Dict[str, Any], 
        historical_data: Optional[List[WorkloadDataPoint]] = None
    ) -> Dict[str, Any]:
        """Execute resource optimization"""
        # Train if needed and data available
        if historical_data and len(historical_data) >= 10 and not self.model.is_trained:
            try:
                self.train_model(historical_data)
            except ValueError as e:
                return {
                    'success': False,
                    'error': f'Training failed: {str(e)}',
                    'model_id': self.model.model_id
                }

        # Make prediction if trained
        if self.model.is_trained:
            try:
                prediction_result = self.predict(request_data)
                return {
                    'success': True,
                    'result': prediction_result.prediction,
                    'confidence': prediction_result.confidence,
                    'model_id': prediction_result.model_id,
                    'metadata': prediction_result.metadata
                }
            except Exception as e:
                return {
                    'success': False,
                    'error': f'Prediction failed: {str(e)}',
                    'model_id': self.model.model_id
                }
        else:
            return {
                'success': False,
                'error': 'Model not trained - need at least 10 historical data points',
                'model_id': self.model.model_id
            }
