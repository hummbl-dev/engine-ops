# Sovereign Intelligence Starter Templates

This directory contains production-ready configuration files for bootstrapping a Sovereign Intelligence Stack.

## Quick Start

```bash
# Initialize your sovereign stack
mkdir -p config cortex/personas workflows

# Copy the templates
cp templates/config/constitution.yaml config/
cp templates/cortex/personas/senior_architect.md cortex/personas/
cp templates/workflows/refactor_module.flow workflows/
```

## Templates Included

### 1. `config/constitution.yaml`

The governance layer defining:

- **Global Directives** (non-prescriptive language, privacy-first)
- **Tiered Agency** (autonomous/supervised/forbidden actions)
- **Model Routing** (arbitrage strategy for different tasks)

### 2. `cortex/personas/senior_architect.md`

A production-ready persona that enforces:

- Engineering values (simplicity, idempotency, type safety)
- Socratic method for bad ideas
- Technical debt warnings

### 3. `workflows/refactor_module.flow`

A safe refactoring workflow with:

- Dependency scanning
- Risk assessment
- Human approval for high-risk changes
- Automated linting

## Customization

Each template includes comments explaining the configuration options. Modify these files to match your team's:

- Tech stack
- Engineering standards
- Risk tolerance
- Model providers

## See Also

- [Sovereign Migration Manual](../docs/workshops/Sovereign_Migration_Manual.md) - 30-day adoption guide
- [The Sovereign Scaffold](../docs/The_Sovereign_Scaffold.md) - Directory structure
- [SovereignOps](../docs/SovereignOps.md) - Team collaboration handbook
