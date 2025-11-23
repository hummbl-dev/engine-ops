# The Sovereign Roadmap

**Current Version:** v0.1 (The Kernel)  
**Status:** Proof of Life. The Constitution is enforced. The Glass Box is visible.

---

## 🏗️ Phase 1: The Body (v0.2 - v0.5)

*Connecting the Brain to the World.*

- [ ] **v0.2: The Connector (MCP Integration)**
  - [ ] Implement a basic Model Context Protocol client.
  - [ ] Allow the Kernel to read local files (`--context ./README.md`).
  - [ ] *Goal:* "Context Sovereignty" (RAG without the Cloud).

- [ ] **v0.3: The Localizer (Ollama Support)**
  - [ ] Add native support for local inference endpoints (localhost:11434).
  - [ ] Create `router.py` logic to send PII-heavy prompts to Local models automatically.
  - [ ] *Goal:* "Privacy by Design."

- [ ] **v0.4: The TUI (Terminal User Interface)**
  - [ ] Upgrade `rich` print statements to a full interactive dashboard (using `Textual`).
  - [ ] Real-time token streaming.
  - [ ] *Goal:* A UX that rivals proprietary tools.

---

## 🧠 Phase 2: The Federation (v0.5 - v1.0)

*Scaling the Intelligence.*

- [ ] **v0.6: The Vector Vault**
  - [ ] Local ChromaDB integration for long-term memory.
  - [ ] "The Forget Protocol" (Commands to selectively wipe memory).

- [ ] **v0.7: The Persona Marketplace**
  - [ ] A CLI command to pull community personas: `sovereign install persona:security-auditor`.

- [ ] **v1.0: The IDE Extension**
  - [ ] A lightweight VS Code extension that pipes the editor selection into the `sovereign.py` kernel.
  - [ ] *Goal:* Complete replacement of Copilot.

---

## 🔮 The Long View (v2.0+)

- **Hardening Mode:** Running the Sovereign Kernel on air-gapped hardware (Raspberry Pi / Nvidia Jetson).
- **Federated Constitutions:** Organizations publishing their governance files for others to fork.
