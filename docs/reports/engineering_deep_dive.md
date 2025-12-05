# Technical Reference: AI & Infrastructure Architecture

**Date:** November 22, 2025
**Audience:** Lead Engineers / SREs

## 1. AI System Architecture

The AI subsystem is designed for modularity and safety, adhering to the **Context Engineering System** and **Prompt Engineering System** standards.

### 1.1 Core Components

- **`LLMClient` Interface (`core/ai/client.ts`):**
  - The central abstraction for all AI interactions.
  - Enables swapping providers without changing business logic.
  - Implementations: `GeminiClient`, `GrokClient`.
- **`LLMAnalysisProvider` (`core/anomaly/llm-provider.ts`):**
  - Implements the `AnalysisProvider` interface.
  - Injects an `LLMClient` at runtime.
  - Uses **Prompt Templates** (`core/prompts/anomaly-analysis/v1.md`) to structure requests.
  - **Pattern:** Strategy Pattern for provider selection.
- **`LogSummarizer` (`core/tools/log-summarizer.ts`):**
  - Standalone tool for log analysis.
  - **Safety:** Implements regex-based PII redaction (IPs, Emails) _before_ sending data to LLM.

### 1.2 Testing Strategy

- **Integration Tests:** `core/anomaly/__tests__/ai-integration.test.ts` uses a real (mocked) client to verify the full flow.
- **Mocking:** Clients (`GeminiClient`, `GrokClient`) have built-in mock modes that return context-aware responses (e.g., checking if the prompt is for "summary" or "analysis"). This allows offline testing without API costs.

## 2. Deployment Infrastructure

We have moved to a fully declarative, GitOps-driven infrastructure stack.

### 2.1 Terraform (Infrastructure)

- **Location:** `infra/terraform/`
- **Provider:** Google Cloud Platform (GKE).
- **Network:** VPC-native cluster with secondary IP ranges for Pods (`10.1.0.0/16`) and Services (`10.2.0.0/16`).
- **Security:** Workload Identity enabled for secure GCP service access.

### 2.2 Helm (Application Packaging)

- **Location:** `infra/helm/engine-ops/`
- **Blue-Green Architecture:**
  - The chart deploys **two** Deployment objects: `engine-ops-blue` and `engine-ops-green`.
  - Control is managed via `values.yaml`:
    ```yaml
    activeVersion: 'blue'
    blue: { enabled: true, version: 'v1' }
    green: { enabled: true, version: 'v2' }
    ```
  - The `Service` selector dynamically points to `version: {{ .Values.activeVersion }}`.
  - **Benefit:** Instant rollback by toggling `activeVersion`.

### 2.3 ArgoCD (GitOps)

- **Location:** `infra/argocd/`
- **Pattern:** App-of-Apps (`root.yaml`).
- **Sync Policy:**
  - `staging`: Automated (Prune + SelfHeal).
  - `production`: Manual sync required.

## 3. Operational Guide

### Switching AI Providers

To switch from Gemini to Grok in production:

1.  Update the application config (Environment Variable `LLM_PROVIDER=grok`).
2.  Ensure `GROK_API_KEY` is present in Kubernetes Secrets.
3.  Restart Pods.

### Performing a Blue-Green Deploy

1.  **Current State:** Blue is active (v1).
2.  **Deploy Green:** Update `values.yaml`:
    - `green.enabled: true`
    - `green.version: "v2"`
    - `activeVersion: "blue"` (Still pointing to blue)
3.  **Verify:** Run smoke tests against the Green Pods directly.
4.  **Switch:** Update `values.yaml`:
    - `activeVersion: "green"`
5.  **Commit & Sync:** ArgoCD applies the change, traffic shifts instantly.

## 4. Technical Debt / Future Work

- **Secret Injection:** Currently relying on env vars; should move to External Secrets Operator.
- **LLM Rate Limiting:** No client-side rate limiting implemented yet.
- **Evals:** We need to implement the `EVAL_TEMPLATE.md` for automated prompt regression testing.
