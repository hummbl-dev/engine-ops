# HUMMBL Sovereign Intelligence Platform - User Guide

**Version:** 1.0.0  
**Status:** Production Ready  
**Theme:** Matrix-Style Developer Interface

---

## [*] What Is This?

The **HUMMBL Sovereign Intelligence Platform** is a decoupled AI system that gives you complete control over your AI interactions. Instead of feeding prompts into a black box, you own:

- **The Brain** (Python Engine) - Your AI logic and personas
- **The Interface** (VS Code Extension) - How you interact with AI
- **The Rules** (Constitution) - Your governance and safety rails

### Key Features

[OK] **Sovereign Council** - Consult expert personas (Sun Tzu, Marcus Aurelius, Machiavelli)  
[OK] **Dynamic Intent Routing** - Natural language automatically routes to the right advisor  
[OK] **Real LLM Integration** - Powered by Google Gemini for actual strategic advice  
[OK] **Matrix-Themed UI** - Raw hacker aesthetic for developer tools  
[OK] **Constitutional Auditing** - Your rules govern AI behavior  
[OK] **VS Code Integration** - Seamless chat interface via `@hummbl`

---

## [BUILD] System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    YOU (The Sovereign)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                                 │
┌───────▼────────┐              ┌────────▼────────┐
│ VS Code        │              │  Browser/API    │
│ Extension      │              │  (Swagger UI)    │
│ (@hummbl chat) │              │  (Matrix Theme) │
└───────┬────────┘              └────────┬────────┘
        │                                 │
        └───────────────┬─────────────────┘
                        │
                ┌───────▼────────┐
                │  Python Engine  │
                │  (FastAPI)      │
                │  Port: 8080     │
                └───────┬─────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌────────▼────────┐
│  Adapter       │            │  Constitution   │
│  (Gemini API)  │            │  (Your Rules)   │
└────────────────┘            └─────────────────┘
```

### Components

1. **Engine** (`engine/`) - Python FastAPI server
   - Handles API requests
   - Routes to council members
   - Generates advice via Gemini
   - Enforces constitutional rules

2. **Extension** (`extension/`) - VS Code extension
   - Chat interface (`@hummbl`)
   - Intent parsing (extracts member + topic)
   - MCP communication with engine

3. **UI** - Matrix-themed Swagger interface
   - Interactive API documentation
   - Terminal-style aesthetic
   - Theme controls and shortcuts

---

## [>] Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+ (for VS Code extension)
- Google Gemini API key
- VS Code (for extension)

### Step 1: Clone and Setup

```bash
git clone <repository-url>
cd engine-ops
```

### Step 2: Configure the Engine

```bash
cd engine

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your API key
# GOOGLE_API_KEY=your_actual_api_key_here
```

### Step 3: Start the Engine

```bash
# From engine/ directory
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8080
```

### Step 4: Access the Matrix UI

Open your browser:
```
http://localhost:8080/docs
```

You'll see the Matrix-themed Swagger UI with:
- **THEME** button (top-right) - Toggle intensity (Subtle/Medium/Intense)
- **SHORTCUTS** button - View keyboard shortcuts
- **TERMINAL** button - Open terminal interface

### Step 5: Test the API

In the Swagger UI:
1. Click **POST /consult**
2. Click **"Try it out"**
3. Enter:
   ```json
   {
     "topic": "How should I handle team burnout?",
     "member": "marcus_aurelius"
   }
   ```
4. Click **Execute**

You should receive strategic advice from Marcus Aurelius!

---

## [CHAT] Using the VS Code Extension

### Installation

1. Open VS Code
2. Press `F5` to open Extension Development Host
3. Or build and install from `extension/` directory

### Usage

1. Open the Chat panel in VS Code
2. Type `@hummbl` to activate the extension
3. Ask questions naturally:

**Examples:**

```
@hummbl I'm feeling overwhelmed by chaos. What should I do?
→ Routes to Marcus Aurelius (Stoicism)

@hummbl Ask Machiavelli how to handle an insubordinate employee
→ Routes to Machiavelli (Power dynamics)

