#!/usr/bin/env bash
set -euo pipefail

# apply-license-headers.sh
# Applies appropriate license headers to source files based on directory location
# BSL: core/, schemas/, docs/
# Apache 2.0: public/, infra/

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BSL_HEADER="${SCRIPT_DIR}/license-headers/BSL_HEADER.txt"
APACHE_HEADER="${SCRIPT_DIR}/license-headers/APACHE_HEADER.txt"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Usage information
usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Apply license headers to source files based on directory location.

Options:
  -c, --check     Check mode: verify headers without modifying files
  -h, --help      Display this help message
  -v, --verbose   Verbose output

Directory Licensing:
  BSL (Business Source License):    core/, schemas/, docs/
  Apache 2.0:                        public/, infra/
EOF
  exit 0
}

# Parse command line arguments
CHECK_MODE=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
  case $1 in
    -c|--check)
      CHECK_MODE=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      ;;
  esac
done

# Supported file extensions
FILE_PATTERNS=(
  "*.ts"
  "*.js"
  "*.tsx"
  "*.jsx"
  "*.py"
  "*.sh"
  "*.bash"
  "*.go"
  "*.java"
  "*.rs"
  "*.c"
  "*.cpp"
  "*.h"
  "*.hpp"
)

# Function to get comment style for file extension
get_comment_style() {
  local file="$1"
  local ext="${file##*.}"
  
  case "$ext" in
    ts|js|tsx|jsx|go|java|rs|c|cpp|h|hpp)
      echo "c_style"
      ;;
    py|sh|bash)
      echo "hash"
      ;;
    *)
      echo "unknown"
      ;;
  esac
}

# Function to format header with appropriate comment style
format_header() {
  local header_file="$1"
  local comment_style="$2"
  
  case "$comment_style" in
    c_style)
      echo "/*"
      cat "$header_file" | sed 's/^/ * /'
      echo " */"
      ;;
    hash)
      cat "$header_file" | sed 's/^/# /'
      ;;
    *)
      return 1
      ;;
  esac
}

# Function to check if file has license header
has_license_header() {
  local file="$1"
  # Check for both Copyright and License terms in first 20 lines
  if head -n 20 "$file" | grep -qi "Copyright" && \
     head -n 20 "$file" | grep -qi "License"; then
    return 0
  else
    return 1
  fi
}

# Function to apply header to file
apply_header() {
  local file="$1"
  local header_file="$2"
  local comment_style="$3"
  
  if [[ "$CHECK_MODE" == true ]]; then
    if ! has_license_header "$file"; then
      echo -e "${YELLOW}Missing header: $file${NC}"
      return 1
    fi
  else
    if ! has_license_header "$file"; then
      local formatted_header
      formatted_header=$(format_header "$header_file" "$comment_style")
      
      # Create temporary file with header + original content
      local tmp_file
      tmp_file=$(mktemp "${file}.XXXXXX")
      echo "$formatted_header" > "$tmp_file"
      echo "" >> "$tmp_file"
      cat "$file" >> "$tmp_file"
      mv "$tmp_file" "$file"
      
      if [[ "$VERBOSE" == true ]]; then
        echo -e "${GREEN}Added header: $file${NC}"
      fi
    else
      if [[ "$VERBOSE" == true ]]; then
        echo -e "Already has header: $file"
      fi
    fi
  fi
  return 0
}

# Function to process files in directory
process_directory() {
  local dir="$1"
  local header_file="$2"
  local dir_name="$(basename "$dir")"
  
  echo -e "${GREEN}Processing $dir_name/ (using $(basename "$header_file"))...${NC}"
  
  local file_count=0
  local missing_count=0
  
  for pattern in "${FILE_PATTERNS[@]}"; do
    while IFS= read -r -d '' file; do
      ((file_count++))
      
      local comment_style
      comment_style=$(get_comment_style "$file")
      
      if [[ "$comment_style" == "unknown" ]]; then
        if [[ "$VERBOSE" == true ]]; then
          echo -e "${YELLOW}Skipping unknown file type: $file${NC}"
        fi
        continue
      fi
      
      if ! apply_header "$file" "$header_file" "$comment_style"; then
        ((missing_count++))
      fi
    done < <(find "$dir" -type f -name "$pattern" -print0 2>/dev/null)
  done
  
  if [[ "$CHECK_MODE" == true ]] && [[ $missing_count -gt 0 ]]; then
    echo -e "${RED}Found $missing_count files without headers in $dir_name/${NC}"
    return 1
  elif [[ $file_count -gt 0 ]]; then
    echo -e "${GREEN}Processed $file_count files in $dir_name/${NC}"
  fi
  
  return 0
}

# Main execution
cd "$REPO_ROOT"

echo "Engine-Ops License Header Application"
echo "======================================"
echo ""

if [[ "$CHECK_MODE" == true ]]; then
  echo -e "${YELLOW}Running in CHECK mode - no files will be modified${NC}"
  echo ""
fi

EXIT_CODE=0

# Process BSL directories
for dir in core schemas docs; do
  if [[ -d "$dir" ]]; then
    if ! process_directory "$dir" "$BSL_HEADER"; then
      EXIT_CODE=1
    fi
  fi
done

# Process Apache 2.0 directories
for dir in public infra; do
  if [[ -d "$dir" ]]; then
    if ! process_directory "$dir" "$APACHE_HEADER"; then
      EXIT_CODE=1
    fi
  fi
done

echo ""
if [[ $EXIT_CODE -eq 0 ]]; then
  echo -e "${GREEN}✓ License header application completed successfully${NC}"
else
  echo -e "${RED}✗ Some files are missing license headers${NC}"
fi

exit $EXIT_CODE
