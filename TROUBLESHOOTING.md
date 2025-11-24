# Troubleshooting Guide

**Common Issues and Solutions**

---

## [X] Issue: Extension Not Working in VS Code

### Symptoms
- `@hummbl` doesn't appear in chat
- Chat participant not found
- Extension doesn't activate

### Solutions

#### 1. Check Extension is Built
```bash
cd extension
npm run build
```

**Verify:**
- `dist/extension.js` exists
- `dist/server/index.js` exists

#### 2. Check VS Code Developer Console
1. Open VS Code
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type: "Developer: Toggle Developer Tools"
4. Check Console tab for errors

**Common Errors:**
- `Cannot find module` → Extension not built
- `MCP server failed to start` → Check server/index.js exists
- `LanguageClient failed` → Check MCP server is running

#### 3. Check Extension Activation
- Extension activates on `onStartupFinished`
- Should see "HUMMBL Engine MCP" in Output panel
- Check Output → "HUMMBL Engine MCP" channel

#### 4. Rebuild Extension
```bash
cd extension
rm -rf dist node_modules
npm install
npm run build
```

---

## [X] Issue: MCP Server Not Connecting

### Symptoms
- Extension activates but chat doesn't work
- Error: "MCP server failed to start"
- Error: "tools/call failed"

### Solutions

#### 1. Check Server Module Exists
```bash
ls -la extension/dist/server/index.js
```

**If missing:**
```bash
cd extension
npm run build
```

#### 2. Check Node.js Version
```bash
node --version
# Should be Node.js 18+ or 20+
```

#### 3. Check Dependencies
```bash
cd extension
npm install
```

#### 4. Test Server Module Directly
```bash
cd extension
node -e "require('./dist/server/index.js'); console.log('OK');"
```

**If error:** Check the error message and fix the issue.

---

## [X] Issue: Engine Not Responding

### Symptoms
- Chat works but no response
- Error: "Failed to consult council"
- Timeout errors

### Solutions

#### 1. Check Engine is Running
```bash
curl http://127.0.0.1:8080/
```

**Expected:** JSON response with endpoints

**If fails:**
```bash
cd engine
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```

#### 2. Check Port 8080 is Available
```bash
lsof -ti :8080
# If returns PID, port is in use
# Kill with: lsof -ti :8080 | xargs kill -9
```

#### 3. Test Engine Directly
```bash
curl -X POST http://127.0.0.1:8080/consult \
  -H "Content-Type: application/json" \
  -d '{"topic": "test", "member": "sun_tzu"}'
```

**Expected:** JSON with `member` and `advice` fields

#### 4. Check Engine Logs
- Look at terminal running uvicorn
- Check for Python errors
- Check for API key errors

---

## [X] Issue: Gemini API Errors

### Symptoms
- Engine responds but advice is generic/fallback
- Error: "GOOGLE_API_KEY not set"
- Error: "Gemini API call failed"

### Solutions

#### 1. Check .env File Exists
```bash
ls -la engine/.env
```

**If missing:**
```bash
cd engine
echo "GOOGLE_API_KEY=your_key_here" > .env
```

#### 2. Check API Key is Valid
```bash
cd engine
source venv/bin/activate
python3 << 'EOF'
import os
from dotenv import load_dotenv
load_dotenv()
key = os.getenv('GOOGLE_API_KEY')
if key:
    print(f"API key found: {key[:10]}...")
else:
    print("API key NOT found!")
EOF
```

#### 3. Test Gemini API Directly
```bash
cd engine
source venv/bin/activate
python3 << 'EOF'
import os
import google.generativeai as genai
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    print("ERROR: GOOGLE_API_KEY not set")
    exit(1)

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.5-pro')
response = model.generate_content("Say hello")
print("SUCCESS:", response.text)
EOF
```

#### 4. Check API Key Format
- Should start with `AIza...`
- No spaces or quotes
- Full key (not truncated)

---

## [X] Issue: Intent Extraction Failing

### Symptoms
- Chat responds but wrong council member
- Always defaults to Sun Tzu
- JSON parsing errors

### Solutions

#### 1. Check vscode.lm is Available
- Requires VS Code with Copilot enabled
- Check: Settings → GitHub Copilot → Enabled

#### 2. Check Intent Extraction Logs
- Open VS Code Developer Console
- Look for JSON parsing errors
- Check extracted `{member, topic}` values

#### 3. Test with Explicit Member
Try: `@hummbl Ask machiavelli about leadership`

**Expected:** Routes to Machiavelli

#### 4. Check Fallback Logic
- If JSON parsing fails → defaults to `sun_tzu`
- If invalid member → defaults to `sun_tzu`
- This is intentional (graceful degradation)

---

## [X] Issue: Chat Participant Not Found

