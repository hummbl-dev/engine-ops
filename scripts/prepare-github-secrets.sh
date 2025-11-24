#!/bin/bash
# Helper script to prepare kubeconfig files for GitHub secrets
# Usage: ./scripts/prepare-github-secrets.sh <staging-kubeconfig> <production-kubeconfig>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== GitHub Secrets Preparation Script ===${NC}\n"

# Check if kubeconfig files are provided
STAGING_CONFIG="${1:-}"
PRODUCTION_CONFIG="${2:-}"

# Function to validate kubeconfig
validate_kubeconfig() {
    local config_file="$1"
    local name="$2"
    
    if [ ! -f "$config_file" ]; then
        echo -e "${RED}Error: $name kubeconfig file not found: $config_file${NC}"
        return 1
    fi
    
    # Try to validate with kubectl if available
    if command -v kubectl &> /dev/null; then
        if KUBECONFIG="$config_file" kubectl cluster-info &> /dev/null; then
            echo -e "${GREEN}✓ $name kubeconfig is valid and accessible${NC}"
        else
            echo -e "${YELLOW}⚠ $name kubeconfig file exists but cluster may not be reachable${NC}"
            echo -e "${YELLOW}  (This is OK if cluster requires VPN or is not currently accessible)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ kubectl not found, skipping validation${NC}"
    fi
    
    return 0
}

# Function to encode kubeconfig
encode_kubeconfig() {
    local config_file="$1"
    local output_file="$2"
    local name="$3"
    
    echo -e "${BLUE}Encoding $name kubeconfig...${NC}"
    
    if base64 "$config_file" > "$output_file" 2>/dev/null; then
        echo -e "${GREEN}✓ Encoded to: $output_file${NC}"
        
        # Show first 50 chars for verification
        local preview=$(head -c 50 "$output_file")
        echo -e "${BLUE}Preview (first 50 chars): $preview...${NC}"
        
        # Get file size
        local size=$(wc -c < "$output_file" | tr -d ' ')
        echo -e "${BLUE}Size: $size bytes${NC}"
        
        return 0
    else
        echo -e "${RED}Error: Failed to encode $name kubeconfig${NC}"
        return 1
    fi
}

# Function to copy to clipboard (macOS)
copy_to_clipboard() {
    local file="$1"
    local name="$2"
    
    if command -v pbcopy &> /dev/null; then
        if pbcopy < "$file"; then
            echo -e "${GREEN}✓ Copied $name base64 to clipboard (macOS)${NC}"
            return 0
        fi
    elif command -v xclip &> /dev/null; then
        if xclip -selection clipboard < "$file" 2>/dev/null; then
            echo -e "${GREEN}✓ Copied $name base64 to clipboard (Linux)${NC}"
            return 0
        fi
    fi
    
    echo -e "${YELLOW}⚠ Could not copy to clipboard automatically${NC}"
    echo -e "${YELLOW}  Please manually copy the contents of: $file${NC}"
    return 1
}

# Main execution
OUTPUT_DIR="$PROJECT_ROOT/.github-secrets-prep"
mkdir -p "$OUTPUT_DIR"

echo -e "${BLUE}Output directory: $OUTPUT_DIR${NC}\n"

# Process staging config
if [ -n "$STAGING_CONFIG" ]; then
    if validate_kubeconfig "$STAGING_CONFIG" "Staging"; then
        STAGING_OUTPUT="$OUTPUT_DIR/KUBECONFIG_STAGING.base64"
        if encode_kubeconfig "$STAGING_CONFIG" "$STAGING_OUTPUT" "Staging"; then
            copy_to_clipboard "$STAGING_OUTPUT" "Staging"
            echo ""
        fi
    fi
else
    echo -e "${YELLOW}⚠ Staging kubeconfig not provided${NC}"
    echo -e "${YELLOW}  Usage: $0 <staging-kubeconfig> [production-kubeconfig]${NC}"
    echo ""
fi

# Process production config
if [ -n "$PRODUCTION_CONFIG" ]; then
    if validate_kubeconfig "$PRODUCTION_CONFIG" "Production"; then
        PRODUCTION_OUTPUT="$OUTPUT_DIR/KUBECONFIG_PRODUCTION.base64"
        if encode_kubeconfig "$PRODUCTION_CONFIG" "$PRODUCTION_OUTPUT" "Production"; then
            copy_to_clipboard "$PRODUCTION_OUTPUT" "Production"
            echo ""
        fi
    fi
else
    echo -e "${YELLOW}⚠ Production kubeconfig not provided${NC}"
    echo -e "${YELLOW}  Usage: $0 <staging-kubeconfig> [production-kubeconfig]${NC}"
    echo ""
fi

# Summary
echo -e "${BLUE}=== Summary ===${NC}"
echo -e "${BLUE}Encoded files saved to: $OUTPUT_DIR${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Go to: https://github.com/hummbl-dev/engine-ops/settings/secrets/actions"
echo "2. Click 'New repository secret'"
echo "3. For each secret:"
echo "   - Name: KUBECONFIG_STAGING (or KUBECONFIG_PRODUCTION)"
echo "   - Value: Paste the base64 content from the .base64 files"
echo "   - Click 'Add secret'"
echo ""
echo -e "${YELLOW}Note: The .base64 files contain sensitive data. Delete them after adding to GitHub.${NC}"
echo -e "${YELLOW}You can run: rm -rf $OUTPUT_DIR${NC}"

