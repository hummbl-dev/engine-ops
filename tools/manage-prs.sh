#!/bin/bash

# Fetch all open PRs
prs=$(gh pr list --state open --limit 100 --json number,title)

# Loop through each PR
echo "$prs" | jq -c '.[]' | while read -r pr; do
    number=$(echo "$pr" | jq -r '.number')
    title=$(echo "$pr" | jq -r '.title')
    
    labels=""
    
    # Determine labels based on title
    if [[ "$title" == *"chore(deps)"* ]]; then
        labels="dependencies,infra"
    elif [[ "$title" == *"orchestration"* ]] || [[ "$title" == *"scheduling"* ]]; then
        labels="feature,core"
    elif [[ "$title" == *"secrets"* ]] || [[ "$title" == *"security"* ]]; then
        labels="feature,security,infra"
    elif [[ "$title" == *"agent"* ]]; then
        labels="feature,core"
    elif [[ "$title" == *"test"* ]] || [[ "$title" == *"ci"* ]]; then
        labels="ci"
    else
        labels="feature"
    fi
    
    echo "Processing PR #$number: $title"
    
    # Create labels if they don't exist (ignore errors if they do)
    IFS=',' read -ra LABEL_ARRAY <<< "$labels"
    for label in "${LABEL_ARRAY[@]}"; do
        gh label create "$label" --color "0E8A16" --force >/dev/null 2>&1 || true
    done
    
    echo "  Applying labels: $labels"
    
    # Apply labels
    gh pr edit "$number" --add-label "$labels"
    
    # Mark as ready if draft
    gh pr ready "$number" >/dev/null 2>&1 || true
    
    # Merge PR
    echo "  Merging..."
    # Try merging immediately, fall back to auto if needed, or just report error
    gh pr merge "$number" --merge || gh pr merge "$number" --merge --auto || echo "  Failed to merge PR #$number"
    
    echo "--------------------------------------------------"
done