### Symptoms
- `@hummbl` doesn't autocomplete
- Chat participant doesn't appear in list

### Solutions

#### 1. Check package.json
```json
"contributes": {
    "chatParticipants": [
        {
            "id": "hummbl.chat",
            "name": "HUMMBL Chat"
        }
    ]
}
```

#### 2. Reload VS Code Window
- Press `Cmd+Shift+P` → "Developer: Reload Window"
- Or restart VS Code

#### 3. Check Extension is Installed
- Open Extensions view (`Cmd+Shift+X`)
- Search for "HUMMBL" or "engine-ops"
- Should show as installed

#### 4. Check Activation Events
- Extension activates on `onStartupFinished`
- Should activate automatically when VS Code starts
- Check Output → "Log (Extension Host)" for activation

---

## [X] Issue: MCP Protocol Errors

### Symptoms
- Error: "tools/call failed"
- Error: "MCP server connection lost"
- Error: "LanguageClient error"

### Solutions

#### 1. Check MCP Server is Running
- Extension starts MCP server automatically
- Check Output → "HUMMBL Engine MCP" channel
- Should see "MCP server started" message

#### 2. Check IPC Transport
- MCP uses stdio (standard input/output)
- No network required for VS Code ↔ MCP server
- Only HTTP needed for MCP server ↔ Engine

#### 3. Check ENGINE_URL
- Default: `http://localhost:8080`
- Can override with `HUMMBL_ENGINE_URL` env var
- Check MCP server logs for connection errors

#### 4. Restart Extension
- Close VS Code
- Reopen workspace
- Extension should restart automatically

---

## [DEBUG] Debugging Steps

### Step 1: Verify Engine
```bash
# Test engine directly
curl http://127.0.0.1:8080/
curl -X POST http://127.0.0.1:8080/consult \
  -H "Content-Type: application/json" \
  -d '{"topic": "test", "member": "sun_tzu"}'
```

### Step 2: Verify Extension Build
```bash
cd extension
npm run build
ls -la dist/extension.js dist/server/index.js
```

### Step 3: Check VS Code Logs
1. Open Developer Tools (`Cmd+Shift+P` → "Developer: Toggle Developer Tools")
2. Check Console tab for errors
3. Check Output panel → "HUMMBL Engine MCP" channel

### Step 4: Test MCP Server
```bash
cd extension
node -e "
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const server = new McpServer({name: 'test', version: '1.0.0'});
console.log('MCP Server created successfully');
"
```

### Step 5: Test Extension Activation
1. Open VS Code
2. Check Output → "Log (Extension Host)"
3. Look for "HUMMBL Engine MCP" activation message

---

## [CHECK] Quick Checklist

Before reporting issues, verify:

- [ ] Engine is running (`curl http://127.0.0.1:8080/`)
- [ ] Extension is built (`ls extension/dist/extension.js`)
- [ ] Dependencies installed (`cd extension && npm install`)
- [ ] API key set (`cat engine/.env | grep GOOGLE_API_KEY`)
- [ ] VS Code Developer Tools open (check for errors)
- [ ] Extension activated (check Output panel)
- [ ] MCP server started (check Output → "HUMMBL Engine MCP")
- [ ] Chat participant registered (try `@hummbl` in chat)

---

## [HELP] Getting More Help

### Check Logs
1. **Engine Logs:** Terminal running uvicorn
2. **Extension Logs:** VS Code Output panel
3. **MCP Server Logs:** Output → "HUMMBL Engine MCP"
4. **VS Code Logs:** Developer Tools Console

### Common Error Messages

**"Cannot find module './dist/server/index.js'"**
- Solution: Run `npm run build` in extension directory

**"GOOGLE_API_KEY environment variable not set"**
- Solution: Create `engine/.env` with `GOOGLE_API_KEY=your_key`

**"Address already in use"**
- Solution: Kill process on port 8080: `lsof -ti :8080 | xargs kill -9`

**"MCP server failed to start"**
- Solution: Check `dist/server/index.js` exists, rebuild extension

**"tools/call failed"**
- Solution: Check engine is running, check ENGINE_URL is correct

---

## [TEST] Test Everything

Run this complete test:

```bash
# 1. Test engine
curl http://127.0.0.1:8080/

# 2. Test consult endpoint
curl -X POST http://127.0.0.1:8080/consult \
  -H "Content-Type: application/json" \
  -d '{"topic": "test", "member": "sun_tzu"}'

# 3. Check extension build
cd extension
npm run build
ls -la dist/extension.js dist/server/index.js

# 4. Test MCP server module
node -e "require('./dist/server/index.js'); console.log('OK');"
```

**If all pass:** Extension should work in VS Code  
**If any fail:** Fix that issue first

---

*For more help, check the logs and error messages above.*

