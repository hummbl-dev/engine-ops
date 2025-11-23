# Contributing to the Sovereign Stack

Welcome, Operator.

This repository is not just a codebase; it is a reference implementation for **Cognitive Sovereignty**. To maintain the integrity of the stack, we enforce strict protocols for contribution.

---

## 📜 The Golden Rule: Provenance

We reject "Black Box" code. If you used an AI to generate your Pull Request, you must declare it.

### The Augmented Commit Protocol

Your PR description and commit messages must follow this format if AI was involved:

```text
feat: Implement Local Llama-3 Connector

[PROVENANCE]
- Engine: Sovereign Kernel / Manual
- Model: Claude-3-Opus / Llama-3-70b
- Persona: /cortex/personas/rust_expert.md
- Constitutional Check: PASSED
```

---

## 🛠️ Contribution Categories

### 1. The Cortex (Personas & Library)

**Path:** `/cortex/personas/community/`

**Requirement:** Do not submit generic prompts ("You are helpful"). Submit specific, expert roles ("You are a PostgreSQL Database Administrator specialized in partitioning").

**Format:** Markdown with clear `# IDENTITY`, `# BEHAVIOR`, and `# CONSTRAINTS` sections.

### 2. The Constitution (Directives)

**Path:** `/config/constitution.yaml`

**Requirement:** We rarely accept changes to the Core Directives. If you propose a new rule, provide a `tests/safety/violation_case.txt` proving why the rule is necessary.

### 3. The Engine (Core Logic)

**Path:** `/engine`

**Requirement:** Any change to the logic must pass the Glass Box Test.

- **Run:** `python sovereign.py --audit`
- **Verify:** The TUI must visualize the decision tree. Hidden logic is rejected.

---

## 🚨 The Safety Check

Before submitting, run the self-audit:

```bash
# Verify that your changes don't break the Constitution
python tests/constitutional_audit.py
```

---

**Thank you for building the exit ramp.**
