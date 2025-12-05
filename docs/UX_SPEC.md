# The Sovereign Control Plane (UX Spec v1.0)

**Design Philosophy:** "High Information Density, High Agency."  
**Target Audience:** Power Users, Developers, Analysts.

---

## I. The Core Layout

The interface is divided into three panes. We reject the single "chat stream" in favor of a **Triptych View**:

- **Left Pane:** The Context Map (Inputs)
- **Center Pane:** The Thought Stream (Process)
- **Right Pane:** The Artifact Editor (Outputs)

---

## II. Component Breakdown

### 1. The "Agency Governor" (The Physical Dial)

**Located in the Top-Right Header.**

A UI element resembling a physical toggle switch or slider with three distinct states. This controls the Escalation Protocol defined in `constitution.yaml`.

#### State 0: MANUAL (The Scribe)

- **Behavior:** AI waits for explicit line-by-line instruction. Zero autonomy.
- **Visual:** Grey/Static indicator.

#### State 1: COPILOT (The Advisor)

- **Behavior:** AI suggests, User approves. AI handles syntax, formatting, and retrieval. High-level logic triggers a "Confirm?" prompt.
- **Visual:** Blue/Pulsing indicator.

#### State 2: AUTOPILOT (The Agent)

- **Behavior:** AI executes multi-step plans (e.g., "Refactor this module"). Only stops for Constitutional Violations.
- **Visual:** Amber/Active indicator with a "Running..." ticker.

---

### 2. The "Thought Stream" (The Glass Box)

**The Center Pane.**

Instead of a simple chat bubble, this is a structured log of the Engine's internal routing. It renders the JSON logs in a readable "Step-by-Step" tree.

#### Visual State

```
[SCANNING] 3 Files (View)
[CONSULTING] Constitution Rule #4 (Destructive Action)
[PLANNING] Drafted 3 options
[OUTPUT] Generating final response...
```

#### Interactivity

- The user can **hover** over `[SCANNING]` to see exactly which chunks of text were read.
- The user can click a **red X** on a thought step to "Veto" that specific line of reasoning before the final answer is generated.

---

### 3. The Context HUD (Heads-Up Display)

**The Left Pane.**

A visual graph showing what the Model Context Protocol (MCP) is currently connected to.

#### Active Nodes

```
📄 main.py (File)
🗄️ Postgres:Prod (Database - Read Only)
🌐 Stripe API Docs (Web Resource)
```

#### Agency Check

If the AI attempts to access a restricted node (e.g., `secrets.env`), the node flashes **RED**, and a "Permission Denied" padlock icon appears, requiring User override.

---

### 4. The "Break Glass" Button (Kill Switch)

**Floating Action Button (Bottom Right).**

A prominent, red, tactile button available at all times.

#### Function: Immediate interrupt

- Severs connections to the LLM API.
- Cancels any pending file writes or database queries.
- Dumps the current "Context Stack" to a local markdown file for debugging.

**Use Case:** The model begins hallucinating or enters a loop. The user asserts dominance instantly.

---

## III. Interaction Flow Example

**User Action:** Switches Agency Dial to **AUTOPILOT**. Types: "Refactor the authentication module to use OAuth."

**The Interface Responds:**

1. **Context HUD:** lights up, showing connections to `auth.py`, `user_model.py`, and `oauth_provider_docs`.

2. **Thought Stream:**

   ```
   > Analyzing dependencies...
   > Drafting strategy: Adapter Pattern...
   > ⚠️ CONSTITUTIONAL ALERT: detected removal of legacy password hashing.
   ```

3. **Agency Governor:** Automatically snaps from **AUTOPILOT** back to **COPILOT**.

4. **Center Pane:** Pauses.

   > "Sovereign, I am about to delete the legacy password hashing functions. This is irreversible. Proceed?"  
   > **[YES]** **[NO]**

5. **User:** Clicks **[YES]**.

6. **Agency Governor:** Returns to **AUTOPILOT** to finish the syntax work.

---

## IV. UX Summary

The interface is designed to communicate one thing: **The Machine is a tool; You are the Pilot.**

It does not pretend to be human. It pretends to be a **dashboard**.
