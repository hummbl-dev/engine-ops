# Core Directory

This directory contains the core business logic and functionality of Engine Ops.

## Structure

- **`ai/`** - AI/LLM integration layer
  - `client.ts` - Unified LLM client interface
  - `clients/` - Provider implementations (Gemini, Grok)

- **`algorithms/`** - Optimization algorithms
  - Bin packing, scheduling, resource allocation

- **`anomaly/`** - Anomaly detection system
  - `detector.ts` - Core anomaly detection
  - `llm-provider.ts` - AI-enhanced analysis

- **`infra/credentials/`** - Credentials management (⚠️ NOT secrets, see gitignore)
  - `manager.ts` - Interface for credential providers
  - `vault.ts`, `aws.ts`, `env.ts` - Provider implementations

- **`observability/`** - Metrics and monitoring
  - `metrics.ts` - Prometheus metrics middleware

- **`prompts/`** - AI prompt templates (versioned)
  - `anomaly-analysis/v1.md`
  - `summarize-logs/v1.md`

- **`tools/`** - Shared utilities
  - `log-summarizer.ts` - Log summarization tool

## Key Principles

- **Interface-driven design** - All major components expose interfaces
- **Provider pattern** - Multi-provider support (AI, credentials, etc.)
- **Separation of concerns** - Business logic isolated from API/infra
