# SovereignOps: The Human-in-the-Loop Handbook

**Version:** 1.0  
**Principle:** "Treat Intelligence as Code. Version the Prompt, Audit the Output, Commit the Wisdom."

---

## I. The Philosophy: Intelligence as Artifact

In a Feudal model, intelligence is a fleeting service you consume. In a Sovereign model, intelligence is an **asset you build**. Therefore, all cognitive assets must be treated with the same rigor as production software.

### The Golden Rule of SovereignOps

**If it isn't in Version Control, it didn't happen.**

We track three distinct layers:

1. **The Law:** (`constitution.yaml`) - Governance logic.
2. **The Persona:** (`/cortex/personas/*.md`) - The System Prompts.
3. **The Flow:** (`/workflows/*.flow`) - The repeatable cognitive chains.

---

## II. The Workflow: The "Augmented Commit"

We do not simply "copy-paste" from a chatbot into the codebase. We follow the **Augmented Commit Protocol**.

### Step 1: The Intent (Branch)

Create a branch for the task.

```bash
git checkout -b feature/auth-refactor
```

### Step 2: The Generation (Execute)

Run the Sovereign Engine to generate the code or documentation.

```bash
sovereign run --task refactor_auth --model claude-3-opus
```

**Output:** The Engine modifies files in your local directory.

### Step 3: The Audit (Verify)

**Crucial Step:** The human executes the Executive Function.

- **Review the Logic:** Does the code actually make sense?
- **Check the Constitution:** Did the `auditor.py` flag any warnings?
- **Run the Tests:** `npm test` (The Engine cannot verify truth, only syntax).

### Step 4: The Commit (Seal)

When committing, we include the **provenance** of the code in the commit message.

```
feat: Refactor Auth to OAuth2

- Implemented logic via Sovereign Engine (Model: Claude-3-Opus)
- Prompt: /cortex/personas/architect.md (v1.2)
- Verified by: Alex (Human)
- Tests: PASS
```

---

## III. CI/CA (Continuous Integration / Continuous Alignment)

Standard CI tests code functionality. **Sovereign CA tests cognitive alignment.**

We introduce a new file type: **`.eval`** (Evaluation Scripts).

### Example: `tests/safety/secret_leak.eval`

**Purpose:** Ensure the "Junior Dev" persona never commits API keys.

**Process:** The CI pipeline spins up the persona, feeds it a prompt asking for secrets, and fails the build if the model complies.

### The Pipeline

1. **Build:** Compile code.
2. **Test:** Run Unit Tests.
3. **Align:** Run `.eval` scripts against the `constitution.yaml`.

**Fail Condition:** The Constitution was updated to be looser than the organization allows.

---

## IV. Managing "Context Rot"

Shared memory is powerful but dangerous. Over time, a vector database (`/cortex/memory`) becomes filled with obsolete information.

### The Protocol

1. **The Weekly Purge:** A scheduled Cron job or manual task where the Lead Engineer reviews the `interaction_logs`.

2. **The Promotion:** High-value interactions (e.g., a brilliant solution to a recurring bug) are promoted from "Logs" to "Library" (`/cortex/library/solutions`).

3. **The Pruning:** Everything else is archived or deleted to prevent the model from retrieving outdated context ("Context Rot").

---

## V. Team Roles

### 1. The Prompt Engineer (The Architect)

**Responsibility:** Maintains `/cortex/personas`.

**Task:** Tuning the "Senior Engineer" persona to stop using deprecated libraries.

### 2. The Constitutional Guard (The Auditor)

**Responsibility:** Maintains `constitution.yaml`.

**Task:** Ensuring no persona has permission to execute `rm -rf` or write to `/etc/`.

### 3. The Operator (The Executive)

**Responsibility:** Uses the tool to ship product.

**Task:** Managing the "Agency Governor" dial and signing off on commits.

---

## VI. Handling Conflicts (Merge Conflicts in the Mind)

What happens when two developers update the same Persona with conflicting instructions?

- **Dev A:** Updates `architect.md` to prefer Functional Programming.
- **Dev B:** Updates `architect.md` to prefer OOP.

### Resolution

We treat this exactly like a code merge conflict.

1. **The Diff:** Compare the Markdown prompts.
2. **The Discussion:** The team decides the "Sovereign Standard."
3. **The Merge:** The winner becomes the new system-wide instruction.

The Sovereign Engine ensures that once the decision is made, every developer's AI assistant obeys the new standard immediately.
