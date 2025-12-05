# ML Plugin Development Guide

This guide explains how to develop and integrate ML-driven optimization plugins with Engine-Ops.

## Overview

The Engine-Ops plugin system allows you to extend the optimization engine with custom ML models that can:

- Learn from historical workload data
- Make predictions about resource requirements
- Optimize scheduling decisions based on patterns
- Provide intelligent recommendations

## Architecture

### Components

1. **Plugin Registry** - Manages plugin lifecycle and discovery
2. **Workload Collector** - Collects and stores historical data for ML training
3. **Base Plugin Classes** - Provides interfaces for TypeScript and Python implementations
4. **ML Model Interface** - Defines contract for custom ML models

### Data Flow

```
Request → Engine → Plugin Registry → ML Plugin → ML Model → Prediction → Result
                                    ↑
                                    └── Historical Data (Workload Collector)
```

## TypeScript Plugin Development

### Creating a Plugin

```typescript
import { BaseOptimizationPlugin, PluginMetadata, WorkloadDataPoint } from './plugins';
import { OptimizationRequest, OptimizationResult } from './interfaces';

class MyCustomPlugin extends BaseOptimizationPlugin {
  public readonly metadata: PluginMetadata = {
    name: 'my-custom-plugin',
    version: '1.0.0',
    description: 'Custom ML-driven optimizer',
    author: 'Your Name',
    supportedTypes: ['ml-driven', 'resource'],
  };

  public canHandle(request: OptimizationRequest): boolean {
    return this.metadata.supportedTypes.includes(request.type);
  }

  public async optimize(
    request: OptimizationRequest,
    historicalData?: WorkloadDataPoint[],
  ): Promise<OptimizationResult> {
    this.checkInitialized();

    // Your optimization logic here
    // Use historicalData for ML predictions

    return {
      requestId: request.id,
      success: true,
      result: {
        /* your result */
      },
      metrics: {
        durationMs: Date.now() - startTime,
        score: 0.9,
      },
    };
  }
}
```

### Registering a Plugin

```typescript
import { pluginRegistry } from './plugins';

const plugin = new MyCustomPlugin();
await pluginRegistry.register(plugin, {
  enabled: true,
  priority: 10, // Higher priority plugins are chosen first
  config: {
    // Plugin-specific configuration
  },
});
```

### Using with Engine

```typescript
import { OptimizationEngine } from './core';

const engine = new OptimizationEngine({
  enablePlugins: true,
  enableWorkloadCollection: true,
});

await engine.init();

// The engine will automatically use registered plugins
const result = await engine.optimize({
  id: 'req-1',
  type: 'ml-driven',
  data: {
    /* your data */
  },
});
```

## Python Plugin Development

### Installing the SDK

```bash
pip install engine-ops
```

### Creating a Custom ML Model

```python
from engine_ops.ml import BaseMLModel, PredictionResult, WorkloadDataPoint
from typing import Dict, Any, List

class MyMLModel(BaseMLModel):
    def __init__(self, model_id: str = "my-model"):
        super().__init__(model_id)
        # Initialize your model
        self.model = None

    def train(self, data: List[WorkloadDataPoint]) -> None:
        """Train your model with historical data"""
        if not self.validate_training_data(data):
            raise ValueError("Insufficient training data")

        # Extract features and labels
        features, labels = self.preprocess_data(data)

        # Train your model
        # self.model.fit(features, labels)

        self.is_trained = True
        self.training_metadata = {
            'training_samples': len(data),
            'model_type': 'custom'
        }

    def predict(self, input_data: Dict[str, Any]) -> PredictionResult:
        """Make predictions"""
        if not self.is_trained:
            raise RuntimeError("Model not trained")

        # Make prediction using your model
        prediction = {
            'expected_duration': 100.0,
            'recommended_resources': {'cpu': 4, 'memory': 8192},
            'confidence': 0.85
        }

        return PredictionResult(
            prediction=prediction,
            confidence=0.85,
            model_id=self.model_id,
            metadata={'some_info': 'value'}
        )
```

### Creating a Plugin

```python
from engine_ops.ml import MLPluginInterface, PluginMetadata
from typing import Dict, Any, List, Optional

class MyPlugin(MLPluginInterface):
    def __init__(self):
        metadata = PluginMetadata(
            name="my-plugin",
            version="1.0.0",
            description="My custom ML optimizer",
            author="Your Name",
            supported_types=["ml-driven", "resource"]
        )
        model = MyMLModel()
        super().__init__(metadata, model)

    def optimize(
        self,
        request_data: Dict[str, Any],
        historical_data: Optional[List[WorkloadDataPoint]] = None
    ) -> Dict[str, Any]:
        """Execute optimization"""
        # Train if needed
        if historical_data and len(historical_data) >= 10:
            if not self.model.is_trained:
                self.train_model(historical_data)

        # Make prediction
        if self.model.is_trained:
            result = self.predict(request_data)
            return {
                'success': True,
                'result': result.prediction,
                'confidence': result.confidence,
                'model_id': result.model_id
            }
        else:
            return {
                'success': False,
                'error': 'Model not trained'
            }
```

