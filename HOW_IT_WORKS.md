# How The Interface Actually Works

**A Technical Deep-Dive into the Sovereign Intelligence Platform**

---

## [FLOW] The Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ User types: "@hummbl I'm overwhelmed..."
                            │
                ┌───────────▼───────────┐
                │   VS Code Chat UI     │
                │   (@hummbl.chat)      │
                └───────────┬───────────┘
                            │
                            │ 1. Chat Participant Activated
                            │
                ┌───────────▼───────────┐
                │  extension.ts         │
                │  (Chat Handler)       │
                └───────────┬───────────┘
                            │
                            │ 2. Intent Extraction
                            │    Uses vscode.lm API
                            │
                ┌───────────▼───────────┐
                │  vscode.lm            │
                │  (GPT-4 via Copilot)  │
                └───────────┬───────────┘
                            │
                            │ 3. LLM extracts:
                            │    {"member": "marcus_aurelius",
                            │     "topic": "I'm overwhelmed..."}
                            │
                ┌───────────▼───────────┐
                │  LanguageClient       │
                │  (MCP Client)         │
                └───────────┬───────────┘
                            │
                            │ 4. Sends MCP request:
                            │    client.sendRequest('tools/call', {
                            │      name: 'consult_council',
                            │      arguments: {topic, member}
                            │    })
                            │
                ┌───────────▼───────────┐
                │  MCP Server           │
                │  (server/index.ts)    │
                │  IPC Transport        │
                └───────────┬───────────┘
                            │
                            │ 5. MCP tool handler executes
                            │    fetch('http://localhost:8080/consult')
                            │
                ┌───────────▼───────────┐
                │  FastAPI Engine      │
                │  (main.py)            │
                │  Port 8080            │
                └───────────┬───────────┘
                            │
                            │ 6. POST /consult endpoint
                            │    Validates CouncilMember enum
                            │
                ┌───────────▼───────────┐
                │  adapter.py           │
                │  (Gemini Integration) │
                └───────────┬───────────┘
                            │
                            │ 7. Generates advice:
                            │    - Loads persona instructions
                            │    - Calls Gemini API
                            │    - Returns persona-specific advice
                            │
                ┌───────────▼───────────┐
                │  Response Chain       │
                │  (Back to User)       │
                └───────────────────────┘
```

---

## [STEP] Step-by-Step Breakdown

### Step 1: User Types in VS Code Chat

**Location:** VS Code Chat Panel  
**Action:** User types `@hummbl I'm feeling overwhelmed by chaos. What should I do?`

**What Happens:**

- VS Code recognizes `@hummbl` as a chat participant
- Calls `extension.ts` → `provideResponse()` function

---

### Step 2: Intent Extraction (The "Dynamic Router")

**Location:** `extension/src/extension.ts` (lines 42-97)  
**Technology:** `vscode.lm` API (uses GPT-4 via Copilot)

**What Happens:**

```typescript
// 1. Select a language model
const [model] = await vscode.lm.selectChatModels({ family: 'gpt-4' });

// 2. Create extraction prompt
const extractionMessages = [
  vscode.LanguageModelChatMessage.User(
    `You are an intent parser. Extract the 'topic' and 'member' from this query: "${request.prompt}".

Valid members: sun_tzu, marcus_aurelius, machiavelli.
Default member: sun_tzu (use this if no member is specified).

Return ONLY a valid JSON object. Example: {"member": "sun_tzu", "topic": "strategy"}`,
  ),
];

// 3. Get LLM response
const chatResponse = await model.sendRequest(extractionMessages, {}, token);

// 4. Parse JSON
let parsed = JSON.parse(extractedText);
// Result: {member: "marcus_aurelius", topic: "I'm feeling overwhelmed..."}
```

**Why This Works:**

- GPT-4 understands natural language
- "overwhelmed by chaos" → routes to Marcus Aurelius (Stoicism)
- "Ask Machiavelli..." → routes to Machiavelli
- No explicit member → defaults to Sun Tzu

**Error Handling:**

- If JSON parsing fails → fallback to `sun_tzu`
- If invalid member → fallback to `sun_tzu`
- If topic is empty → use original prompt

---

### Step 3: MCP Protocol Communication

**Location:** `extension/src/extension.ts` (lines 99-106)  
**Technology:** Model Context Protocol (MCP) via LanguageClient

