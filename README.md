# Sovereign Intelligence Stack

[![License](https://img.shields.io/badge/license-BSL%201.1-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-green.svg)](.github/workflows/production.yml)

> **Escape Digital Feudalism. Own Your AI.**

A production-ready, self-evolving AI stack with constitutional governance, federated learning, and real-time control.

---

## 🎯 The Problem: AI Feudalism

| Traditional AI        | Sovereign Stack          |
| --------------------- | ------------------------ |
| 🔒 **Black Box**      | 🔍 **Glass Box**         |
| 🏢 **Vendor Lock-in** | 👤 **User Owned**        |
| ❓ **Opaque Rules**   | 📜 **YAML Constitution** |
| 🤖 **AI Decides**     | 🧠 **Human Governs**     |
| 💨 **Context Rots**   | 📊 **Full Audit Trail**  |

**You are not a tenant. You are the Sovereign.**

---

## ✨ Features

### 🛡️ Governance & Safety

- **Constitutional Policy Engine** - Define rules in `constitution.yaml`
- **Immutable Audit Logging** - Every AI decision is traceable
- **Policy Enforcement** - Block dangerous commands, secrets, SQL injection
- **Adversarial Defense** - Red-team tested against prompt injection

### 🧠 Advanced Cognition

- **Self-Reflective Reasoning** - o1-style test-time compute
- **Multi-Agent Debate** - Consensus through Red/Blue/Judge deliberation
- **Episodic Memory (RAG)** - ChromaDB vector store with semantic search
- **Federated Learning** - Cross-instance knowledge sharing (privacy-preserving)

### 🏗️ Self-Evolution (The Architect)

- **Sandboxed Code Generation** - TDD workflow (tests → code → verify)
- **Path Traversal Protection** - All writes confined to `sandbox/`
- **Constitutional Verification** - Generated code validated against policies
- **Pattern Memorization** - Successful solutions stored for reuse

### 🎮 SovereignOps Control Plane

- **Real-Time Agent Management** - Pause/Resume/Stop any agent
- **Terminal UI (TUI)** - Live monitoring dashboard (`sovereign_ops.py`)
- **Management API** - RESTful endpoints for agent control
- **Global Registry** - Track all active agents

### 📦 Production Ready

- **CI/CD Pipeline** - GitHub Actions with automated testing
- **Kubernetes Deployment** - Multi-replica deployment with federation
- **Monitoring** - Prometheus metrics (`/health`, `/metrics`)
- **Integration Tests** - E2E workflow verification
- **Load Balancing** - K8s Service with 3+ replicas

---

## 🚀 Quick Start

### Prerequisites

- Python 3.13+
- Docker (optional, for K8s deployment)
- Git

### 1. Clone & Setup

```bash
git clone https://github.com/hummbl-dev/engine-ops.git
cd engine-ops

# Setup Python environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure API key
echo "GOOGLE_API_KEY=your_key_here" > .env
```

### 2. Run Locally

```bash
# Start the Engine API
uvicorn engine.src.main:app --reload

# In another terminal: Launch SovereignOps TUI
python sovereign_ops.py
```

Open <http://localhost:8000/docs> for the Matrix-themed API interface.

### 3. Deploy to Kubernetes

```bash
# Using the deployment helper (works with Colima)
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Or manually
kubectl apply -f infra/k8s/sovereign-stack-deployment.yaml
```

See [Production Deployment Guide](docs/PRODUCTION_DEPLOYMENT.md) for detailed instructions.

---

## 📚 Architecture

```
engine-ops/
├── agentic_workflow/       # Multi-agent system
│   ├── agents/            # Detection, Triage, Resolution, Audit, Architect
│   ├── tools/             # FileSandbox, safe I/O
│   ├── debate.py          # Multi-agent consensus
│   ├── policy.py          # Constitutional enforcement
│   └── memory.py          # Episodic RAG
├── engine/                # FastAPI REST API
│   ├── src/main.py        # Matrix-themed Swagger UI
│   └── src/registry.py    # Agent management
├── infra/k8s/             # Kubernetes manifests
├── sovereign_ops.py       # Terminal UI (Textual)
├── sandbox/               # Safe code generation zone
└── docs/                  # Complete documentation
```

---

## 🎯 Core Components

### 1. Constitutional Governance

Define your AI's behavior in `config/constitution.yaml`:

```yaml
directives:
  - id: no_secrets
    pattern: '(api[_-]?key|password|secret)'
    action: block
    reason: 'Potential secret exposure'
```

### 2. Multi-Agent Debate

Critical decisions trigger consensus through deliberation:

```python
from agentic_workflow.debate import get_debate_orchestrator

orchestrator = get_debate_orchestrator()
result = orchestrator.orchestrate_debate(issue, rounds=3)
# Returns: DebateResult with final_decision and convergence_score
```

### 3. The Architect (Self-Modification)

Generate code safely with TDD workflow:

```python
from agentic_workflow.agents.architect_agent import ArchitectAgent

architect = ArchitectAgent()
result = architect.generate_code("Create a Fibonacci function")
# Writes tests → implementation → runs tests → verifies policy
```

### 4. SovereignOps Control

Manage agents in real-time:

```bash
# Launch TUI
python sovereign_ops.py

# Or use API
curl -X POST http://localhost:8000/agents/agent-1/pause
curl -X POST http://localhost:8000/agents/agent-1/resume
```

---

## 📖 Documentation

- **[User Guide](USER_GUIDE.md)** - Complete usage guide
- **[Production Deployment](docs/PRODUCTION_DEPLOYMENT.md)** - K8s deployment guide
- **[Walkthrough](walkthrough.md)** - Feature demonstrations with examples
- **[Manifesto](MANIFESTO.md)** - Philosophy & motivation
- **[Architecture](docs/The_Sovereign_Scaffold.md)** - Technical deep dive

---

## 🧪 Testing

```bash
# Run all tests
pytest agentic_workflow/tests/ -v

# Run integration tests
pytest agentic_workflow/tests/integration/ -v

# With coverage
pytest --cov=agentic_workflow --cov-report=html
```

---

## 🔬 Research Contributions

This stack implements several novel approaches:

1. **Self-Reflective Multi-Agent Consensus** - Combining o1-style reasoning with deliberative debate (~30% accuracy improvement)
2. **Privacy-Preserving Federated Memory** - Cross-instance learning without raw data exposure
3. **Constitutional AI with Runtime Verification** - Policy enforcement at execution time, not just training
4. **Sandboxed Self-Evolution** - Safe code generation with TDD and policy validation

See [walkthrough.md](walkthrough.md) for benchmarks and results.

---

## 🛣️ Roadmap

- [x] **Phase 1-9:** Foundation (Governance, Memory, Debate, Federation)
- [x] **Phase 10:** SovereignOps Control Plane
- [x] **Phase 11:** The Architect (Self-Evolution)
- [ ] **Phase 12:** Multi-Modal (Vision, Audio)
- [ ] **Phase 13:** Formal Verification (TLA+)
- [ ] **Phase 14:** Economic Optimizer (Cost-aware orchestration)

---

## 🤝 Contributing

We follow **SovereignOps** protocols:

1. **Augmented Commits** - AI-generated code must cite provenance
2. **Constitutional Audits** - All PRs pass policy checks
3. **Context Hygiene** - Regular memory pruning

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

Business Source License 1.1 (BSL 1.1)  
Converts to Apache 2.0 on 2029-01-01

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with:

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Textual](https://textual.textualize.io/) - Terminal UI framework
- [ChromaDB](https://www.trychroma.com/) - Vector database
- [Gemini](https://ai.google.dev/) - LLM provider
- [Kubernetes](https://kubernetes.io/) - Container orchestration

---

**Welcome to the age of Owned Intelligence.**

_You are not a tenant. You are the Sovereign._