### Using with API Client

```python
from engine_ops import EngineOpsClient, OptimizationRequest

# Create client
client = EngineOpsClient(base_url="http://localhost:3000")

# Submit ML-driven optimization request
request = OptimizationRequest(
    id="req-1",
    type="ml-driven",
    data={
        "workload_size": 100,
        "priority": "high"
    }
)

result = client.optimize(request)
print(result.result)
```

## Using Example Models

The SDK includes example models you can use or extend:

### Simple Predictor

```python
from engine_ops.ml.examples import SimplePredictorPlugin, SimplePredictorModel

# Create and use the plugin
plugin = SimplePredictorPlugin()
plugin.init()

result = plugin.optimize(
    request_data={'workload_size': 100},
    historical_data=historical_workload_data
)
```

### Resource Optimizer

```python
from engine_ops.ml.examples import ResourceOptimizerPlugin

plugin = ResourceOptimizerPlugin()
plugin.init()

result = plugin.optimize(
    request_data={
        'type': 'resource',
        'workload_size': 200
    },
    historical_data=historical_data
)
```

## Working with Historical Data

### Collecting Data

The engine automatically collects workload data when enabled:

```typescript
const engine = new OptimizationEngine({
  enableWorkloadCollection: true,
});
```

### Accessing via API

```bash
# Get workload statistics
curl http://localhost:3000/api/v1/plugins/workload-data/stats

# Export training data
curl http://localhost:3000/api/v1/plugins/workload-data/export?type=resource

# Get data in ML training format
curl http://localhost:3000/api/v1/plugins/workload-data/training-format
```

### Using in Python

```python
from engine_ops import EngineOpsClient

client = EngineOpsClient()

# Get workload data
response = client.session.get(
    f"{client.base_url}/api/v1/plugins/workload-data/export"
)
workload_data = response.json()

# Use with your model
from engine_ops.ml import WorkloadDataPoint
data_points = [
    WorkloadDataPoint.from_dict(d)
    for d in workload_data['data']
]
```

## Plugin Management API

### List Plugins

```bash
GET /api/v1/plugins
```

Response:

```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "version": "1.0.0",
      "description": "Custom plugin",
      "supportedTypes": ["ml-driven"],
      "config": {
        "enabled": true,
        "priority": 10
      }
    }
  ],
  "count": 1
}
```

### Get Plugin Details

```bash
GET /api/v1/plugins/:name
```

### Enable/Disable Plugin

```bash
POST /api/v1/plugins/:name/enable
POST /api/v1/plugins/:name/disable
```

## Best Practices

### Training Data

1. **Minimum Samples**: Ensure at least 10 data points before training
2. **Data Quality**: Validate and clean data before training
3. **Feature Engineering**: Extract meaningful features from workload data
4. **Periodic Retraining**: Update models as new data arrives

### Model Selection

1. **Start Simple**: Begin with statistical models before complex ML
2. **Validate Performance**: Test predictions against actual outcomes
3. **Monitor Metrics**: Track confidence scores and accuracy
4. **Fallback Strategy**: Have a default behavior when model isn't trained

### Production Deployment

1. **Error Handling**: Gracefully handle prediction failures
2. **Logging**: Log training events and prediction metrics
3. **Performance**: Optimize model inference for low latency
4. **Versioning**: Version your models for reproducibility

## Integration Examples

### With scikit-learn

```python
from sklearn.ensemble import RandomForestRegressor
from engine_ops.ml import BaseMLModel

class SkLearnModel(BaseMLModel):
    def __init__(self):
        super().__init__("sklearn-rf")
        self.model = RandomForestRegressor()

    def train(self, data):
        features, labels = self.preprocess_data(data)
        self.model.fit(features, labels)
        self.is_trained = True
```

### With TensorFlow

```python
import tensorflow as tf
from engine_ops.ml import BaseMLModel

class TFModel(BaseMLModel):
    def __init__(self):
        super().__init__("tensorflow-model")
        self.model = tf.keras.Sequential([...])

    def train(self, data):
        features, labels = self.preprocess_data(data)
        # Convert to tensors and train
        self.model.fit(features, labels)
        self.is_trained = True
```

## Troubleshooting

### Plugin Not Found

- Verify plugin is registered: `GET /api/v1/plugins`
- Check plugin is enabled in config
- Ensure `enablePlugins: true` in engine config

### Model Not Training

- Check minimum data points (need at least 10)
- Verify workload collection is enabled
- Review data quality and format
- Check error logs for validation failures

### Low Prediction Accuracy

- Increase training data size
- Improve feature engineering
- Try different ML algorithms
- Add more relevant features

## Support

For issues and questions:

- GitHub Issues: https://github.com/hummbl-dev/engine-ops/issues
- Email: hummbldev@gmail.com
