"""
Engine-Ops Python Client
"""

import requests
from typing import Dict, Any, Optional
from .models import OptimizationRequest, OptimizationResult


class EngineOpsClient:
    """Client for Engine-Ops optimization platform"""
    
    def __init__(self, base_url: str = "http://localhost:3000", timeout: int = 30):
        """
        Initialize Engine-Ops client
        
        Args:
            base_url: Base URL of the Engine-Ops API
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.session = requests.Session()
    
    def optimize(self, request: OptimizationRequest) -> OptimizationResult:
        """
        Submit an optimization request
        
        Args:
            request: Optimization request object
            
        Returns:
            OptimizationResult object
            
        Raises:
            requests.HTTPError: If the request fails
        """
        url = f"{self.base_url}/api/v1/optimize"
        response = self.session.post(
            url,
            json=request.dict(),
            timeout=self.timeout
        )
        response.raise_for_status()
        return OptimizationResult(**response.json())
    
    def health(self) -> Dict[str, Any]:
        """
        Check API health status
        
        Returns:
            Health status dictionary
        """
        url = f"{self.base_url}/api/v1/health"
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    def metrics(self) -> Dict[str, Any]:
        """
        Get performance metrics
        
        Returns:
            Metrics dictionary
        """
        url = f"{self.base_url}/api/v1/metrics"
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    def cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics
        
        Returns:
            Cache stats dictionary
        """
        url = f"{self.base_url}/api/v1/cache/stats"
        response = self.session.get(url, timeout=self.timeout)
        response.raise_for_status()
        return response.json()
    
    def close(self):
        """Close the HTTP session"""
        self.session.close()
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
