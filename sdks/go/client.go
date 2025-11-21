// Package engineops provides a Go client for the Engine-Ops optimization platform
package engineops

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client is the Engine-Ops API client
type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewClient creates a new Engine-Ops client
func NewClient(baseURL string) *Client {
	return &Client{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Optimize submits an optimization request
func (c *Client) Optimize(req *OptimizationRequest) (*OptimizationResult, error) {
	url := fmt.Sprintf("%s/api/v1/optimize", c.BaseURL)
	
	body, err := json.Marshal(req)
	if (err != nil) {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}
	
	httpReq, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	
	resp, err := c.HTTPClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}
	
	var result OptimizationResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return &result, nil
}

// Health checks the API health status
func (c *Client) Health() (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/health", c.BaseURL)
	
	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return result, nil
}

// Metrics gets performance metrics
func (c *Client) Metrics() (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/metrics", c.BaseURL)
	
	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return result, nil
}

// CacheStats gets cache statistics
func (c *Client) CacheStats() (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/api/v1/cache/stats", c.BaseURL)
	
	resp, err := c.HTTPClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()
	
	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	
	return result, nil
}
