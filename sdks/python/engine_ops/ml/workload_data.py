"""
Workload data structures for ML training
"""

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
import json


@dataclass
class WorkloadDataPoint:
    """Historical workload data point"""
    timestamp: int
    request_type: str
    resource_usage: Dict[str, float]
    duration: float
    success: bool
    metadata: Optional[Dict[str, Any]] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            'timestamp': self.timestamp,
            'requestType': self.request_type,
            'resourceUsage': self.resource_usage,
            'duration': self.duration,
            'success': self.success,
            'metadata': self.metadata or {}
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'WorkloadDataPoint':
        """Create from dictionary"""
        return cls(
            timestamp=data['timestamp'],
            request_type=data.get('requestType', data.get('request_type', '')),
            resource_usage=data.get('resourceUsage', data.get('resource_usage', {})),
            duration=data['duration'],
            success=data['success'],
            metadata=data.get('metadata')
        )


class WorkloadDataset:
    """Collection of workload data points with utilities"""

    def __init__(self, data_points: Optional[List[WorkloadDataPoint]] = None):
        self.data_points = data_points or []

    def add(self, data_point: WorkloadDataPoint) -> None:
        """Add a data point"""
        self.data_points.append(data_point)

    def filter_by_type(self, request_type: str) -> 'WorkloadDataset':
        """Filter by request type"""
        filtered = [dp for dp in self.data_points if dp.request_type == request_type]
        return WorkloadDataset(filtered)

    def filter_by_time_range(self, start_time: int, end_time: int) -> 'WorkloadDataset':
        """Filter by time range"""
        filtered = [
            dp for dp in self.data_points 
            if start_time <= dp.timestamp <= end_time
        ]
        return WorkloadDataset(filtered)

    def get_recent(self, count: int) -> 'WorkloadDataset':
        """Get most recent data points"""
        return WorkloadDataset(self.data_points[-count:])

    def to_features_labels(self) -> tuple:
        """
        Convert to ML features and labels
        Returns: (features, labels) where features is List[List[float]] and labels is List[int]
        """
        features = []
        labels = []
        
        for dp in self.data_points:
            # Create feature vector
            feature_vector = [
                float(dp.timestamp),
                float(dp.duration),
            ]
            
            # Add resource usage features
            for key in sorted(dp.resource_usage.keys()):
                feature_vector.append(float(dp.resource_usage[key]))
            
            features.append(feature_vector)
            labels.append(1 if dp.success else 0)
        
        return features, labels

    def get_statistics(self) -> Dict[str, Any]:
        """Get dataset statistics"""
        if not self.data_points:
            return {
                'total_requests': 0,
                'success_rate': 0.0,
                'avg_duration': 0.0,
                'by_type': {}
            }

        total = len(self.data_points)
        success_count = sum(1 for dp in self.data_points if dp.success)
        total_duration = sum(dp.duration for dp in self.data_points)

        # Stats by type
        by_type: Dict[str, Dict[str, Any]] = {}
        for dp in self.data_points:
            if dp.request_type not in by_type:
                by_type[dp.request_type] = {
                    'count': 0,
                    'success_count': 0,
                    'total_duration': 0.0
                }
            by_type[dp.request_type]['count'] += 1
            if dp.success:
                by_type[dp.request_type]['success_count'] += 1
            by_type[dp.request_type]['total_duration'] += dp.duration

        # Calculate rates and averages
        for stats in by_type.values():
            stats['success_rate'] = stats['success_count'] / stats['count']
            stats['avg_duration'] = stats['total_duration'] / stats['count']
            del stats['success_count']
            del stats['total_duration']

        return {
            'total_requests': total,
            'success_rate': success_count / total,
            'avg_duration': total_duration / total,
            'by_type': by_type
        }

    def save(self, filepath: str) -> None:
        """Save dataset to JSON file"""
        data = [dp.to_dict() for dp in self.data_points]
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> 'WorkloadDataset':
        """Load dataset from JSON file"""
        with open(filepath, 'r') as f:
            data = json.load(f)
        data_points = [WorkloadDataPoint.from_dict(d) for d in data]
        return cls(data_points)

    def __len__(self) -> int:
        return len(self.data_points)

    def __iter__(self):
        return iter(self.data_points)
