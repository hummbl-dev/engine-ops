# VS Code Extension Setup Guide

**Step-by-step instructions to get the extension working**

---

## [STEP] Step-by-Step Setup

### Prerequisites

- [x] Engine is running (verified ✓)
- [x] Extension is built (verified ✓)
- [ ] VS Code with Extension Development Host

---

## [1] Launch Extension in VS Code

### Option A: Extension Development Host (Recommended)

1. **Open the extension folder in VS Code:**

   ```bash
   code /Users/others/.gemini/antigravity/scratch/engine-ops/extension
   ```

2. **Press `F5`** (or `Cmd+F5` on Mac)
   - This launches "Extension Development Host"
   - A new VS Code window opens
   - This is where you test the extension

3. **In the NEW window**, open the Chat panel:
   - Press `Cmd+L` (Mac) or `Ctrl+L` (Windows/Linux)
   - Or: View → Chat

4. **Type `@hummbl`** in the chat
   - Should autocomplete
   - Should show "HUMMBL Chat" as option

5. **Ask a question:**
   ```
   @hummbl I'm feeling overwhelmed. What should I do?
   ```

---

### Option B: Install Extension Locally

1. **Package the extension:**

   ```bash
   cd extension
   npm install -g vsce  # If not installed
   vsce package
   ```

   This creates a `.vsix` file

2. **Install in VS Code:**
   - Open VS Code
   - Extensions view (`Cmd+Shift+X`)
   - Click "..." menu → "Install from VSIX..."
   - Select the `.vsix` file

3. **Reload VS Code:**
   - Press `Cmd+Shift+P` → "Developer: Reload Window"

4. **Test in Chat:**
   - Open Chat panel
   - Type `@hummbl`

---

## [2] Verify Extension is Active

### Check Output Panel

1. Open Output panel: `Cmd+Shift+U` (Mac) or `Ctrl+Shift+U` (Windows/Linux)

2. Select "HUMMBL Engine MCP" from dropdown

3. **You should see:**
   ```
   [INFO] Starting language server...
   [INFO] MCP server started
   ```

**If you see errors:**

- Check the error message
- Common: "Cannot find module" → Extension not built
- Common: "MCP server failed" → Check server/index.js exists

---

## [3] Test the Chat Interface

### Test Case 1: Explicit Member

```
@hummbl Ask machiavelli about leadership
```

**Expected:**

- Routes to Machiavelli
- Returns Machiavelli-style advice

### Test Case 2: Implicit Routing

```
@hummbl I'm feeling overwhelmed by chaos
```

**Expected:**

- Routes to Marcus Aurelius (Stoicism)
- Returns Stoic advice

### Test Case 3: Default

```
@hummbl What's the best strategy?
```

**Expected:**

- Routes to Sun Tzu (default)
- Returns strategic advice

---

## [4] Common Issues & Fixes

### Issue: `@hummbl` doesn't appear

**Fix 1: Check Extension is Loaded**

- Open Extensions view
- Search for "HUMMBL" or "engine-ops"
- Should show as installed

**Fix 2: Reload Window**

- `Cmd+Shift+P` → "Developer: Reload Window"

**Fix 3: Check Activation**

- Output → "Log (Extension Host)"
- Look for "HUMMBL Engine MCP" activation

**Fix 4: Rebuild Extension**

```bash
cd extension
npm run build
```

Then reload VS Code window

---

### Issue: Chat responds but with errors

**Check Developer Console:**

1. `Cmd+Shift+P` → "Developer: Toggle Developer Tools"
2. Check Console tab for errors

**Common Errors:**

**"vscode.lm.selectChatModels failed"**

- **Cause:** Copilot not enabled or not available
- **Fix:** Enable GitHub Copilot in VS Code settings

**"tools/call failed"**

- **Cause:** MCP server not connecting to engine
- **Fix:** Check engine is running: `curl http://127.0.0.1:8080/`

**"GOOGLE_API_KEY not set"**

- **Cause:** API key missing
- **Fix:** Create `engine/.env` with `GOOGLE_API_KEY=your_key`

---

### Issue: Extension activates but chat doesn't work

**Check MCP Server:**

1. Output → "HUMMBL Engine MCP"
2. Should see "MCP server started"
3. Should see tool registration: "consult_council"

**If not:**

- Check `dist/server/index.js` exists
- Rebuild: `cd extension && npm run build`

**Check Engine Connection:**

```bash
curl http://127.0.0.1:8080/
```

Should return JSON with endpoints

---

## [5] Debug Mode

### Enable Verbose Logging

1. **Open VS Code Settings:**
   - `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux)

2. **Search for:** "trace"

3. **Set:** `"languageServerExample.trace.server": "verbose"`

4. **Check Output:**
   - Output → "HUMMBL Engine MCP"
   - Should show detailed MCP protocol messages

---

## [6] Manual Testing

### Test Engine Directly

```bash
curl -X POST http://127.0.0.1:8080/consult \
  -H "Content-Type: application/json" \
  -d '{"topic": "test", "member": "sun_tzu"}'
```

**Expected:** JSON with `member` and `advice`

### Test MCP Server Module

```bash
cd extension
node -e "require('./dist/server/index.js'); console.log('OK');"
```

**Expected:** "OK" (no errors)

### Test Extension Module

```bash
cd extension
node -e "require('./dist/extension.js'); console.log('OK');"
```

**Note:** This may fail because it requires VS Code API, but should not crash immediately.

---

## [7] Complete Test Sequence

Run these in order:

```bash
# 1. Engine running?
curl http://127.0.0.1:8080/

# 2. Consult endpoint works?
curl -X POST http://127.0.0.1:8080/consult \
  -H "Content-Type: application/json" \
  -d '{"topic": "test", "member": "sun_tzu"}'

# 3. Extension built?
ls extension/dist/extension.js extension/dist/server/index.js

# 4. Dependencies installed?
cd extension && npm list @modelcontextprotocol/sdk

# 5. MCP server module loads?
node -e "require('./dist/server/index.js'); console.log('OK');"
```

**If all pass:** Extension should work in VS Code  
**If any fail:** Fix that issue first

---

## [HELP] Still Not Working?

### Get Detailed Error Information

1. **Open Developer Tools:**
   - `Cmd+Shift+P` → "Developer: Toggle Developer Tools"

2. **Check Console Tab:**
   - Look for red error messages
   - Copy the full error text

3. **Check Output Panel:**
   - Output → "HUMMBL Engine MCP"
   - Output → "Log (Extension Host)"
   - Copy any error messages

4. **Check Engine Logs:**
   - Terminal running uvicorn
   - Look for Python errors

### What to Report

When asking for help, include:

1. **What you tried:** "I typed @hummbl in chat"
2. **What happened:** "Nothing appeared" or "Error: ..."
3. **Error messages:** Copy from Console/Output
4. **VS Code version:** Help → About
5. **Extension version:** Check package.json

---

## [QUICK] Quick Fix Checklist

If nothing works, try this order:

- [ ] **Engine running?** `curl http://127.0.0.1:8080/`
- [ ] **Extension built?** `cd extension && npm run build`
- [ ] **Dependencies installed?** `cd extension && npm install`
- [ ] **VS Code reloaded?** `Cmd+Shift+P` → "Reload Window"
- [ ] **Extension activated?** Check Output → "Log (Extension Host)"
- [ ] **MCP server started?** Check Output → "HUMMBL Engine MCP"
- [ ] **Copilot enabled?** Settings → GitHub Copilot
- [ ] **Chat panel open?** `Cmd+L` to open chat

---

_If you're still stuck, check the error messages in Developer Tools Console and Output panel._