@hummbl What's the best strategy for a difficult project?
→ Routes to Sun Tzu (default, strategic thinking)
```

### How It Works

1. **Intent Parsing**: The extension uses `vscode.lm` to extract:
   - `topic` - What you're asking about
   - `member` - Which council member to consult (defaults to `sun_tzu`)

2. **Routing**: Sends request to Engine at `http://localhost:8080/consult`

3. **Generation**: Engine calls Gemini API with persona-specific instructions

4. **Response**: Returns advice in the council member's style

---

## [MASK] The Sovereign Council

### Available Members

| Member | Focus | Best For |
|--------|-------|----------|
| **sun_tzu** | Military strategy, terrain, timing, deception | Strategic planning, competitive situations |
| **marcus_aurelius** | Stoic philosophy, internal control, resilience | Personal challenges, emotional situations |
| **machiavelli** | Power dynamics, reputation, pragmatism | Political situations, leadership challenges |

### Member Selection

The system automatically routes based on your question:

- **Explicit**: "Ask Machiavelli..." → Routes to Machiavelli
- **Implicit**: "I'm overwhelmed..." → Routes to Marcus Aurelius (Stoicism)
- **Default**: General questions → Routes to Sun Tzu

---

## [UI] Matrix UI Features

### Theme Controls

**Top-right corner buttons:**

1. **THEME: [LEVEL]** - Toggle intensity
   - `Subtle` - Minimal glow, better readability
   - `Medium` - Balanced (default)
   - `Intense` - Maximum Matrix effect

2. **SHORTCUTS (?)** - View keyboard shortcuts
   - Press `?` to open
   - Lists all available shortcuts

3. **TERMINAL (~)** - Command interface
   - Press `~` to open
   - Type commands like `help`, `endpoints`, `theme subtle`

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `~` | Toggle Terminal |
| `?` | Show Shortcuts |
| `T` | Toggle Theme |
| `ESC` | Close Modals |
| `CTRL+ENTER` | Execute Request |
| `/` | Focus Search |

### Terminal Commands

Open terminal (`~`) and try:

```bash
> help          # Show available commands
> clear         # Clear terminal
> theme subtle  # Set theme intensity
> endpoints     # List API endpoints
> version       # Show version info
> exit          # Close terminal
```

---

## [API] API Reference

### Base URL

```
http://localhost:8080
```

### Endpoints

#### `GET /`

Root endpoint - Returns API information.

**Response:**
```json
{
  "message": "HUMMBL Sovereign Engine",
  "endpoints": {
    "/consult": "POST - Consult the council",
    "/audit": "POST - Run constitutional audit",
    "/docs": "GET - Interactive API documentation"
  }
}
```

#### `POST /consult`

Consult a council member for advice.

**Request:**
```json
{
  "topic": "How should I handle team burnout?",
  "member": "marcus_aurelius"
}
```

**Valid members:**
- `sun_tzu`
- `marcus_aurelius`
- `machiavelli`

**Response:**
```json
{
  "member": "marcus_aurelius",
  "advice": "You have power over your mind, not outside events. Realize this, and you will find strength. When chaos surrounds you, focus on what you can control: your thoughts, your actions, your response. The team's burnout is not your burden alone—it is a shared challenge that requires shared solutions, not heroic individual sacrifice."
}
```

#### `POST /audit`

Run a constitutional audit on draft text.

**Request:**
```json
{
  "draft_text": "You must implement this solution immediately."
}
```

**Response:**
```json
{
  "passed": false,
  "reason": "Violation of Agency: Prescriptive language detected."
}
```

---

## [TOOL] Configuration

### Environment Variables

Create `engine/.env`:

```bash
# Google Gemini API Key (Required)
GOOGLE_API_KEY=your_api_key_here

# Optional: Server Configuration
LOG_LEVEL=INFO
HOST=0.0.0.0
PORT=8000
```

### Council Members

Edit `engine/src/adapter.py` to modify persona instructions:

```python
PERSONA_INSTRUCTIONS = {
    CouncilMember.sun_tzu: """Your persona instructions here...""",
    # Add more members...
}
```

