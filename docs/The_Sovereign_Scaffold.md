# The Sovereign Scaffold

**Version:** 1.0  
**Status:** Architectural Standard  
**Principle:** "Code Rot is inevitable. Context is eternal. Structure accordingly."

---

## I. The Architectural Philosophy

A Sovereign Application is not a wrapper around an API. It is a **distinct organ** that consumes APIs. To achieve this, we separate the system into three hard boundaries:

1. **The Cortex (State & Rules):** Your data, prompts, and constitution. _(Asset-heavy, Code-light)_.
2. **The Engine (Logic):** The Python/Rust server that processes intent and talks to MCP. _(Stateless)_.
3. **The Interface (The Skin):** The VS Code extension, Terminal UI, or Web Dashboard. _(Disposable)_.

---

## II. The Directory Tree

```
/sovereign-stack
├── /config (The Law)
│   ├── constitution.yaml       # The core directives (Safety/Agency rails)
│   ├── model_routing.json      # Mapping tasks to specific models (Cost/Speed)
│   └── secrets.env.template    # API keys (NEVER committed)
│
├── /cortex (The Assets - YOU OWN THIS)
│   ├── /personas               # "The Council" (System Prompts)
│   │   ├── architect.md        # "High-level design advisor"
│   │   ├── auditor.md          # "Security & logic checker"
│   │   └── scribe.md           # "Documentation generator"
│   ├── /memory                 # Long-term Vector Store & Logs
│   │   ├── /chroma_db          # Local vector database (RAG)
│   │   └── /interaction_logs   # Raw JSON logs of every AI turn (Audit trail)
│   └── /library                # Static context (Company docs, style guides)
│
├── /engine (The Brain - MCP Server)
│   ├── /core                   # The decision logic
│   │   ├── router.py           # Decides which Model/Tool to call
│   │   ├── auditor.py          # Checks outputs against Constitution
│   │   └── mcp_server.py       # Implementation of Model Context Protocol
│   ├── /tools                  # Executable capabilities
│   │   ├── fs_tools.py         # Safe file system access
│   │   └── git_tools.py        # Version control interaction
│   └── requirements.txt
│
├── /interface (The Skin - VS Code Ext / CLI)
│   ├── /vscode-client          # TypeScript extension (UI only)
│   │   ├── src/extension.ts
│   │   └── package.json
│   └── /cli-client             # Rust/Python terminal interface
│       └── main.rs
│
└── /workflows (Standard Operating Procedures)
    ├── refactor_module.flow    # A scripted sequence of prompts
    └── generate_tests.flow     # Automated test generation loop
```

---

## III. Component Deep Dive

### 1. `/cortex` (The Sovereign Domain)

This directory is the **"Soul"** of the system. If you delete the Engine and the Interface but keep the Cortex, you have lost nothing but the machinery. Your intelligence is preserved.

**Design Rule:** All files here must be vendor-agnostic. No OpenAI-specific JSON. Pure Markdown or YAML.

**`/personas`:** We do not hardcode prompts in the engine code. Personas are treated as configuration. This allows "Hot-Swapping" capabilities (e.g., switching from "Junior Dev" to "Staff Engineer" mode).

### 2. `/config` (The Control Plane)

This defines the boundaries of the system.

**`constitution.yaml`:** (As defined in Phase 1). It is separated so it can be version-controlled and audited by human compliance teams.

**`model_routing.json`:** This enables **Model Arbitrage**.

```json
{
  "reasoning": "claude-3-opus",
  "coding": "gpt-4-turbo",
  "formatting": "llama-3-local"
}
```

Change the config, not the code.

### 3. `/engine` (The Stateless Server)

The Engine is an **MCP (Model Context Protocol) Server**. It does not know who the user is; it only knows how to execute requests.

**Role:** It accepts a prompt + a constitution, consults the `/cortex` for context, selects a tool, and returns a result.

**State:** It creates no state. It writes logs to `/cortex/memory`, but holds nothing in RAM. This makes it crash-resistant and scalable.

### 4. `/workflows` (The Playbook)

Sovereignty requires repeatability.

A `.flow` file is a chain of prompts.

**Example:** `generate_tests.flow`

```yaml
- Action: read_file (target)
- Action: retrieve_context (test_framework_docs)
- Prompt: 'Write unit tests for [target] using [framework].'
- Action: write_file (target_test.py)
- Action: run_tests
```

This turns "AI magic" into "Engineering Process."

---

## IV. The Data Flow (The Lifecycle of a Thought)

1. **Stimulus:** User highlights code in VS Code (`/interface`) and clicks "Refactor."

2. **Transmission:** Interface sends a JSON-RPC request to the Engine.

   ```json
   { "intent": "refactor", "context": "selection", "user": "Alex" }
   ```

3. **Routing:** Engine (`/engine/core/router.py`) sees "Refactor" → selects "Architect" Persona (`/cortex/personas/architect.md`).

4. **Retrieval:** Engine queries `/cortex/memory` for previous refactoring patterns used in this project.

5. **Generation:** Engine sends Context + Prompt + Constitution to the LLM (e.g., Anthropic).

6. **Auditing:** Output is received. `auditor.py` checks `constitution.yaml` (e.g., "Did it drop a table?").

7. **Execution:** If safe, Engine sends a "Apply Edit" response to the Interface.

8. **Memory:** The interaction is logged to `/cortex/memory/interaction_logs`.

---

## V. Why this Scaffold?

Most AI assistants bury the prompts in the code and the memory in the cloud.

**The Sovereign Scaffold inverts this:**

- **Prompts** are text files you can edit (`/cortex`).
- **Memory** is a database you can backup (`/memory`).
- **Logic** is a server you can swap (`/engine`).

**You do not "integrate" this scaffold. You inhabit it.**