**What Happens:**

```typescript
// Call the MCP tool
const response = await client.sendRequest('tools/call', {
  name: 'consult_council',
  arguments: {
    topic: parsed.topic, // "I'm feeling overwhelmed..."
    member: parsed.member, // "marcus_aurelius"
  },
});
```

**Communication Method:**

- **Transport:** IPC (Inter-Process Communication)
- **Protocol:** MCP (Model Context Protocol)
- **Client:** `LanguageClient` from `vscode-languageclient`
- **Server:** MCP server running in separate Node.js process

---

### Step 4: MCP Server Tool Handler

**Location:** `extension/src/server/index.ts` (lines 15-33)  
**Technology:** `@modelcontextprotocol/sdk`

**What Happens:**

```typescript
// MCP tool definition
server.tool(
  'consult_council',
  'Ask the Python engine to consult the council.',
  {
    topic: z.string(),
    member: z.string(),
  },
  async (args) => {
    // HTTP request to FastAPI engine
    const res = await fetch(`${ENGINE_URL}/consult`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const data = await res.json();
    return {
      content: [{ type: 'text', text: JSON.stringify(data) }],
    };
  },
);
```

**Key Points:**

- MCP server runs as separate Node.js process
- Communicates with VS Code via stdio (standard input/output)
- Makes HTTP request to Python FastAPI engine
- Returns response in MCP format: `{content: [{type: "text", text: "..."}]}`

**Environment Variable:**

- `ENGINE_URL` defaults to `http://localhost:8080`
- Can be overridden for remote engines

---

### Step 5: FastAPI Engine Endpoint

**Location:** `engine/src/main.py` (lines ~1505-1520)  
**Technology:** FastAPI, Pydantic, Uvicorn

**What Happens:**

```python
@app.post("/consult")
async def consult_council(request: CouncilRequest):
    # 1. Validate request (Pydantic model)
    #    - topic: str (required)
    #    - member: CouncilMember enum (sun_tzu, marcus_aurelius, machiavelli)

    # 2. Call adapter to generate advice
    advice = await generate_advice(
        topic=request.topic,
        member=AdapterCouncilMember(request.member.value)
    )

    # 3. Return JSON response
    return {
        "member": request.member.value,
        "advice": advice
    }
```

**Validation:**

- `CouncilRequest` Pydantic model ensures:
  - `topic` is a string
  - `member` is one of the enum values
  - Invalid members are rejected automatically

---

### Step 6: Gemini API Integration

**Location:** `engine/src/adapter.py`  
**Technology:** `google-generativeai`, `asyncio`

**What Happens:**

```python
async def generate_advice(topic: str, member: CouncilMember, context: Optional[str] = None) -> str:
    # 1. Run sync Gemini call in thread pool (non-blocking)
    advice = await asyncio.wait_for(
        asyncio.to_thread(_generate_advice_sync, topic, member, context),
        timeout=30.0
    )
    return advice

def _generate_advice_sync(topic: str, member: CouncilMember, context: Optional[str] = None) -> str:
    # 2. Load API key from .env
    api_key = os.getenv('GOOGLE_API_KEY')
    genai.configure(api_key=api_key)

    # 3. Get persona instructions
    persona = PERSONA_INSTRUCTIONS[member]

    # 4. Build prompt
    prompt = f"""{persona}

The user is asking about: {topic}
{f"Additional context: {context}" if context else ""}

Provide strategic advice in the style of this council member. Be concise but profound (2-4 sentences).
Remember: Do not use prescriptive language like "you must" or "solution" - preserve the user's agency.
"""

    # 5. Call Gemini API
    model = genai.GenerativeModel('gemini-2.5-pro')
    response = model.generate_content(prompt)

    # 6. Return advice text
    return response.text.strip()
```

**Persona Instructions:**

- Each council member has detailed persona instructions in `PERSONA_INSTRUCTIONS` dict
- Instructions define:
  - Speaking style
  - Philosophical framework
  - Key principles
  - What topics they excel at

**Example Persona (Sun Tzu):**

```
You are Sun Tzu, the ancient Chinese military strategist and philosopher.
Your advice focuses on:
- Terrain and timing
- Strategic positioning
- Deception and misdirection
- Knowing yourself and your enemy
...
```

---

### Step 7: Response Chain (Back to User)

