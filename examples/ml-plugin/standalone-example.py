#!/usr/bin/env python3
"""
Standalone ML Plugin Example (No Dependencies Required)

This example demonstrates the ML plugin concepts without requiring
external dependencies. It shows the core interfaces and patterns.
"""

import time
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional
from abc import ABC, abstractmethod


# === Data Structures ===

@dataclass
class WorkloadDataPoint:
    """Historical workload data point"""
    timestamp: int
    request_type: str
    resource_usage: Dict[str, float]
    duration: float
    success: bool
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)


@dataclass
class PredictionResult:
    """Result of a model prediction"""
    prediction: Dict[str, Any]
    confidence: float
    model_id: str
    metadata: Optional[Dict[str, Any]] = None


# === Base Classes ===

class BaseMLModel(ABC):
    """Base class for ML models"""
    
    def __init__(self, model_id: str):
        self.model_id = model_id
        self.is_trained = False
        self.training_metadata: Dict[str, Any] = {}
    
    @abstractmethod
    def train(self, data: List[WorkloadDataPoint]) -> None:
        """Train the model with historical workload data"""
        pass
    
    @abstractmethod
    def predict(self, input_data: Dict[str, Any]) -> PredictionResult:
        """Make a prediction based on input data"""
        pass
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get model metadata"""
        return {
            'model_id': self.model_id,
            'is_trained': self.is_trained,
            'training_metadata': self.training_metadata
        }


# === Custom Model Implementation ===

class SimplePredictor(BaseMLModel):
    """Simple statistical predictor model"""
    
    def __init__(self):
        super().__init__("simple-predictor")
        self.patterns = {}
    
    def train(self, data: List[WorkloadDataPoint]) -> None:
        """Train on historical workload data"""
        print(f"Training model with {len(data)} samples...")
        
        if len(data) < 10:
            raise ValueError("Need at least 10 samples for training")
        
        # Group by request type
        type_groups: Dict[str, List[WorkloadDataPoint]] = {}
        for dp in data:
            if dp.request_type not in type_groups:
                type_groups[dp.request_type] = []
            type_groups[dp.request_type].append(dp)
        
        # Learn patterns for each type
        for req_type, points in type_groups.items():
            successful = [p for p in points if p.success]
            if successful:
                avg_duration = sum(p.duration for p in successful) / len(successful)
                success_rate = len(successful) / len(points)
                
                # Calculate average resource usage
                avg_resources = {}
                all_keys = set()
                for p in successful:
                    all_keys.update(p.resource_usage.keys())
                
                for key in all_keys:
                    values = [p.resource_usage.get(key, 0) for p in successful]
                    avg_resources[key] = sum(values) / len(values)
                
                self.patterns[req_type] = {
                    'avg_duration': avg_duration,
                    'success_rate': success_rate,
                    'avg_resources': avg_resources,
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
                'recommended_resources': pattern['avg_resources'],
                'confidence_level': 'high'
            }
            confidence = pattern['success_rate']
        else:
            # Fallback for unknown types
            all_durations = [p['avg_duration'] for p in self.patterns.values()]
            avg_duration = sum(all_durations) / len(all_durations) if all_durations else 100.0
            
            prediction = {
                'expected_duration': avg_duration,
                'success_probability': 0.5,
                'recommended_resources': {},
                'confidence_level': 'low'
            }
            confidence = 0.5
        
        return PredictionResult(
            prediction=prediction,
            confidence=confidence,
            model_id=self.model_id,
            metadata={'pattern_available': pattern is not None}
        )


# === Helper Functions ===

def generate_sample_data(num_samples: int = 20) -> List[WorkloadDataPoint]:
    """Generate sample workload data for demonstration"""
    print(f"Generating {num_samples} sample data points...")
    
    data = []
    base_time = int(time.time() * 1000)
    
    for i in range(num_samples):
        # Alternate between resource and scheduling types
        req_type = 'resource' if i % 2 == 0 else 'scheduling'
        
        # Simulate varying characteristics
        if req_type == 'resource':
            duration = 50 + (i * 2)
            cpu = 2 + (i % 4)
            memory = 4096 + (i * 256)
        else:
            duration = 75 + (i * 3)
            cpu = 1 + (i % 3)
            memory = 2048 + (i * 512)
        
        # 80% success rate
        success = (i % 5) != 0
        
        data_point = WorkloadDataPoint(
            timestamp=base_time - (num_samples - i) * 1000,
            request_type=req_type,
            resource_usage={'cpu': cpu, 'memory': memory},
            duration=duration,
            success=success,
            metadata={'sample_id': i}
        )
        data.append(data_point)
    
    print(f"✓ Generated {len(data)} samples")
    return data


def calculate_statistics(data: List[WorkloadDataPoint]) -> Dict[str, Any]:
    """Calculate dataset statistics"""
    if not data:
        return {'total_requests': 0, 'success_rate': 0.0, 'avg_duration': 0.0}
    
    total = len(data)
    success_count = sum(1 for d in data if d.success)
    total_duration = sum(d.duration for d in data)
    
    return {
        'total_requests': total,
        'success_rate': success_count / total,
        'avg_duration': total_duration / total
    }


# === Main Example ===

def main():
    """Run the standalone ML plugin example"""
    print("=" * 60)
    print("ML Plugin Standalone Example")
    print("=" * 60)
    print()
    
    # Step 1: Create model
    print("Step 1: Creating ML model...")
    model = SimplePredictor()
    print(f"✓ Model created: {model.model_id}")
    print()
    
    # Step 2: Generate training data
    print("Step 2: Generating training data...")
    training_data = generate_sample_data(20)
    
    # Show statistics
    stats = calculate_statistics(training_data)
    print(f"\nDataset statistics:")
    print(f"  - Total requests: {stats['total_requests']}")
    print(f"  - Success rate: {stats['success_rate']:.2%}")
    print(f"  - Avg duration: {stats['avg_duration']:.1f}ms")
    print()
    
    # Step 3: Train model
    print("Step 3: Training model...")
    try:
        model.train(training_data)
        print("✓ Training completed")
    except Exception as e:
        print(f"✗ Training failed: {e}")
        return
    print()
    
    # Step 4: Make predictions
    print("Step 4: Making predictions with trained model...")
    print()
    
    test_cases = [
        {'type': 'resource', 'description': 'Resource allocation request'},
        {'type': 'scheduling', 'description': 'Task scheduling request'},
        {'type': 'unknown', 'description': 'Unknown type (fallback)'}
    ]
    
    for i, test_data in enumerate(test_cases, 1):
        print(f"Test Case {i}: {test_data['description']}")
        print(f"  Input: type={test_data['type']}")
        
        try:
            result = model.predict(test_data)
            pred = result.prediction
            
            print(f"  Prediction:")
            print(f"    - Expected duration: {pred['expected_duration']:.1f}ms")
            print(f"    - Success probability: {pred['success_probability']:.2%}")
            
            if pred.get('recommended_resources'):
                resources = pred['recommended_resources']
                print(f"    - Recommended CPU: {resources.get('cpu', 0):.1f}")
                print(f"    - Recommended Memory: {resources.get('memory', 0):.0f} MB")
            
            print(f"    - Confidence level: {pred['confidence_level']}")
            print(f"  Model confidence: {result.confidence:.2%}")
        except Exception as e:
            print(f"  ✗ Prediction failed: {e}")
        print()
    
    # Step 5: Display model info
    print("Step 5: Model information")
    metadata = model.get_metadata()
    print(f"  Model ID: {metadata['model_id']}")
    print(f"  Is trained: {metadata['is_trained']}")
    
    if metadata['is_trained']:
        training_info = metadata['training_metadata']
        print(f"  Training samples: {training_info.get('training_samples', 0)}")
        print(f"  Patterns learned: {training_info.get('patterns_learned', 0)}")
        print(f"  Request types: {', '.join(training_info.get('request_types', []))}")
    
    print()
    print("=" * 60)
    print("Example completed successfully!")
    print("=" * 60)
    print()
    print("Next Steps:")
    print("  1. Install engine_ops package: pip install engine-ops")
    print("  2. Run the full example: python python-example.py")
    print("  3. Integrate with Engine-Ops API")
    print("  4. Explore advanced ML models (scikit-learn, TensorFlow, etc.)")


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
