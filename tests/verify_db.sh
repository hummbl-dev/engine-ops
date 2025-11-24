#!/bin/bash
echo "Verifying Cortex Integrity..."
if [ -f "cortex/memory.db" ]; then
    echo "[OK] Memory Core detected."
    sqlite3 cortex/memory.db "PRAGMA integrity_check;"
else
    echo "[CRITICAL] Memory Core missing!"
    exit 1
fi
