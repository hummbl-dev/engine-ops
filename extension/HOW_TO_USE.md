# How to Use the HUMMBL Extension

## Selecting the Extension in Chat

VS Code chat has multiple participants (Copilot, extensions, etc.). You need to **explicitly select** the HUMMBL extension.

### Method 1: Type `@hummbl` (Recommended)

1. Open Chat (`Cmd+L` or View → Chat)
2. In the chat input box, type: `@hummbl`
3. You should see "HUMMBL Chat" appear as an autocomplete option
4. Press Enter or click it
5. Then type your question: `Ask machiavelli about leadership`

**Full example:**

```
@hummbl Ask machiavelli about leadership
```

### Method 2: Click the Participant Selector

1. Open Chat (`Cmd+L`)
2. Look for a participant selector (usually shows "Copilot" or similar)
3. Click it to see all available participants
4. Select "HUMMBL Chat" or "hummbl.chat"
5. Then type your question

### Method 3: Use the Command Palette

1. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
2. Type: "Chat: Focus Chat Input"
3. Type: `@hummbl` followed by your question

---

## Testing Examples

Once you've selected `@hummbl`, try these:

### Explicit Member Selection

```
@hummbl Ask machiavelli about leadership
```

### Implicit Routing (Extension will pick the member)

```
@hummbl I'm feeling overwhelmed by chaos. What should I do?
```

(Should route to Marcus Aurelius)

### Default (Sun Tzu)

```
@hummbl What's the best strategy for a difficult project?
```

---

## Troubleshooting

### Issue: `@hummbl` doesn't appear

**Check 1: Extension is loaded**

- Open Output panel (`Cmd+Shift+U`)
- Select "Log (Extension Host)" from dropdown
- Look for "HUMMBL" or extension activation messages

**Check 2: Reload VS Code**

- `Cmd+Shift+P` → "Developer: Reload Window"

**Check 3: Extension is built**

```bash
cd extension
npm run build
```

### Issue: Chat responds but not from extension

**Solution:** Make sure you typed `@hummbl` at the start. VS Code will use the default participant (Copilot) if you don't specify.

### Issue: Extension selected but no response

**Check 1: Engine is running**

```bash
curl http://127.0.0.1:8080/
```

**Check 2: Check Developer Console**

- `Cmd+Shift+P` → "Developer: Toggle Developer Tools"
- Console tab → Look for `[HUMMBL Extension]` errors

---

## Visual Guide

```
┌─────────────────────────────────────┐
│ Chat Panel                          │
├─────────────────────────────────────┤
│ [Participant: Copilot ▼]  ← Click   │
│                                     │
│ OR type: @hummbl                    │
│                                     │
│ Then type your question...          │
└─────────────────────────────────────┘
```

---

**Remember:** Always start with `@hummbl` to use the extension!
