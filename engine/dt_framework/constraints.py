"""
D-T Framework: Advanced Dependency Engine
Implements constraint checking and friction calculation for interdependent dimensions.
"""

import logging
from typing import Dict, List, Tuple, Optional

# Configure logging to track the model's internal reasoning
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s: %(message)s'
)


class ConstraintRegistry:
    """
    Defines the 'Physics' of the D-T Framework.
    
    These constraints represent fundamental dependencies between dimensions.
    Format: {Target_Dim: [(Prerequisite_Dim, Min_Score, Error_Message)]}
    """
    
    DEPENDENCIES = {
        # You cannot have high Agency (Control) if the Structure is chaotic
        'agency': [
            ('structural', 0.4, "Structure too chaotic for high agency."),
            ('epistemic', 0.3, "Cannot control what you do not understand.")
        ],
        
        # You cannot have high Value (ROI) if you don't know what's happening
        'value_oriented': [
            ('epistemic', 0.5, "Blind optimization is dangerous. Increase Knowledge first.")
        ],
        
        # You cannot execute complex Temporal cycles without connections
        'temporal': [
            ('relational', 0.4, "Cannot synchronize disconnected parts.")
        ],
        
        # High Structural integrity requires knowing what you are building
        'structural': [
            ('epistemic', 0.2, "Cannot build structure on zero knowledge.")
        ]
        
        # Relational has no hard prerequisites (you can always start connecting)
        # Epistemic has no prerequisites (you can always start learning)
    }
    
    @staticmethod
    def check_friction(target_dim: str, current_state: Dict[str, float]) -> Tuple[float, List[str]]:
        """
        Calculates 'Friction' (Resistance) based on unmet dependencies.
        
        Friction represents the systemic resistance to change when prerequisites
        are not satisfied. Think of it as trying to build a skyscraper on quicksand.
        
        Args:
            target_dim: The dimension being modified
            current_state: Current values of all dimensions
            
        Returns:
            Tuple of (friction_coefficient 0.0-1.0, list of warning messages)
        """
        if target_dim not in ConstraintRegistry.DEPENDENCIES:
            return 0.0, []
        
        friction = 0.0
        reasons = []
        
        for prereq_dim, min_val, msg in ConstraintRegistry.DEPENDENCIES[target_dim]:
            actual_val = current_state.get(prereq_dim, 0)
            if actual_val < min_val:
                # Calculate how far we are from the requirement
                gap = min_val - actual_val
                friction += gap * 2.0  # Penalty multiplier
                reasons.append(f"Dependency Fail [{prereq_dim}]: {msg}")
        
        # Cap friction at 90% (there's always some possibility of change)
        return min(friction, 0.9), reasons


class TransformationLogic:
    """
    Encodes the specific effects of each transformation on each dimension.
    This is the expanded logic matrix.
    """
    
    # Dimension-specific transformation effects
    LOGIC_MATRIX = {
        'structural': {
            'Accretion': 'Complication. Adding modules, layers, detail.',
            'Pruning': 'Simplification. Removing redundancy.',
            'Reconfiguration': 'Isomorphism. Changing shape without changing mass.',
            'Fusion': 'Integration. Merging disparate parts.',
            'Bifurcation': 'Division. Splitting into independent parts.',
            'Iteration': 'Hardening. Reinforcing through use.',
            'Phase Shift': 'State Change. Liquid to Solid hierarchy.',
            'Transmutation': 'Ontological Shift. Hardware becomes software.'
        },
        'relational': {
            'Accretion': 'Density. Adding nodes/links to network.',
            'Pruning': 'Isolation. Severing weak ties.',
            'Fusion': 'Coupling. Creating tight dependencies.',
            'Bifurcation': 'Polarization. Creating silos.',
            'Transmutation': 'Reframing. Enemies to allies.'
        },
        'temporal': {
            'Accretion': 'Extension. Lengthening time horizon.',
            'Pruning': 'Acceleration. Reducing cycle time.',
            'Iteration': 'Rhythm. Establishing cadence.',
            'Phase Shift': 'Syncopation. Linear to exponential time.'
        },
        'epistemic': {
            'Accretion': 'Data accumulation. Gathering signals.',
            'Pruning': 'Signal extraction. Removing noise.',
            'Reconfiguration': 'Reframing. New perspective on same data.',
            'Fusion': 'Synthesis. Merging knowledge domains.',
            'Bifurcation': 'Scenario creation. Competing hypotheses.',
            'Iteration': 'Bayesian update. Reducing error bars.',
            'Phase Shift': 'Epiphany. Connecting dots.',
            'Transmutation': 'Paradigm shift. Changing nature of truth.'
        },
        'agency': {
            'Accretion': 'Resource gathering. Increasing capacity.',
            'Fusion': 'Centralization. Consolidating power.',
            'Bifurcation': 'Delegation. Distributing agency.',
            'Transmutation': 'Automation. Human to Machine agency.'
        },
        'value_oriented': {
            'Pruning': 'Efficiency. Less input, same output.',
            'Reconfiguration': 'Arbitrage. Moving to higher-value config.',
            'Bifurcation': 'Hedging. Creating options for risk.',
            'Phase Shift': 'Scale. Linear to exponential returns.'
        }
    }
    
    @staticmethod
    def get_description(dimension: str, transformation: str) -> str:
        """Get human-readable description of transformation effect."""
        return TransformationLogic.LOGIC_MATRIX.get(dimension, {}).get(
            transformation, 
            "Generic transformation effect"
        )


class CouplingRegistry:
    """
    Defines the 'Side Effects' (Ripples) of the D-T Framework.
    
    Unlike constraints (which prevent change based on prerequisites),
    couplings cause automatic cascading changes when a dimension is modified.
    
    Format: {Source_Dim: [(Target_Dim, Correlation_Factor)]}
    
    Correlation_Factor:
        > 0: Synergistic (Source ↑ → Target ↑)
        < 0: Antagonistic (Source ↑ → Target ↓)
    """
    
    RIPPLES = {
        'structural': [
            # The Bureaucracy Trap: More structure/layers slows you down
            ('temporal', -0.4), 
            # Stability Bonus: More structure aids coherence
            ('relational', 0.2)
        ],
        
        'epistemic': [
            # The Clarity Dividend: Knowledge enables control
            ('agency', 0.5),
            # Efficiency Gain: Better knowledge reduces waste
            ('value_oriented', 0.3)
        ],
        
        'agency': [
            # The Herding Problem: Too many autonomous agents break connections
            ('relational', -0.2)
        ],
        
        'temporal': [
            # Speed enables iteration: Faster cycles improve learning
            ('epistemic', 0.15)
        ],
        
        'value_oriented': [
            # The Optimization Tax: Maximizing value often adds complexity
            ('structural', 0.1)
        ]
    }
    
    @staticmethod
    def get_ripple_targets(source_dim: str) -> List[Tuple[str, float]]:
        """Get all dimensions affected by changes to source dimension."""
        return CouplingRegistry.RIPPLES.get(source_dim, [])