**Flow:**

1. Gemini returns advice text
2. FastAPI returns JSON: `{"member": "marcus_aurelius", "advice": "..."}`
3. MCP server wraps in MCP format: `{content: [{type: "text", text: JSON.stringify(data)}]}`
4. Extension extracts text: `mcpResponse.content[0]?.text`
5. VS Code displays in chat: `new vscode.ChatResponse(responseText)`

**Final Result:**
User sees in VS Code chat:

```
Marcus Aurelius advises: "You have power over your mind, not outside events.
When chaos surrounds you, focus on what you can control: your thoughts,
your actions, your response..."
```

---

## [ARCH] Architecture Components

### 1. VS Code Extension (`extension/`)

**Files:**

- `src/extension.ts` - Main extension entry point
- `src/server/index.ts` - MCP server implementation

**Responsibilities:**

- Register chat participant (`@hummbl`)
- Extract intent using `vscode.lm`
- Communicate with MCP server via LanguageClient
- Display responses in VS Code chat

**Dependencies:**

- `vscode-languageclient` - MCP client
- `@modelcontextprotocol/sdk` - MCP server SDK
- `vscode.lm` - Language model API (GPT-4)

---

### 2. MCP Server (`extension/src/server/index.ts`)

**Responsibilities:**

- Expose MCP tools (`consult_council`, `run_constitutional_audit`)
- Bridge between VS Code and Python engine
- Handle HTTP requests to FastAPI

**Communication:**

- **To VS Code:** stdio (standard input/output)
- **To Engine:** HTTP (fetch API)

**Tools:**

1. `consult_council` - Consult a council member
2. `run_constitutional_audit` - Audit text for constitutional violations

---

### 3. Python FastAPI Engine (`engine/`)

**Files:**

- `src/main.py` - FastAPI application, endpoints, UI
- `src/adapter.py` - Gemini API integration

**Responsibilities:**

- RESTful API endpoints
- Request validation (Pydantic)
- Persona-based advice generation
- Matrix-themed Swagger UI
- Markdown documentation rendering

**Endpoints:**

- `GET /` - API information
- `POST /consult` - Consult council
- `POST /audit` - Constitutional audit
- `GET /docs` - Swagger UI (Matrix theme)
- `GET /readme` - Rendered documentation

---

### 4. Gemini Adapter (`engine/src/adapter.py`)

**Responsibilities:**

- Load persona instructions
- Call Google Gemini API
- Handle errors and timeouts
- Return persona-specific advice

**Key Features:**

- Async/await for non-blocking calls
- 30-second timeout protection
- Error fallback mechanisms
- Environment variable configuration

---

## [DATA] Data Flow Example

**User Input:**

```
@hummbl Ask Machiavelli how to handle an insubordinate employee
```

**Step-by-Step Transformation:**

1. **VS Code Chat:**
   - Raw text: `"Ask Machiavelli how to handle an insubordinate employee"`

2. **Intent Extraction (GPT-4):**
   - Extracted: `{"member": "machiavelli", "topic": "how to handle an insubordinate employee"}`

3. **MCP Request:**

   ```json
   {
     "name": "consult_council",
     "arguments": {
       "member": "machiavelli",
       "topic": "how to handle an insubordinate employee"
     }
   }
   ```

4. **HTTP Request to Engine:**

   ```http
   POST http://localhost:8080/consult
   Content-Type: application/json

   {
     "topic": "how to handle an insubordinate employee",
     "member": "machiavelli"
   }
   ```

5. **FastAPI Validation:**
   - Pydantic validates `member` is in enum: ✓
   - Pydantic validates `topic` is string: ✓

6. **Gemini API Call:**

   ```python
   prompt = """
   You are Niccolò Machiavelli, the Renaissance political philosopher.
   [Machiavelli persona instructions...]

   The user is asking about: how to handle an insubordinate employee

   Provide strategic advice in the style of this council member...
   """

   response = model.generate_content(prompt)
   ```

7. **Gemini Response:**

   ```
   "It is better to be feared than loved, if you cannot be both.
   An insubordinate employee challenges your authority—this is a test
   of your leadership. Act decisively, but ensure your actions appear
   just and necessary, not arbitrary. The punishment must fit the
   offense, and it must be swift enough to prevent others from
   following suit."
   ```

