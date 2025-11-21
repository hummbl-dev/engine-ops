"""
Engine-Ops Python SDK Models
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, Literal


class OptimizationRequest(BaseModel):
    """Optimization request model"""
    id: str = Field(..., description="Unique request ID")
    type: Literal["resource", "scheduling", "performance", "genetic", "simulated-annealing"]
    data: Dict[str, Any] = Field(..., description="Request data")


class OptimizationMetrics(BaseModel):
    """Optimization metrics"""
    durationMs: int
    score: float


class OptimizationResult(BaseModel):
    """Optimization result model"""
    requestId: str
    success: bool
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metrics: OptimizationMetrics


class EngineConfig(BaseModel):
    """Engine configuration"""
    maxConcurrentTasks: int = 5
    timeoutMs: int = 30000
    verbose: bool = False
