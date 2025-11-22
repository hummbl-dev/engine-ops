# ML Plugin Example

This example demonstrates how to create and use ML-driven optimization plugins with Engine-Ops.

## Overview

This example shows:
1. Setting up the engine with plugin support
2. Registering a custom ML plugin
3. Collecting workload data for training
4. Making ML-driven optimization predictions

## Running the Example

### Prerequisites

- Node.js 18+
- Python 3.9+ (for Python examples)
- Engine-Ops installed

### TypeScript Example

```bash
# Build the project
npm run build

# Run the TypeScript example
npm start examples/ml-plugin/typescript-example.ts
```

### Python Example

```bash
# Install Python SDK
cd sdks/python
pip install -e .

# Run the Python example
cd examples/ml-plugin
python python-example.py
```

## Files

- `typescript-example.ts` - TypeScript plugin example
- `python-example.py` - Python ML model example
- `custom-ml-plugin.ts` - Custom TypeScript plugin implementation
- `README.md` - This file

## What the Example Does

1. **Initializes Engine** with plugins and workload collection enabled
2. **Registers Custom Plugin** that uses ML for optimization
3. **Collects Training Data** by running sample optimizations
4. **Trains ML Model** on historical workload patterns
5. **Makes Predictions** using the trained model
6. **Displays Results** showing ML-driven recommendations

## Expected Output

```
=== ML Plugin Example ===

Step 1: Engine initialized with plugin support
Step 2: Custom ML plugin registered

Collecting training data...
Request 1: Success (duration: 50ms)
Request 2: Success (duration: 75ms)
...
Training data collected: 20 samples

Step 3: Making ML-driven prediction
Prediction result:
  - Expected duration: 62.5ms
  - Success probability: 0.95
  - Recommended resources: { cpu: 4, memory: 8192 }
  - Confidence: 0.92

Plugin info:
  - Model trained: true
  - Training samples: 20
  - Model type: simple-predictor
```

## Customization

### Adjusting Model Parameters

Edit the plugin configuration in the example:

```typescript
await registry.register(plugin, {
    enabled: true,
    priority: 10,
    config: {
        minTrainingSamples: 10,
        confidenceThreshold: 0.8
    }
});
```

### Using Different ML Algorithms

Replace the model implementation in `custom-ml-plugin.ts` with your own:

```typescript
class CustomMLModel implements IMLModel {
    // Your ML implementation
}
```

## Next Steps

1. Try the example with different data patterns
2. Implement your own ML model
3. Integrate with production workloads
4. Monitor and tune model performance

## Support

For questions or issues:
- See main documentation: `/docs/ML_PLUGIN_GUIDE.md`
- GitHub Issues: https://github.com/hummbl-dev/engine-ops/issues
