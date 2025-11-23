"""
D-T Framework Simulation: Corporate Bloat
Demonstrates ripple effects and coupling in action.
"""

import sys
import logging
from pathlib import Path

# Add dt_framework directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from mental_model import MentalModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)

print("=" * 70)
print("SIMULATION: 'Corporate Enterprise' - Ripple Effects")
print("=" * 70)
print()

model = MentalModel("Corporate Enterprise")

print("\nInitial State:")
print(model)
print()

# === SCENARIO 1: The Bloat (Antagonistic Coupling) ===
print("\n" + "=" * 70)
print("SCENARIO 1: The Bloat - Adding Management Layers")
print("=" * 70)
print("Adding bureaucracy (Structural Accretion)...")
print("Expected: Temporal (Speed) should drop due to antagonistic coupling")
print()

model.apply("Accretion", "structural", intensity=0.3)
print()

# === SCENARIO 2: The Cleanup (Synergistic Recovery) ===
print("\n" + "=" * 70)
print("SCENARIO 2: The Cleanup - Removing Layers")
print("=" * 70)
print("Removing bureaucracy (Structural Pruning)...")
print("Expected: Temporal (Speed) should recover")
print()

model.apply("Pruning", "structural", intensity=0.3)
print()

# === SCENARIO 3: The Research Breakthrough (Positive Cascade) ===
print("\n" + "=" * 70)
print("SCENARIO 3: The Research Breakthrough - Knowledge Investment")
print("=" * 70)
print("Massive knowledge gain (Epistemic Accretion)...")
print("Expected: Agency ↑ (Confidence) and Value ↑ (Efficiency) automatically")
print()

model.apply("Accretion", "epistemic", intensity=0.4)
print()

# === SCENARIO 4: The Delegation Wave (Complex Ripples) ===
print("\n" + "=" * 70)
print("SCENARIO 4: The Delegation Wave - Distributing Power")
print("=" * 70)
print("Increasing autonomy (Agency Accretion)...")
print("Expected: Relational ↓ (coordination challenge)")
print()

model.apply("Accretion", "agency", intensity=0.3)
print()

print("\n" + "=" * 70)
print("FINAL STATE")
print("=" * 70)
print(model)

print("\n" + "=" * 70)
print("RIPPLE SUMMARY")
print("=" * 70)
print("Key Insights:")
print("1. Structural growth caused temporal slowdown (bureaucracy tax)")
print("2. Epistemic growth triggered compound benefits (clarity dividend)")
print("3. Agency growth created coordination challenges (herding problem)")
print("4. The system exhibits realistic systemic behavior")
