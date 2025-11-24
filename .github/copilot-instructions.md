# Copilot Instructions for engine-ops

> **Version:** v1.0  
> **Last updated:** 2025-11-24  
> **Changelog:** Professionalized, expanded architecture, onboarding, and product guidance. See technical/non-technical docs for details.

## Big Picture Architecture
- **Multi-agent workflow system**: Python (`agentic_workflow/`) and TypeScript (`core/`) engines coordinate agents for detection, triage, resolution, and audit. Context flows between agents, enforcing policies and logging telemetry for full traceability.
- **Context-first design**: All agent logic operates on a rich, multi-type `AgentContext` (see `agentic_workflow/context.py`). Key context types: Identity, State, Session, Intent, Policy, Telemetry, Knowledge, Dependencies, Annotation, Security.
- **TypeScript core**: Implements session management, analytics, plugin support, and cloud integrations. Provider pattern and interface-driven design are used throughout (`core/README.md`).
- **Hybrid licensing**: BSL 1.1 for core IP, Apache 2.0 for public APIs/infra. See `README.md` for boundaries and rationale.

## Developer Workflows
- **Build TypeScript**: `npm run build` (see `package.json`)
- **Run TypeScript tests**: `npm test`
- **Run Python tests**: `pytest agentic_workflow/tests/`
- **Lint TypeScript**: `npm run lint`
- **Run ML plugin examples**: See `examples/ml-plugin/README.md` for both TypeScript and Python plugin demos
- **Kubernetes/infra**: Deploy via manifests in `infra/helm/` (Helm charts), `infra/k8s/` (raw manifests), and manage cloud infra with Terraform in `infra/terraform/`
- **Zero-downtime deployments**: Use blue-green configs in `infra/k8s/blue-green/`

## Project-Specific Conventions & Patterns
- **Agent extensibility**: Add new agents by subclassing `agent_base.py` and implementing `process(context)`
- **Policy enforcement**: Always validate context against policies before agent actions (`policy.py`)
- **Telemetry required**: All agent lifecycle events must be logged (`telemetry.py`)
- **Error handling**: Use `execute(context)` for agent error capture/reporting
- **Plugin architecture**: Extend via `core/plugins/` (TypeScript) or custom ML plugins (`examples/ml-plugin/`)
- **Provider pattern**: Used for AI, credentials, and cloud integrations (`core/`)
- **Separation of concerns**: Business logic is isolated from API/infra

## Integration Points & External Dependencies
- **External systems**: Integrate via `DependenciesContext` and plugin interfaces
- **Observability**: Use telemetry hooks for distributed tracing and Prometheus metrics (`core/observability/metrics.ts`)
- **Policy escalation**: Register custom escalation handlers in `policy.py`
- **Cloud infra**: Managed via Terraform (`infra/terraform/`), Helm (`infra/helm/`), and ArgoCD (`infra/argocd/`)

## Examples & References
- **DetectionAgent**: Finds anomalies, tags context, outputs detection metrics (`agentic_workflow/agents/detection_agent.py`)
- **TriageAgent**: Prioritizes issues, assigns resolution paths (`agentic_workflow/agents/triage_agent.py`)
- **ResolutionAgent**: Resolves issues, supports rollback and success tracking (`agentic_workflow/agents/resolution_agent.py`)
- **AuditAgent**: Generates compliance audit reports (`agentic_workflow/agents/audit_agent.py`)
- **TypeScript plugins**: See `core/plugins/` and `examples/ml-plugin/typescript-example.ts`
- **Python plugins**: See `examples/ml-plugin/python-example.py`
- **Docs**: `agentic_workflow/README.md`, `core/README.md`, `docs/README.md`, `infra/README.md`, `examples/ml-plugin/README.md`

---
_If any section is unclear, incomplete, or missing, please provide feedback for further refinement._
