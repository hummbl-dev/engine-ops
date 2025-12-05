# Engine-Ops Python SDK

Python client library for the Engine-Ops optimization platform.

## Installation

```bash
pip install engine-ops
```

## Quick Start

```python
from engine_ops import EngineOpsClient, OptimizationRequest

# Create client
client = EngineOpsClient(base_url="http://localhost:3000")

# Submit optimization request
request = OptimizationRequest(
    id="my-request-1",
    type="resource",
    data={
        "items": [
            {"id": "item-1", "cpu": 50, "memory": 500},
            {"id": "item-2", "cpu": 30, "memory": 300}
        ],
        "nodeCapacity": {"cpu": 100, "memory": 1000}
    }
)

result = client.optimize(request)
print(f"Success: {result.success}")
print(f"Result: {result.result}")
```

## Context Manager

```python
with EngineOpsClient() as client:
    result = client.optimize(request)
    print(result)
```

## API Methods

### `optimize(request: OptimizationRequest) -> OptimizationResult`

Submit an optimization request.

### `health() -> Dict[str, Any]`

Check API health status.

### `metrics() -> Dict[str, Any]`

Get performance metrics.

### `cache_stats() -> Dict[str, Any]`

Get cache statistics.

## License

Apache License 2.0
