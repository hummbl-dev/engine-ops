#!/usr/bin/env python3
"""
Example demonstrating ML plugin system with Python

This example shows how to:
1. Create a custom ML model
2. Use the ML plugin interface
3. Train on historical data
4. Make predictions
"""

import sys
import os
import time
from typing import Dict, Any, List

# Add SDK to path for standalone execution
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../sdks/python'))

# Import Engine-Ops ML utilities
from engine_ops.ml import (
    BaseMLModel,
    PredictionResult,
    MLPluginInterface,
    PluginMetadata,
    WorkloadDataPoint,
    WorkloadDataset
)


# Custom ML Model
class CustomPredictorModel(BaseMLModel):
    """Simple custom ML model for demonstration"""
    
    def __init__(self):
        super().__init__("custom-predictor")
        self.patterns = {}
    
    def train(self, data: List[WorkloadDataPoint]) -> None:
        """Train on historical workload data"""
        print(f"Training model with {len(data)} samples...")
        
        if not self.validate_training_data(data):
            raise ValueError("Insufficient training data")
        
        # Group by request type
        type_groups: Dict[str, List[WorkloadDataPoint]] = {}
        for dp in data:
            if dp.request_type not in type_groups:
                type_groups[dp.request_type] = []
            type_groups[dp.request_type].append(dp)
        
        # Learn patterns
        for req_type, points in type_groups.items():
            successful = [p for p in points if p.success]
            if successful:
                avg_duration = sum(p.duration for p in successful) / len(successful)
                success_rate = len(successful) / len(points)
                
                self.patterns[req_type] = {
                    'avg_duration': avg_duration,
                    'success_rate': success_rate,
                    'sample_count': len(points)
                }
        
        self.is_trained = True
        self.training_metadata = {
            'training_samples': len(data),
            'patterns_learned': len(self.patterns),
            'request_types': list(self.patterns.keys())
        }
        
        print(f"✓ Model trained on {len(self.patterns)} patterns")
    
    def predict(self, input_data: Dict[str, Any]) -> PredictionResult:
        """Make prediction for optimization request"""
        if not self.is_trained:
            raise RuntimeError("Model not trained")
        
        req_type = input_data.get('type', 'unknown')
        pattern = self.patterns.get(req_type)
        
        if pattern:
            prediction = {
                'expected_duration': pattern['avg_duration'],
                'success_probability': pattern['success_rate'],
                'confidence': 'high'
            }
            confidence = pattern['success_rate']
        else:
            # Fallback prediction
            prediction = {
                'expected_duration': 100.0,
                'success_probability': 0.5,
                'confidence': 'low'
            }
            confidence = 0.5
        
        return PredictionResult(
            prediction=prediction,
            confidence=confidence,
            model_id=self.model_id,
            metadata={'pattern_available': pattern is not None}
        )


# Custom Plugin
class CustomOptimizerPlugin(MLPluginInterface):
    """Custom ML optimization plugin"""
    
    def __init__(self):
        metadata = PluginMetadata(
            name="custom-optimizer",
            version="1.0.0",
            description="Custom ML-driven optimizer for demonstration",
            author="Engine-Ops Team",
            supported_types=["ml-driven", "resource", "scheduling"]
        )
        model = CustomPredictorModel()
        super().__init__(metadata, model)
    
    def optimize(
        self,
        request_data: Dict[str, Any],
        historical_data: List[WorkloadDataPoint] = None
    ) -> Dict[str, Any]:
        """Execute optimization using ML model"""
        
        # Train if we have data and model isn't trained
        if historical_data and len(historical_data) >= 10:
            if not self.model.is_trained:
                self.train_model(historical_data)
        
        # Make prediction if trained
        if self.model.is_trained:
            try:
                result = self.predict(request_data)
                return {
                    'success': True,
                    'result': result.prediction,
                    'confidence': result.confidence,
                    'model_id': result.model_id,
                    'metadata': result.metadata
                }
            except Exception as e:
                return {
                    'success': False,
                    'error': f'Prediction failed: {str(e)}'
                }
        else:
            return {
                'success': False,
                'error': 'Model not trained - need at least 10 historical data points'
            }


