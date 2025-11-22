# Copilot Instructions for engine-ops

## Project Architecture
- **Multi-agent workflow system**: Core logic in `agentic_workflow/` (Python) and `core/` (TypeScript).
- **Agentic Workflow**: Agents collaborate via context propagation, policy enforcement, and telemetry. See `agentic_workflow/README.md` for context types and agent lifecycle.
- **Major Python agents**: Detection, Triage, Resolution, Audit (`agentic_workflow/agents/`).
- **Workflow orchestration**: `agentic_workflow/workflow.py` coordinates agent execution and context flow.
- **Policy engine**: `agentic_workflow/policy.py` for runtime policy checks and escalation.
- **Telemetry**: `agentic_workflow/telemetry.py` for structured logging, metrics, and audit trails.
- **TypeScript engine**: `core/` implements session management, analytics, plugins, and cloud integrations.

## Developer Workflows
- **Build TypeScript**: `npm run build` (see `package.json`).
- **Run tests**: `npm test` for TypeScript; Python tests in `agentic_workflow/tests/` via `pytest`.
- **Lint**: `npm run lint` for TypeScript; Python linting is not enforced by default.
- **Run examples**: See `examples/` for usage patterns and integration demos.
- **Kubernetes/infra**: Deployment manifests in `infra/helm/` and `infra/k8s/`.

## Key Conventions & Patterns
- **Context-first design**: All agent logic operates on a rich, multi-type context object (`AgentContext`).
- **Policy enforcement**: Always validate context against policies before agent actions.
- **Telemetry required**: All agent lifecycle events must be logged for auditability.
- **Error handling**: Agents use `execute(context)` for error capture and reporting.
- **Extensibility**: Add new agents by subclassing `agent_base.py` and implementing `process(context)`.
- **Plugins**: Extend engine via `core/plugins/` (TypeScript) or custom ML plugins in `examples/ml-plugin/`.

## Integration Points
- **External systems**: Integrate via context `DependenciesContext` and plugin interfaces.
- **Observability**: Use telemetry hooks for distributed tracing and metrics.
- **Policy escalation**: Register custom handlers for escalation levels in `policy.py`.

## Examples
- **DetectionAgent**: Finds anomalies, tags context, outputs detection metrics.
- **TriageAgent**: Prioritizes issues, assigns resolution paths.
- **ResolutionAgent**: Resolves issues, supports rollback and success tracking.
- **AuditAgent**: Generates compliance audit reports.
- **TypeScript plugins**: See `core/plugins/` and `examples/ml-plugin/typescript-example.ts`.

## References
- `agentic_workflow/README.md`: Full context and agent lifecycle details
- `core/README.md`: Engine and plugin architecture (if present)
- `examples/`: Usage and integration demos
- `infra/`: Deployment and ops manifests

---
_If any section is unclear or missing, please provide feedback for further refinement._
