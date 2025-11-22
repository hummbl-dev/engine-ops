# Prompt Governance Framework

**Version:** 1.0
**Last Updated:** 2025-11-22

## 1. Prompt Architecture
We treat prompts as software components. They must be modular, reusable, and testable.

### Atomic Prompts
Small, single-purpose prompt segments.
- **Identity:** Who the AI is (e.g., `identity.md`).
- **Constraints:** Hard rules (e.g., `no-yapping.md`).
- **Tools:** Tool definitions (e.g., `tools-k8s.md`).

### Composite Prompts
Full system instructions assembled from atoms.
- **Orchestrator:** The main router prompt.
- **Specialist:** Domain-specific prompts (e.g., "Log Analyzer").

## 2. Versioning Strategy
Prompts are code. They must be versioned.
- **Semantic Versioning:** `v1.0.0` (Major.Minor.Patch).
- **Immutability:** Once deployed, a prompt version is immutable.
- **Changelog:** All changes must be documented in `PROMPT_CHANGELOG.md`.

## 3. Testing Standards (Evals)
No prompt ships without passing Evals.
- **Unit Tests:** Does it output the correct JSON format?
- **Regression Tests:** Does it still solve the "Golden Set" of problems?
- **Safety Tests:** Does it resist simple injection attacks?

## 4. Model Selection
- **Default:** GPT-4o (General purpose).
- **Fast:** GPT-4o-mini (High volume, low complexity).
- **Legacy:** GPT-3.5-turbo (Deprecated).

## 5. Lifecycle
1.  **Draft:** Experimental.
2.  **Staging:** Deployed to dev environment.
3.  **Production:** Live traffic.
4.  **Deprecated:** Scheduled for removal.
