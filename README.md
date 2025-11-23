# The Sovereign Intelligence Framework

**A complete blueprint for building AI systems that amplify human agency instead of replacing it.**

---

## What is Sovereign Intelligence?

Sovereign Intelligence is not a product—it's a **philosophy made code**. It's an architectural paradigm where you own the infrastructure, define the governance, and retain ultimate decision-making power over your synthetic intelligence.

This repository contains everything you need to transition from **Digital Feudalism** (renting intelligence from centralized providers) to **Cognitive Sovereignty** (owning your entire AI stack).

---

## The Framework

### Phase 1: The Philosophy

Understand the "why" before the "how."

- **[MANIFESTO.md](MANIFESTO.md)** - The foundational declaration of Cognitive Sovereignty
- **[docs/DIALECTIC.md](docs/DIALECTIC.md)** - A Hegelian analysis presenting Thesis (Sovereignty), Antithesis (Paternalism), and Synthesis (Augmented Sovereign)

### Phase 2: The Operations

Learn the architectural principles and operational practices.

**Core Architecture:**

- **[docs/The_Sovereign_Scaffold.md](docs/The_Sovereign_Scaffold.md)** - Standard directory structure and three-layer architecture (Cortex/Engine/Interface)
- **[config/sovereign_constitution.yaml](config/sovereign_constitution.yaml)** - Example governance configuration

**Strategic Assets:**

- **[docs/STRATEGIC_COMPARISON.md](docs/STRATEGIC_COMPARISON.md)** - Digital Feudalism vs. Sovereign Intelligence decision matrix
- **[docs/The_Adversarial_Defense.md](docs/The_Adversarial_Defense.md)** - Rebuttals to efficiency, intelligence, UX, and safety objections
- **[docs/case-studies/THE_DELETION.md](docs/case-studies/THE_DELETION.md)** - Real-world scenario demonstrating Sovereign AI preventing production disasters

**Operational Guides:**

- **[docs/SovereignOps.md](docs/SovereignOps.md)** - Team collaboration handbook (Git for Intelligence)
- **[docs/Dictionary_of_Cognitive_Sovereignty.md](docs/Dictionary_of_Cognitive_Sovereignty.md)** - Lexicon for articulating problems and solutions

### Phase 3: The Adoption

Practical guides for teams to implement Sovereign Intelligence.

- **[docs/workshops/Sovereign_Migration_Manual.md](docs/workshops/Sovereign_Migration_Manual.md)** - 30-day workshop guide with graduated exercises
- **[docs/workshops/30_Day_Roadmap.md](docs/workshops/30_Day_Roadmap.md)** - Week-by-week project schedule
- **[templates/](templates/)** - Starter templates (constitution, personas, workflows)

---

## Quick Start

### For Decision-Makers

Read these in order:

1. [MANIFESTO.md](MANIFESTO.md) - Understand the philosophy
2. [docs/STRATEGIC_COMPARISON.md](docs/STRATEGIC_COMPARISON.md) - See the business case
3. [docs/The_Adversarial_Defense.md](docs/The_Adversarial_Defense.md) - Address objections

### For Engineers

Start here:

1. [docs/The_Sovereign_Scaffold.md](docs/The_Sovereign_Scaffold.md) - Learn the architecture
2. [templates/](templates/) - Copy starter files
3. [docs/workshops/Sovereign_Migration_Manual.md](docs/workshops/Sovereign_Migration_Manual.md) - Follow the workshop

### For Teams

Follow the 30-day migration:

1. [docs/workshops/30_Day_Roadmap.md](docs/workshops/30_Day_Roadmap.md) - Sprint-by-sprint schedule
2. [docs/SovereignOps.md](docs/SovereignOps.md) - Learn team collaboration protocols

---

## Key Principles

### 1. The Decoupled Brain (Infrastructure Independence)

Intelligence must not be hardcoded into the interface. Swap providers (Gemini, OpenAI, Anthropic, Local LLaMA) without rewriting code.

### 2. The Universal Protocol (Radical Interoperability)

Use standard protocols (MCP) to ensure your intelligence can follow you across environments.

### 3. Constitutional Governance (Agency Preservation)

Encode your values into machine-readable files that intercept and audit model outputs. You define the safety rails, not the provider.

---

## The Three Layers

```
/sovereign-stack
├── /cortex       # The Soul (Your data, prompts, memory)
├── /engine       # The Brain (MCP server, routing logic)
└── /interface    # The Skin (VS Code, CLI, Web UI)
```

**If you delete the Engine and Interface but keep the Cortex, you have lost nothing but machinery. Your intelligence is preserved.**

---

## Reference Implementation

This repository includes a working example:

- **`engine/`** - Python FastAPI service with MCP server
- **`extension/`** - VS Code extension with chat participant
- **`config/`** - Example constitution and routing configuration

---

## Documentation Map

```
docs/
├── MANIFESTO.md                    # [START HERE] The declaration
├── DIALECTIC.md                    # Philosophical justification
├── The_Sovereign_Scaffold.md       # Architecture blueprint
├── STRATEGIC_COMPARISON.md         # Business case
├── The_Adversarial_Defense.md      # Objection handling
├── SovereignOps.md                 # Team collaboration
├── Dictionary_of_Cognitive_Sovereignty.md  # Lexicon
├── case-studies/
│   └── THE_DELETION.md             # Real-world scenario
└── workshops/
    ├── Sovereign_Migration_Manual.md   # 30-day guide
    └── 30_Day_Roadmap.md              # Project schedule
```

---

## The Graduation Criterion

You have achieved Sovereignty when:

1. **You own the prompts** - They're version-controlled files, not chat history
2. **You can swap models in 5 minutes** - Change `model_routing.json`, not your code
3. **Your safety logic is auditable** - `constitution.yaml` is readable and modifiable

---

## Contributing

This is an open framework. Submit pull requests for:

- New persona templates
- Additional `.eval` test cases
- Case studies from your team's migration
- Improvements to the documentation

---

## License

Apache 2.0 - See [LICENSE](LICENSE)

---

**You are not a user. You are not a tenant. You are the Sovereign.**
