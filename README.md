# Sovereign Intelligence Engine & Ops

> "We hold these truths to be self-evident: That Intelligence must be a Tool of Agency, not a Replacement for it."

🚀 **Status:** Active | 🏛️ **Philosophy:** Sovereign

---

**engine-ops** is the reference implementation of the **Sovereign Intelligence Stack**. It provides the infrastructure, governance patterns, and operational playbooks necessary for teams to reject "Digital Feudalism" and own their cognitive infrastructure.

---

## 📂 The Repository Structure

This repository is organized into the three pillars of Sovereignty:

### 1. 🧠 The Cortex (`/cortex`)

**The Soul of the System.**

- `/personas`: System prompts treated as role-based configuration (e.g., `senior_architect.md`).
- `/library`: Static knowledge bases and context files (e.g., `style_guide.md`).
- `/memory`: Long-term vector storage and interaction logs.

### 2. ⚖️ The Constitution (`/config`)

**The Law of the Land.**

- `constitution.yaml`: The governance file defining safety rails, privacy rules, and agency tiers.
- `model_routing.json`: Configuration for Model Arbitrage (routing tasks to OpenAI, Anthropic, or Local Llama based on cost/privacy).

### 3. ⚡ The Engine (`/engine`)

**The Machinery.**

- **Stateless MCP Server**: The Python/Rust core that processes intent, tools, and retrieval.
- **Workflows**: Repeatable cognitive chains (e.g., `refactor_module.flow`).

---

## 📖 Documentation Index

### Phase 1: The Philosophy (Why we build)

- **[The Manifesto](MANIFESTO.md)**: The argument against Digital Feudalism.
- **[The Dialectic](docs/DIALECTIC.md)**: Thesis, Antithesis, and Synthesis.

### Phase 2: The Architecture (What we build)

- **[The Scaffold](docs/The_Sovereign_Scaffold.md)**: The directory structure standard.
- **[The Dictionary](docs/Dictionary_of_Cognitive_Sovereignty.md)**: Common vocabulary (e.g., "Model Drift", "Glass Box").
- **[SovereignOps](docs/SovereignOps.md)**: The Human-in-the-Loop collaboration guide.
- **[Ironman Defense](docs/The_Adversarial_Defense.md)**: Rebuttals to common objections.

### Phase 3: The Migration (How to adopt)

- **[Migration Manual](docs/workshops/Sovereign_Migration_Manual.md)**: From Tenant to Owner.
- **[30-Day Roadmap](docs/workshops/30_Day_Roadmap.md)**: The implementation schedule.
- **[Starter Templates](templates/)**: Copy-paste configurations for `constitution.yaml` and Personas.

---

## ⚡ Quick Start (Zero to Sovereign)

### 1. Initialize the Stack

```bash
git clone https://github.com/hummbl-dev/engine-ops.git
cd engine-ops
cp templates/config/constitution.yaml config/
cp templates/personas/senior_architect.md cortex/personas/
```

### 2. Configure the Router

Edit `config/model_routing.json` to point to your preferred providers (Local or Cloud).

### 3. Run the Engine

```bash
# Example: Run a safe refactor using the Architect persona
sovereign run workflow refactor_module --target src/main.py
```

---

## 🤝 Contributing

We follow **SovereignOps** protocols:

- **Augmented Commits**: All AI-generated code must verify provenance in the commit message.
- **Constitutional Audits**: No PR merges without passing `.eval` safety checks.
- **Context Hygiene**: Weekly pruning of vector memory to prevent "Context Rot."

---

**You are not a tenant. You are the Sovereign.**

Welcome to the age of Owned Intelligence.
