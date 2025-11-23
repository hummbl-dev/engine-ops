# Quick Start: Interactive CLI

## Installation

```bash
cd engine/dt_framework
python3 cli.py interactive
```

## Interactive Mode

```
╔══════════════════════════════════════════════════════════════╗
║     Sovereign D-T Framework - Interactive Mode              ║
╚══════════════════════════════════════════════════════════════╝

Commands:
  apply <transformation> <dimension> [intensity]
  set <dimension> <value>
  show
  ripples
  reset
  export <filename>
  help
  quit

dt>
```

## Example Session

```bash
# Create new model
dt> reset
Model name: Startup Pivot

# Set initial state (low structural, high temporal)
dt> set structural 0.2
dt> set temporal 0.9

# Attempt premature scaling
dt> apply PhaseShift value_oriented 0.5
⚠ Dependency Fail [epistemic]: Blind optimization is dangerous
Friction: 80% - SIGNIFICANT RESISTANCE

# Build foundation first
dt> apply Accretion epistemic 0.4
Friction: 0% - FULL EFFECT
↳ RIPPLE: epistemic → agency ⬆
↳ RIPPLE: epistemic → value_oriented ⬆

# Try again - now succeeds!
dt> apply PhaseShift value_oriented 0.5
Friction: 0% - FULL EFFECT

# View final state
dt> show

# View ripple map
dt> ripples

# Export history
dt> export pivot_history.json
```

## Command-Line Mode

```bash
# Non-interactive usage
python3 cli.py new "My Model"
python3 cli.py set epistemic 0.3
python3 cli.py apply Accretion epistemic --intensity 0.4
python3 cli.py show
python3 cli.py ripples
```

## Available Commands

### Transformations

- `Accretion` - Additive build-up
- `Pruning` - Subtractive refinement
- `Reconfiguration` - Structural rearrangement
- `Fusion` - Integrative merging
- `Bifurcation` - Divergent branching
- `Iteration` - Cyclic refinement
- `PhaseShift` - Threshold transformation
- `Transmutation` - Fundamental conversion

### Dimensions

- `structural` - Form & Composition
- `relational` - Interactions & Connectivity
- `temporal` - Time & Dynamics
- `epistemic` - Knowledge & Uncertainty
- `agency` - Control & Intent
- `value_oriented` - Outcomes & Leverage

### Tips

**Color Coding:**

- 🟢 Green: High values (0.7-1.0), full effect
- 🟡 Yellow: Medium values (0.4-0.7), moderate friction
- 🔴 Red: Low values (0.0-0.4), high friction

**State Persistence:**
Your model is automatically saved to `~/.sovereign/dt_model.json` and reloaded when you restart.

**Ripple Effects:**
Watch for cascading changes! The CLI shows all automatic dimension updates triggered by your transformations.
