package engineops

// OptimizationRequest represents an optimization request
type OptimizationRequest struct {
	ID   string                 `json:"id"`
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}

// OptimizationMetrics represents optimization metrics
type OptimizationMetrics struct {
	DurationMs int     `json:"durationMs"`
	Score      float64 `json:"score"`
}

// OptimizationResult represents an optimization result
type OptimizationResult struct {
	RequestID string                 `json:"requestId"`
	Success   bool                   `json:"success"`
	Result    map[string]interface{} `json:"result,omitempty"`
	Error     string                 `json:"error,omitempty"`
	Metrics   OptimizationMetrics    `json:"metrics"`
}