8. **Final Response Chain:**
   - FastAPI: `{"member": "machiavelli", "advice": "..."}`
   - MCP Server: `{content: [{type: "text", text: "..."}]}`
   - Extension: Extracts text from MCP response
   - VS Code: Displays in chat panel

---

## [KEY] Key Technologies

### Model Context Protocol (MCP)

- **Purpose:** Standard protocol for AI tools and data sources
- **Transport:** stdio (standard input/output)
- **Format:** JSON-RPC-like messages
- **Use Case:** Bridge between VS Code and external services

### vscode.lm API

- **Purpose:** Access to language models within VS Code
- **Provider:** Uses Copilot's GPT-4 model
- **Use Case:** Intent extraction, natural language understanding

### FastAPI

- **Purpose:** Modern Python web framework
- **Features:** Automatic OpenAPI docs, Pydantic validation, async support
- **Use Case:** RESTful API for council consultation

### Google Gemini API

- **Purpose:** Large language model for generating advice
- **Model:** `gemini-2.5-pro`
- **Use Case:** Persona-specific advice generation

---

## [ERROR] Error Handling & Fallbacks

### Level 1: Intent Extraction Failure

- **Error:** JSON parsing fails
- **Fallback:** Use `sun_tzu` as default member, original prompt as topic

### Level 2: Invalid Member

- **Error:** Member not in enum
- **Fallback:** Default to `sun_tzu`

### Level 3: MCP Communication Failure

- **Error:** MCP server not responding
- **Fallback:** Try direct HTTP call to engine (if implemented)

### Level 4: Engine API Failure

- **Error:** FastAPI endpoint error
- **Fallback:** Return error message in chat

### Level 5: Gemini API Failure

- **Error:** API timeout or network error
- **Fallback:** Return template advice: `"Regarding {topic}, {member} advises: Consider the strategic implications carefully..."`

---

## [CONFIG] Configuration

### Environment Variables

**Extension (MCP Server):**

- `HUMMBL_ENGINE_URL` - Engine URL (default: `http://localhost:8080`)

**Engine:**

- `GOOGLE_API_KEY` - Gemini API key (required)
- `LOG_LEVEL` - Logging level (optional)
- `HOST` - Server host (default: `0.0.0.0`)
- `PORT` - Server port (default: `8000`, but code uses `8080`)

### Files

**`.env` (engine/.env):**

```bash
GOOGLE_API_KEY=your_api_key_here
```

**`package.json` (extension/package.json):**

- Defines chat participant: `hummbl.chat`
- Activation event: `onStartupFinished`

---

## [TEST] Testing the Interface

### 1. Start the Engine

```bash
cd engine
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```

### 2. Test Direct API Call

```bash
curl -X POST http://127.0.0.1:8080/consult \
  -H "Content-Type: application/json" \
  -d '{"topic": "test", "member": "sun_tzu"}'
```

### 3. Test in VS Code

1. Press `F5` to launch Extension Development Host
2. Open Chat panel
3. Type: `@hummbl I need strategic advice`
4. Check response

### 4. Monitor Logs

- **Engine:** Check terminal running uvicorn
- **Extension:** Check VS Code Developer Tools console
- **MCP Server:** Check extension output channel

---

## [SUMMARY] Summary

**The interface works through a multi-layer architecture:**

1. **VS Code Chat** → User types `@hummbl [question]`
2. **Intent Extraction** → GPT-4 extracts `{member, topic}` from natural language
3. **MCP Protocol** → Extension communicates with MCP server via IPC
4. **HTTP Bridge** → MCP server makes HTTP request to FastAPI engine
5. **Gemini API** → Engine calls Google Gemini with persona instructions
6. **Response Chain** → Advice flows back through all layers to VS Code chat

**Key Innovation:**

- **Dynamic Routing:** No need to remember syntax like `/consult member:sun_tzu topic:strategy`
- **Natural Language:** Just ask naturally: "I'm overwhelmed, what should I do?"
- **Intelligent Defaults:** System routes to appropriate council member automatically

**The "Sovereign" Part:**

- You own the engine (Python code)
- You own the extension (TypeScript code)
- You own the rules (Constitution)
- You control the personas (adapter.py)
- You control the LLM (Gemini API key)

The AI serves you, but your Constitution and personas govern its behavior.

---

_This is how the interface actually works._
