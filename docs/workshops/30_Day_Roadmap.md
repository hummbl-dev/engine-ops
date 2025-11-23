# The 30-Day Sovereign Migration Schedule

**From Dependency to Dominion**

**Objective:** A structured timeline to decouple from "Black Box" AI providers and establish a Sovereign Intelligence Stack.  
**Cadence:** 4 Sprints (1 Week Each).

---

## Week 1: The Secession (Infrastructure)

**Theme:** Establish the Territory.  
We stop treating AI as a website we visit and start treating it as a server we run.

### Day 1 (Monday): The Initialization

- Initialize git repo: `sovereign-stack`.
- Create directory structure (`cortex/`, `config/`, `engine/`).
- **Action:** Commit the default `constitution.yaml` (from Artifact 2).

### Day 2 (Tuesday): The Connection

- Set up the MCP Server (Engine).
- Configure `model_routing.json`.
- **Test:** Ensure you can route a request to Claude-3-Opus and a local Llama-3 model via the same CLI command.

### Day 3 (Wednesday): The Persona Design

- Draft your first role: `/cortex/personas/senior_architect.md`.
- **Focus:** Encode your team's specific coding biases (e.g., "Functional > OOP").

### Day 4 (Thursday): The First Audit

- Run a simple task.
- Inspect the `interaction_logs`.
- **Win:** Verify that your API keys were not sent to the model context (redacted by Constitution).

### Day 5 (Friday): The Team Demo

- Show the "Glass Box" view to the team.
- Demonstrate switching models without changing the prompt.

**🛑 Deliverable:** A working CLI that routes prompts through a user-owned Constitution.

---

## Week 2: The Download (Context Extraction)

**Theme:** Populate the Mind.  
We extract the "Tribal Knowledge" trapped in human brains and proprietary SaaS silos and format it for the Engine.

### Day 8 (Monday): The Knowledge Audit

- Identify the top 3 questions new hires ask. (e.g., "How do we deploy?", "What is the naming convention?").

### Day 9 (Tuesday): The Library Build

- Create `/cortex/library/deployment.md`.
- Create `/cortex/library/conventions.md`.
- **Rule:** These must be plain text, not Notion links.

### Day 10 (Wednesday): The MCP Hookup

- Configure the Engine to have read-only access to your main codebase (`src/`).
- **Test:** Ask the Engine: "Based on conventions.md, does `src/auth.ts` violate our rules?"

### Day 11 (Thursday): The Private Sector

- Set up a "Local Only" route for PII.
- **Test** a prompt with dummy credit card numbers. Ensure it routes only to the local model (Ollama/Llama-3).

### Day 12 (Friday): The Retrieval Test

- Ask a question that requires combining 2 library files.
- **Win:** The model cites your internal docs, not generic internet advice.

**🛑 Deliverable:** A populated `/cortex` directory containing your team's core technical truth.

---

## Week 3: The Ritual (Operationalizing)

**Theme:** Change the Behavior.  
We move from "playing with it" to "shipping with it."

### Day 15 (Monday): The Augmented Commit

- **Mandate:** All non-trivial commits this week must include a `Generated-By: Sovereign Engine` footer.
- **Goal:** Track provenance.

### Day 16 (Tuesday): The Workflow Scripting

- Identify a repetitive task (e.g., writing unit tests).
- Create `/workflows/generate_tests.flow`.
- **Action:** Run it on 3 different modules.

### Day 17 (Wednesday): The Constitutional Crisis

- Intentionally try to do something "unsafe" (e.g., generate a destructive migration).
- **Verify:** Does the Escalation Protocol trigger? If not, update `constitution.yaml`.

### Day 18 (Thursday): The Peer Review

- Dev A reviews Dev B's prompt, not just the output code.
- "Why did you use the 'Junior' persona here? Use 'Architect' next time."

### Day 19 (Friday): The Retro

- What friction points exist?
- Did the "Glass Box" save anyone from a hallucination?

**🛑 Deliverable:** 5+ Production commits signed with Sovereign provenance.

---

## Week 4: The Federation (Scaling)

**Theme:** Standardize and Defend.  
We bake Sovereignty into the CI/CD pipeline so it survives personnel changes.

### Day 22 (Monday): The Persona Merge

- Consolidate local personas into the shared repo.
- Resolve "Merge Conflicts of the Mind" (e.g., Team decides on Tabs vs Spaces in the system prompt).

### Day 23 (Tuesday): The CI/CA Setup

- Create a `.eval` test suite.
- **Test:** "Ensure the Architect persona refuses to hardcode secrets."
- Hook into GitHub Actions / GitLab CI.

### Day 24 (Wednesday): The Drill

- Simulate an API outage (block OpenAI).
- **Action:** Switch `model_routing.json` to Anthropic or Local Fallback. Verify work continues.

### Day 25 (Thursday): The Executive Review

- Present the "Cost vs. Utility" report.
- Show how many tokens were routed to cheaper models via Arbitrage.

### Day 26 (Friday): Independence Day

- Cancel the team subscription to the "Feudal" tool (or downgrade to free tier).
- **Win:** You are now running on your own engine.

**🛑 Deliverable:** A CI-guarded, team-shared Sovereign Stack.

---

## The 30-Day Checkpoint

At the end of Day 30, ask:

1. **Do we own the prompts?** (Yes/No)
2. **Can we switch models in 5 minutes?** (Yes/No)
3. **Is the safety logic auditable?** (Yes/No)

**If the answers are YES, the migration is complete. You are Sovereign.**
