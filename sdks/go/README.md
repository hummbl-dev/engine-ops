# Engine-Ops Go SDK

Go client library for the Engine-Ops optimization platform.

## Installation

```bash
go get github.com/hummbl-dev/engine-ops/sdks/go
```

## Quick Start

```go
package main

import (
    "fmt"
    "log"
    
    engineops "github.com/hummbl-dev/engine-ops/sdks/go"
)

func main() {
    // Create client
    client := engineops.NewClient("http://localhost:3000")
    
    // Submit optimization request
    req := &engineops.OptimizationRequest{
        ID:   "my-request-1",
        Type: "resource",
        Data: map[string]interface{}{
            "items": []map[string]interface{}{
                {"id": "item-1", "cpu": 50, "memory": 500},
                {"id": "item-2", "cpu": 30, "memory": 300},
            },
            "nodeCapacity": map[string]interface{}{
                "cpu":    100,
                "memory": 1000,
            },
        },
    }
    
    result, err := client.Optimize(req)
    if err != nil {
        log.Fatal(err)
    }
    
    fmt.Printf("Success: %v\n", result.Success)
    fmt.Printf("Result: %v\n", result.Result)
}
```

## API Methods

### `Optimize(req *OptimizationRequest) (*OptimizationResult, error)`
Submit an optimization request.

### `Health() (map[string]interface{}, error)`
Check API health status.

### `Metrics() (map[string]interface{}, error)`
Get performance metrics.

### `CacheStats() (map[string]interface{}, error)`
Get cache statistics.

## License

Apache License 2.0
