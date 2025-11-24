#!/usr/bin/env bash
set -e

echo "=== Demo: Blocked Transformation ==="
python3 - <<'PY'
from engine.dt_framework.mental_model import MentalModel
model = MentalModel("Demo Project")
# Attempt Phase Shift on value without prerequisites (high friction)
dims, warning, friction = model.apply("Phase Shift", "value_oriented", intensity=0.5)
print("Warning:", warning)
print("Friction:", friction)
# Improve Epistemic (reduce friction)
model.apply("Accretion", "epistemic", intensity=0.4)
# Try again
dims, warning, friction = model.apply("Phase Shift", "value_oriented", intensity=0.5)
print("After fixing Epistemic:")
print("Warning:", warning)
print("Friction:", friction)
print("Final dimensions:", model.dimensions)
PY
