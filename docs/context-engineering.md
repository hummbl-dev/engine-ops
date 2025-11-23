# Context Engineering Report: Engine-Ops

**Generated:** 2025-11-22
**Status:** Stable / v1.0-sovereign Released

## 1. Project Identity

**Name:** `hummbl-engine-ops` (Sovereign Intelligence Monorepo)
**Purpose:** A Sovereign Intelligence Platform that decouples "The Brain" (Python Engine) from "The Tool" (VS Code Extension) using the Model Context Protocol (MCP).
**Core Philosophy:** [The Sovereign Intelligence Manifesto](../MANIFESTO.md)

**Core Stack:**

- **Brain (Engine):** Python 3.10+, FastAPI, Uvicorn, Docker
- **Tool (Extension):** TypeScript, VS Code Extension API, MCP SDK
- **Protocol:** Model Context Protocol (MCP)
- **Infrastructure:** Google Cloud Run (Engine), VS Code Marketplace (Extension)

## 2. Repository Structure

| Directory | Purpose |
|-----------|---------|
| `engine/` | **The Brain.** Python FastAPI service. Hosts the "Council" of personas and core logic. |
| `extension/` | **The Tool.** VS Code Extension. Acts as the MCP Client and Chat Interface (`@hummbl`). |
| `docs/` | Documentation, Playbooks, and Manifestos. |
| `.github/workflows/` | CI/CD pipelines for Engine deployment and Extension release. |

## 3. CI/CD State

**Status:** ✅ **Fully Operational**
**Workflows:**

- `deploy-engine.yml`: Deploys `engine/` to Cloud Run on push to `main`.
- `release-extension.yml`: Builds and releases `extension/` on tag `v*`.

## 4. Operational Playbooks

- **[Deployment Procedures](playbooks/deployment-procedures.md):** Blue-Green and Rolling deployment strategies for the Engine.
- **[Safety Praxis](prompt-engineering/SAFETY_PRAXIS.md):** Safety and alignment guidelines for the Council.

## 5. Recent Achievements

1. **Monorepo Refactor:** Successfully restructured into `engine/` and `extension/`.
2. **Sovereign v1.0 Release:** Tagged and shipped `v1.0-sovereign`.
3. **MCP Integration:** Implemented standard `tools/call` protocol for seamless Engine-Extension communication.
4. **Council Consultation:** Verified end-to-end flow where `@hummbl` consults the Python Engine for strategic advice.

## 6. Outstanding Items

- **Expand Council:** Add more personas (Machiavelli, Marcus Aurelius) with distinct prompts.
- **Database Integration:** Connect Engine to a persistent vector store for long-term memory.
- **Auditor Implementation:** Flesh out `engine/src/auditor.py` with real constitutional checks.
