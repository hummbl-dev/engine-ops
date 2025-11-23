"""
Dimensional-Transformational (D-T) Framework
The Cognitive Reasoning Engine for Sovereign Intelligence

This module provides the core mental model transformation logic.
"""

import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import json
import logging

# Import constraints module
try:
    from .constraints import ConstraintRegistry, TransformationLogic, CouplingRegistry
except ImportError:
    from constraints import ConstraintRegistry, TransformationLogic, CouplingRegistry


class MentalModel:
    """
    A mental model represented as a 6-dimensional state vector.
    
    Dimensions:
        - structural: Form & Composition (granularity, modularity)
        - relational: Interactions & Connectivity (topology, causal chains)
        - temporal: Time & Dynamics (horizons, stability, cycles)
        - epistemic: Knowledge & Uncertainty (visibility, confidence)
        - agency: Control & Intent (active vs passive, individual vs collective)
        - value_oriented: Outcomes & Leverage (efficiency, resilience)
    
    Transformations:
        - Accretion: Additive build-up
        - Pruning: Subtractive refinement
        - Reconfiguration: Structural rearrangement
        - Fusion: Integrative merging
        - Bifurcation: Divergent branching
        - Iteration: Cyclic refinement
        - Phase Shift: Threshold transformation
        - Transmutation: Fundamental conversion
    """
    
    VALID_DIMENSIONS = [
        'structural', 'relational', 'temporal', 
        'epistemic', 'agency', 'value_oriented'
    ]
    
    VALID_TRANSFORMATIONS = [
        'Accretion', 'Pruning', 'Reconfiguration', 'Fusion',
        'Bifurcation', 'Iteration', 'Phase Shift', 'Transmutation'
    ]
    
    def __init__(self, name: str, initial_dimensions: Optional[Dict[str, float]] = None):
        """
        Initialize a mental model with normalized dimensions (0.0 to 1.0).
        
        Args:
            name: Identifier for this mental model
            initial_dimensions: Optional initial state (defaults to 0.5 for all)
        """
        self.name = name
        self.dimensions = initial_dimensions or {
            'structural': 0.5,
            'relational': 0.5,
            'temporal': 0.5,
            'epistemic': 0.5,
            'agency': 0.5,
            'value_oriented': 0.5
        }
        self.history: List[Dict] = []
        self._log_state("Initialization")
    
    def _log_state(self, action: str):
        """Log current state to history."""
        timestamp = datetime.now().isoformat()
        snapshot = self.dimensions.copy()
        self.history.append({
            'time': timestamp,
            'action': action,
            'state': snapshot
        })
    
    def _validate_inputs(self, transformation: str, target_dimension: str):
        """Validate transformation and dimension parameters."""
        if transformation not in self.VALID_TRANSFORMATIONS:
            raise ValueError(f"Invalid transformation: {transformation}")
        if target_dimension not in self.VALID_DIMENSIONS:
            raise ValueError(f"Invalid dimension: {target_dimension}")
    
    def _check_constraints(self, transformation: str, target_dimension: str) -> Optional[str]:
        """
        Check dependency constraints before applying transformation.
        
        Returns warning message if constraint violated, None if safe.
        """
        # Constraint: High Agency requires moderate Structural stability
        if target_dimension == 'agency' and transformation == 'Accretion':
            if self.dimensions['structural'] < 0.4:
                return "Warning: Increasing Agency without Structural foundation may cause instability"
        
        # Constraint: Temporal planning requires Epistemic clarity
        if target_dimension == 'temporal' and transformation == 'Accretion':
            if self.dimensions['epistemic'] < 0.3:
                return "Warning: Extending time horizon with low epistemic clarity increases risk"
        
        # Constraint: Transmutation resets dependencies
        if transformation == 'Transmutation':
            return f"Warning: Transmutation of {target_dimension} will disrupt related dimensions"
        
        return None
    
    def _propagate_ripple(self, source_dim: str, delta: float, depth: int = 0):
        """
        Recursively apply side effects (ripples) when a dimension changes.
        
        Args:
            source_dim: The dimension that changed
            delta: How much it changed (can be positive or negative)
            depth: Recursion depth (prevent infinite loops)
        """
        # Prevent infinite recursion
        if depth > 3:
            return
        
        ripple_targets = CouplingRegistry.get_ripple_targets(source_dim)
        
        if not ripple_targets:
            return
        
        for target_dim, factor in ripple_targets:
            # Calculate side effect magnitude
            # If Source changed by +0.1 and factor is -0.4, Target changes by -0.04
            ripple_delta = delta * factor
            
            # Apply the ripple (clamping between 0.0 and 1.0)
            old_val = self.dimensions[target_dim]
            new_val = max(0.0, min(1.0, old_val + ripple_delta))
            
            # Only apply and log significant ripples
            if abs(new_val - old_val) > 0.001:
                self.dimensions[target_dim] = round(new_val, 3)
                
                direction = "⬆" if ripple_delta > 0 else "⬇"
                coupling_type = "Synergistic" if factor > 0 else "Antagonistic"
                
                logging.info(
                    f"   ↳ RIPPLE ({coupling_type}): {source_dim} → {target_dim} {direction} "
                    f"({old_val:.3f} → {new_val:.3f}, Δ{ripple_delta:+.3f})"
                )
                
                # Recursively propagate (with depth limit)
                self._propagate_ripple(target_dim, ripple_delta, depth + 1)
    
    def apply(self, transformation: str, target_dimension: str, 
              intensity: float = 0.1) -> Tuple[Dict[str, float], Optional[str], float]:
        """
        Apply a Transformation Operator to a specific Dimension with friction calculation.
        
        Args:
            transformation: One of the 8 valid transformations
            target_dimension: One of the 6 valid dimensions
            intensity: Magnitude of change (0.0 to 1.0)
        
        Returns:
            Tuple of (updated dimensions dict, optional warning message, friction coefficient)
        """
        self._validate_inputs(transformation, target_dimension)
        
        current_val = self.dimensions[target_dimension]
        
        # 1. Calculate Friction based on unmet dependencies
        friction, warnings = ConstraintRegistry.check_friction(
            target_dimension, 
            self.dimensions
        )
        
        # 2. Log warnings if dependencies not met
        warning_msg = None
        if warnings:
            warning_msg = " | ".join(warnings)
            for warn in warnings:
                logging.warning(warn)
        
        # 3. Apply Logic (Net Intensity = Input Intensity - Friction)
        net_intensity = intensity * (1.0 - friction)
        
        # 4. If friction too high, transformation stalls
        if net_intensity < 0.01:
            logging.error(f"Transformation Stalled. Friction on {target_dimension} = {friction:.2%}")
            return self.dimensions, "TRANSFORMATION STALLED: Friction too high", friction
        
        # 5. Get transformation effect description
        effect_desc = TransformationLogic.get_description(target_dimension, transformation)
        logging.info(f"Applying: {transformation} → {target_dimension}")
        logging.info(f"Effect: {effect_desc}")
        
        # === THE LOGIC MATRIX (Updated with Friction) ===
        
        if transformation == 'Accretion':
            # Additive build-up
            new_val = min(1.0, current_val + net_intensity)
            
        elif transformation == 'Pruning':
            # Subtractive refinement
            new_val = max(0.0, current_val - net_intensity)
            
        elif transformation == 'Reconfiguration':
            # Structural rearrangement (isomorphic)
            # Value stays same, but context changes
            new_val = current_val
            
        elif transformation == 'Fusion':
            # Integrative merging
            new_val = min(1.0, current_val + (net_intensity * 0.5))
            
        elif transformation == 'Bifurcation':
            # Divergent branching
            if target_dimension == 'epistemic':
                # Bifurcation increases uncertainty in epistemic
                new_val = max(0.0, current_val - (net_intensity * 0.3))
            else:
                new_val = current_val + (net_intensity * 0.2)
                
        elif transformation == 'Iteration':
            # Cyclic refinement
            new_val = min(1.0, current_val + (net_intensity * 0.7))
            
        elif transformation == 'Phase Shift':
            # Non-linear threshold jump
            threshold = 0.7
            if current_val > threshold:
                new_val = 1.0  # State change complete
                logging.info("Phase shift threshold crossed - state change complete!")
            else:
                new_val = current_val + (net_intensity * 0.1)
                logging.info(f"Phase shift resisted - below threshold ({current_val:.2f} < {threshold})")
                
        elif transformation == 'Transmutation':
            # Fundamental ontology shift (reset for new paradigm)
            new_val = 0.2
            logging.info("Transmutation: Dimension reset for new ontology")
            
        else:
            # Fallback
            new_val = current_val
        
        # 6. Update State
        old_val = self.dimensions[target_dimension]
        self.dimensions[target_dimension] = round(new_val, 3)
        
        # Calculate actual delta
        actual_delta = new_val - old_val
        
        # 7. Log the primary change
        logging.info(
            f"Result: {target_dimension} {old_val:.3f} → {new_val:.3f} "
            f"(Δ{actual_delta:+.3f}) | Friction: {friction:.2%} | "
            f"Net Intensity: {net_intensity:.3f}"
        )
        
        self._log_state(f"{transformation} on {target_dimension}")
        
        # 8. Propagate ripple effects (coupling)
        if abs(actual_delta) > 0.001:
            self._propagate_ripple(target_dimension, actual_delta)
        
        return self.dimensions, warning_msg, friction
    
    def get_state_vector(self) -> np.ndarray:
        """Return current state as numpy array for mathematical operations."""
        return np.array([
            self.dimensions['structural'],
            self.dimensions['relational'],
            self.dimensions['temporal'],
            self.dimensions['epistemic'],
            self.dimensions['agency'],
            self.dimensions['value_oriented']
        ])
    
    def export_history(self, filepath: str):
        """Export transformation history to JSON file."""
        with open(filepath, 'w') as f:
            json.dump({
                'name': self.name,
                'history': self.history
            }, f, indent=2)
    
    def __repr__(self):
        return f"<MentalModel: {self.name} | State: {self.dimensions}>"
    
    def __str__(self):
        lines = [f"Mental Model: {self.name}"]
        lines.append("=" * 40)
        for dim, val in self.dimensions.items():
            bar = "█" * int(val * 20)
            lines.append(f"{dim:15} | {bar:20} {val:.3f}")
        return "\n".join(lines)


# === USAGE EXAMPLE ===
if __name__ == "__main__":
    # Example: Evolving a startup strategy
    project = MentalModel("Startup Strategy")
    
    print("Initial State:")
    print(project)
    print()
    
    # Phase 1: Research (Accretion on Epistemic)
    project.apply("Accretion", "epistemic", 0.3)
    print("After market research:")
    print(project)
    print()
    
    # Phase 2: Simplification (Pruning on Structural)
    project.apply("Pruning", "structural", 0.2)
    print("After removing unnecessary features:")
    print(project)
    print()
    
    # Phase 3: Scaling attempt (Phase Shift on Value-Oriented)
    dims, warning = project.apply("Phase Shift", "value_oriented", 0.1)
    if warning:
        print(f"⚠️ {warning}")
    print("After attempting to scale:")
    print(project)
