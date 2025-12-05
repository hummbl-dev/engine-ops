# Quick Test Guide - What Should Happen

## Step-by-Step: What You Should See

### 1. Open Chat in VS Code

- In the Extension Development Host window (the one that opened when you pressed F5)
- Press `Cmd+L` (Mac) or `Ctrl+L` Windows/Linux
- OR: View → Chat

### 2. Type `@hummbl`

- Start typing `@hummbl` in the chat input
- You should see it autocomplete with "HUMMBL Chat"
- Press Enter or click it

### 3. Type Your Question

```
Ask machiavelli about leadership
```

### 4. What Should Happen

**You should see:**

1. The chat shows "Thinking..." or a loading indicator
2. After a few seconds, you get a response
3. The response should be advice about leadership in Machiavelli's style

**Example of what you might see:**

```
In matters of leadership, consider that it is better to be feared than loved, if one cannot be both. A leader must maintain their reputation through decisive action, for hesitation is seen as weakness. However, the appearance of virtue is often more important than virtue itself.
```

---

## If It's NOT Working

### Check 1: Is the extension loaded?

- Look at the bottom-right of VS Code
- Should see "HUMMBL Engine MCP" or similar
- If not, check Output panel → "HUMMBL Engine MCP"

### Check 2: Is the engine running?

Open a terminal and run:

```bash
curl http://127.0.0.1:8080/
```

**Should see:** JSON with endpoints listed

### Check 3: Check for errors

1. Open Output panel (`Cmd+Shift+U`)
2. Select "HUMMBL Engine MCP" from dropdown
3. Look for error messages (red text)

### Check 4: Check Developer Console

1. `Cmd+Shift+P` → "Developer: Toggle Developer Tools"
2. Click "Console" tab
3. Look for red error messages

---

## Common Issues

### Issue: `@hummbl` doesn't appear

**Fix:** Reload VS Code window (`Cmd+Shift+P` → "Developer: Reload Window")

### Issue: Chat says "Error" or nothing happens

**Fix:** Check Output panel for error messages

### Issue: "Engine not responding"

**Fix:** Make sure engine is running:

```bash
cd engine
source venv/bin/activate
uvicorn src.main:app --host 0.0.0.0 --port 8080 --reload
```

---

## What Each Part Does

1. **You type `@hummbl Ask machiavelli about leadership`**
   - VS Code recognizes `@hummbl` as your extension

2. **Extension extracts intent**
   - Uses GPT-4 (via `vscode.lm`) to figure out:
     - Member: `machiavelli`
     - Topic: `leadership`

3. **Extension calls MCP server**
   - Sends `{member: "machiavelli", topic: "leadership"}` to MCP server

4. **MCP server calls engine**
   - Makes HTTP request to `http://localhost:8080/consult`
   - Sends the member and topic

5. **Engine calls Gemini**
   - Uses Machiavelli's persona instructions
   - Generates advice about leadership

6. **Response flows back**
   - Engine → MCP server → Extension → VS Code Chat
   - You see the advice!

---

## Still Confused?

**Tell me:**

1. What do you see when you type `@hummbl`?
2. What happens when you send a message?
3. Any error messages?
4. Is the engine running? (check terminal)
