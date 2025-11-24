# Helper Scripts

## prepare-github-secrets.sh

Prepares kubeconfig files for GitHub secrets by encoding them to base64.

### Usage

```bash
# Prepare both staging and production
./scripts/prepare-github-secrets.sh staging-kubeconfig.yaml production-kubeconfig.yaml

# Prepare only staging
./scripts/prepare-github-secrets.sh staging-kubeconfig.yaml

# Prepare only production (provide empty string for staging)
./scripts/prepare-github-secrets.sh "" production-kubeconfig.yaml
```

### What it does

1. Validates kubeconfig files exist
2. Optionally validates cluster connectivity (if kubectl available)
3. Encodes kubeconfig to base64
4. Saves encoded files to `.github-secrets-prep/`
5. Attempts to copy to clipboard (macOS/Linux)
6. Provides instructions for adding to GitHub

### Output

- `KUBECONFIG_STAGING.base64` - Base64-encoded staging kubeconfig
- `KUBECONFIG_PRODUCTION.base64` - Base64-encoded production kubeconfig

### Security Note

The `.github-secrets-prep/` directory contains sensitive data. Delete it after adding secrets to GitHub:

```bash
rm -rf .github-secrets-prep
```

