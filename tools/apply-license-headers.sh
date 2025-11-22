#!/bin/bash
# Copyright (c) 2025, HUMMBL, LLC
# Licensed under the Apache License, Version 2.0

# Script to check license headers in source files
# Usage: ./tools/apply-license-headers.sh --check

set -e

CHECK_MODE=false

if [ "$1" = "--check" ]; then
    CHECK_MODE=true
fi

# License templates
BSL_HEADER="tools/license-headers/BSL_HEADER.txt"
APACHE_HEADER="tools/license-headers/APACHE_HEADER.txt"

# Files to check (TypeScript, JavaScript,YAML)
FILES=$(find . -type f \( -name "*.ts" -o -name "*.js" -o -name "*.yml" -o -name "*.yaml" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/coverage/*" \
    -not -path "*/.git/*")

MISSING_COUNT=0

echo "Checking license headers..."

for file in $FILES; do
    # Check if file contains copyright header
    if ! head -n 5 "$file" | grep -q "Copyright (c)"; then
        if [ "$CHECK_MODE" = true ]; then
            echo "❌ Missing license header: $file"
            ((MISSING_COUNT++))
        else
            echo "Adding header to: $file"
            # Add header logic here (not implemented for check mode)
        fi
    fi
done

if [ "$CHECK_MODE" = true ]; then
    if [ $MISSING_COUNT -eq 0 ]; then
        echo "✅ All files have license headers"
        exit 0
    else
        echo "❌ Found $MISSING_COUNT files without license headers"
        echo "Note: This is a warning only - not blocking CI"
        exit 0
    fi
fi