def generate_sample_data(num_samples: int = 20) -> WorkloadDataset:
    """Generate sample workload data for demonstration"""
    dataset = WorkloadDataset()
    
    print(f"Generating {num_samples} sample data points...")
    
    for i in range(num_samples):
        # Simulate different request types
        req_type = 'resource' if i % 2 == 0 else 'scheduling'
        
        # Simulate varying durations and success rates
        duration = 50 + (i * 5) if req_type == 'resource' else 75 + (i * 3)
        success = (i % 5) != 0  # 80% success rate
        
        data_point = WorkloadDataPoint(
            timestamp=int(time.time() * 1000) - (num_samples - i) * 1000,
            request_type=req_type,
            resource_usage={'cpu': 2 + (i % 4), 'memory': 4096 + (i * 512)},
            duration=duration,
            success=success,
            metadata={'sample_id': i}
        )
        dataset.add(data_point)
    
    print(f"✓ Generated {len(dataset)} samples")
    return dataset


def main():
    """Run the ML plugin example"""
    print("=" * 60)
    print("ML Plugin Example - Python Implementation")
    print("=" * 60)
    print()
    
    # Step 1: Create plugin
    print("Step 1: Creating custom ML plugin...")
    plugin = CustomOptimizerPlugin()
    plugin.init()
    print(f"✓ Plugin created: {plugin.metadata.name} v{plugin.metadata.version}")
    print(f"  Supported types: {plugin.metadata.supported_types}")
    print()
    
    # Step 2: Generate training data
    print("Step 2: Generating training data...")
    dataset = generate_sample_data(20)
    
    # Show statistics
    stats = dataset.get_statistics()
    print(f"\nDataset statistics:")
    print(f"  - Total requests: {stats['total_requests']}")
    print(f"  - Success rate: {stats['success_rate']:.2%}")
    print(f"  - Avg duration: {stats['avg_duration']:.1f}ms")
    print()
    
    # Step 3: Train model
    print("Step 3: Training ML model...")
    result = plugin.optimize(
        request_data={'type': 'resource'},
        historical_data=list(dataset)
    )
    
    if result['success']:
        print("✓ Model trained successfully")
        print()
    else:
        print(f"✗ Training failed: {result.get('error')}")
        sys.exit(1)
    
    # Step 4: Make predictions
    print("Step 4: Making predictions with trained model...")
    print()
    
    # Test different request types
    test_cases = [
        {'type': 'resource', 'workload_size': 100},
        {'type': 'scheduling', 'workload_size': 150},
        {'type': 'performance', 'workload_size': 200}
    ]
    
    for i, test_data in enumerate(test_cases, 1):
        print(f"Test Case {i}: {test_data}")
        result = plugin.optimize(
            request_data=test_data,
            historical_data=list(dataset)
        )
        
        if result['success']:
            pred = result['result']
            print(f"  Prediction:")
            print(f"    - Expected duration: {pred['expected_duration']:.1f}ms")
            print(f"    - Success probability: {pred['success_probability']:.2%}")
            print(f"    - Confidence: {pred['confidence']}")
            print(f"  Model confidence: {result['confidence']:.2%}")
        else:
            print(f"  Error: {result.get('error')}")
        print()
    
    # Step 5: Display plugin info
    print("Step 5: Plugin information")
    info = plugin.get_info()
    print(f"  Plugin: {info['plugin']['name']} v{info['plugin']['version']}")
    print(f"  Model ID: {info['model']['model_id']}")
    print(f"  Is trained: {info['model']['is_trained']}")
    
    if info['model']['is_trained']:
        metadata = info['model']['training_metadata']
        print(f"  Training samples: {metadata.get('training_samples', 0)}")
        print(f"  Patterns learned: {metadata.get('patterns_learned', 0)}")
    
    print()
    print("=" * 60)
    print("Example completed successfully!")
    print("=" * 60)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