### Constitutional Rules

Edit `config/constitution.yaml` to modify governance rules.

---

## [*] Use Cases

### 1. Strategic Planning

```
@hummbl What's the best approach for entering a new market?
→ Sun Tzu: "Know your enemy, know yourself..."
```

### 2. Personal Challenges

```
@hummbl I'm struggling with imposter syndrome
→ Marcus Aurelius: "You have power over your mind..."
```

### 3. Leadership Decisions

```
@hummbl How should I handle a difficult team member?
→ Machiavelli: "It is better to be feared than loved..."
```

### 4. API Integration

```python
import requests

response = requests.post(
    "http://localhost:8080/consult",
    json={
        "topic": "How to structure a microservices architecture?",
        "member": "sun_tzu"
    }
)

print(response.json()["advice"])
```

---

## 🐛 Troubleshooting

### Engine Won't Start

**Problem:** `Address already in use`

**Solution:**
```bash
# Find process using port 8080
lsof -ti :8080 | xargs kill -9

# Or use a different port
uvicorn src.main:app --port 8081
```

### API Key Not Working

**Problem:** Getting fallback responses instead of real advice

**Solution:**
1. Check `engine/.env` has `GOOGLE_API_KEY` (not `GOOGLE_AI_API_KEY`)
2. Verify API key is valid
3. Check engine logs for errors

### Extension Not Responding

**Problem:** `@hummbl` doesn't work in VS Code

**Solution:**
1. Ensure engine is running (`http://localhost:8080`)
2. Check extension logs in VS Code Developer Tools
3. Verify MCP connection in extension settings

### Matrix UI Not Loading

**Problem:** Default Swagger UI instead of Matrix theme

**Solution:**
1. Hard refresh browser (`CMD+SHIFT+R` or `CTRL+SHIFT+R`)
2. Check browser console for errors
3. Verify server is using custom `/docs` route

---

## 📚 Advanced Topics

### Adding New Council Members

1. Edit `engine/src/main.py`:
   ```python
   class CouncilMember(str, Enum):
       sun_tzu = "sun_tzu"
       marcus_aurelius = "marcus_aurelius"
       machiavelli = "machiavelli"
       your_member = "your_member"  # Add here
   ```

2. Edit `engine/src/adapter.py`:
   ```python
   PERSONA_INSTRUCTIONS = {
       # ... existing members
       CouncilMember.your_member: """Your persona instructions..."""
   }
   ```

3. Update extension intent parser to recognize new member

### Customizing Matrix Theme

Edit `engine/src/main.py` - the `matrix_css_injection` variable contains all styling. Modify CSS variables:

```css
:root {
    --matrix-green: #00ff41;      /* Change green color */
    --matrix-bg: #000000;         /* Change background */
    --glow-intensity: 1;          /* Adjust glow */
}
```

### Performance Tuning

- **Matrix Rain**: Disable by setting `--rain-opacity: 0;` in CSS
- **Animations**: Reduce `--glow-intensity` for better performance
- **Theme**: Use "Subtle" mode for lower-end devices

---

## 🔐 Security Notes

- **API Keys**: Never commit `.env` files to git
- **Local Only**: Engine runs on `localhost` by default
- **Production**: Use proper authentication for production deployments
- **Constitution**: Review `config/constitution.yaml` for safety rules

---

## [HAND] Getting Help

- **Issues**: Check GitHub issues
- **Documentation**: See `docs/` directory
- **Examples**: Check `examples/` directory (if exists)

---

## [LOG] License & Credits

Built with:
- FastAPI (Python web framework)
- Google Gemini (LLM provider)
- VS Code Extension API
- Model Context Protocol (MCP)

**Remember:** You are the Sovereign. The AI serves you, not the other way around.

---

## [LEARN] Next Steps

1. [OK] Test all three council members
2. [OK] Try the VS Code extension
3. [OK] Explore the Matrix UI features
4. [OK] Customize persona instructions
5. [OK] Add your own council members

**Welcome to Sovereign Intelligence. Own your AI.**

