"""
D-T Framework Simulation: Project Phoenix
Demonstrates friction and dependency constraints in action.
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
    format='%(levelname)s: %(message)s'
)

print("=" * 60)
print("SIMULATION: 'Project Phoenix' - Premature Optimization")
print("=" * 60)
print()

# Initialize with low maturity state
phoenix = MentalModel("Project Phoenix", initial_dimensions={
    'structural': 0.2,
    'relational': 0.2,
    'temporal': 0.2,
    'epistemic': 0.1,  # Very low knowledge
    'agency': 0.2,
    'value_oriented': 0.1
})

print("Initial State:")
print(phoenix)
print()

# === SCENARIO 1: The Premature Optimization ===
print("\n" + "=" * 60)
print("[ATTEMPT 1] Trying to scale value immediately (premature)...")
print("=" * 60)

dims, warning, friction = phoenix.apply("Phase Shift", "value_oriented", intensity=0.5)

if warning:
    print(f"\n⚠️  WARNING: {warning}")
print(f"📊 Friction: {friction:.1%}")
print()

# === SCENARIO 2: The Corrective Action ===
print("\n" + "=" * 60)
print("[ATTEMPT 2] Building foundational knowledge...")
print("=" * 60)

# Learn (Epistemic has no prerequisites)
phoenix.apply("Accretion", "epistemic", intensity=0.4)
print()

print("[ATTEMPT 2b] Building structural foundation...")
phoenix.apply("Accretion", "structural", intensity=0.3)
print()

print("After foundation building:")
print(phoenix)
print()

# === SCENARIO 3: The Successful Scale ===
print("\n" + "=" * 60)
print("[ATTEMPT 3] Scaling value with proper foundation...")
print("=" * 60)

dims, warning, friction = phoenix.apply("Phase Shift", "value_oriented", intensity=0.5)

if warning:
    print(f"\n⚠️  WARNING: {warning}")
else:
    print("\n✅ SUCCESS: Transformation applied without friction!")

print(f"📊 Friction: {friction:.1%}")
print()

print("\n" + "=" * 60)
print("FINAL STATE")
print("=" * 60)
print(phoenix)

# Export history
print("\n📝 Exporting transformation history...")
phoenix.export_history("/tmp/phoenix_history.json")
print("   Saved to: /tmp/phoenix_history.json")
