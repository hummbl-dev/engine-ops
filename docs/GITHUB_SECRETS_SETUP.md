# GitHub Secrets Setup Guide

**Purpose:** Configure Kubernetes cluster access for deployment workflows

---

## Required Secrets

You need to create **2 secrets** in GitHub:

1. `KUBECONFIG_STAGING` - For staging environment deployments
2. `KUBECONFIG_PRODUCTION` - For production environment deployments

---

## Step 1: Get Your Kubeconfig Files

### Option A: If you already have kubeconfig files

If you have existing kubeconfig files for your staging and production clusters:

**Staging:**

```bash
# Copy your staging kubeconfig
cp ~/.kube/config-staging staging-kubeconfig.yaml
```

**Production:**

```bash
# Copy your production kubeconfig
cp ~/.kube/config-production production-kubeconfig.yaml
```

### Option B: Generate new kubeconfig files

If you need to create new kubeconfig files:

**For Staging:**

```bash
# Get cluster credentials (example for Azure AKS)
az aks get-credentials --resource-group <staging-rg> --name <staging-cluster> --file staging-kubeconfig.yaml

# Or for GKE
gcloud container clusters get-credentials <staging-cluster> --zone <zone> --project <project> --kubeconfig=staging-kubeconfig.yaml

# Or for EKS
aws eks update-kubeconfig --name <staging-cluster> --region <region> --kubeconfig staging-kubeconfig.yaml
```

**For Production:**

```bash
# Same commands but for production cluster
az aks get-credentials --resource-group <production-rg> --name <production-cluster> --file production-kubeconfig.yaml
```

### Option C: Extract from existing config

If you have a single kubeconfig with multiple contexts:

```bash
# List contexts
kubectl config get-contexts

# Extract specific context to new file
KUBECONFIG=staging-kubeconfig.yaml kubectl config view --minify --flatten --context=<staging-context-name> > staging-kubeconfig.yaml
KUBECONFIG=production-kubeconfig.yaml kubectl config view --minify --flatten --context=<production-context-name> > production-kubeconfig.yaml
```

---

## Step 2: Encode to Base64

The workflow expects base64-encoded kubeconfig files. Encode them:

**For Staging:**

```bash
# macOS/Linux
base64 -i staging-kubeconfig.yaml | pbcopy  # macOS (copies to clipboard)
base64 staging-kubeconfig.yaml | pbcopy     # macOS alternative
base64 staging-kubeconfig.yaml               # Linux (prints to terminal, copy it)

# Or save to file
base64 staging-kubeconfig.yaml > staging-kubeconfig-base64.txt
```

**For Production:**

```bash
base64 -i production-kubeconfig.yaml | pbcopy  # macOS
base64 production-kubeconfig.yaml | pbcopy    # macOS alternative
base64 production-kubeconfig.yaml             # Linux
```

**Verify the encoding:**

```bash
# Decode to verify (should match original)
echo "<base64-string>" | base64 -d > verify.yaml
diff staging-kubeconfig.yaml verify.yaml
```

---

## Step 3: Add Secrets to GitHub

### Method 1: Via GitHub Web UI (Recommended)

1. **Navigate to your repository:**
   - Go to: `https://github.com/hummbl-dev/engine-ops`

2. **Open Secrets settings:**
   - Click: **Settings** → **Secrets and variables** → **Actions**

3. **Add KUBECONFIG_STAGING:**
   - Click: **New repository secret**
   - **Name:** `KUBECONFIG_STAGING`
   - **Secret:** Paste the base64-encoded staging kubeconfig
   - Click: **Add secret**

4. **Add KUBECONFIG_PRODUCTION:**
   - Click: **New repository secret** again
   - **Name:** `KUBECONFIG_PRODUCTION`
   - **Secret:** Paste the base64-encoded production kubeconfig
   - Click: **Add secret**

### Method 2: Via GitHub CLI

```bash
# Install GitHub CLI if needed: brew install gh

# Authenticate
gh auth login

# Add staging secret
gh secret set KUBECONFIG_STAGING --repo hummbl-dev/engine-ops < staging-kubeconfig-base64.txt

# Add production secret
gh secret set KUBECONFIG_PRODUCTION --repo hummbl-dev/engine-ops < production-kubeconfig-base64.txt
```

### Method 3: Via GitHub API

```bash
# Set staging secret
curl -X PUT \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/hummbl-dev/engine-ops/actions/secrets/KUBECONFIG_STAGING \
  -d '{"encrypted_value":"<base64-encoded-kubeconfig>","key_id":"<repository-public-key-id>"}'

# Note: This requires encryption using GitHub's public key
# See: https://docs.github.com/en/rest/actions/secrets#create-or-update-a-repository-secret
```

---

## Step 4: Verify Secrets Are Set

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. You should see:
   - ✅ `KUBECONFIG_STAGING` (with "Update" and "Remove" buttons)
   - ✅ `KUBECONFIG_PRODUCTION` (with "Update" and "Remove" buttons)

**Note:** GitHub hides secret values for security. You can only see that they exist, not their contents.

---

## Step 5: Test the Workflow

1. **Trigger a test deployment:**
   - Go to: **Actions** → **Rolling Deployment** → **Run workflow**
   - Select: `staging` environment
   - Enter a version (e.g., `v0.3.0`)
   - Click: **Run workflow**

2. **Check the logs:**
   - The workflow should successfully decode the kubeconfig
   - It should be able to connect to your cluster
   - If it fails, check the error messages

---

## Security Best Practices

### ✅ Do:

- ✅ Use separate kubeconfig files for staging and production
- ✅ Use service accounts with minimal required permissions
- ✅ Rotate kubeconfig credentials regularly (every 90 days)
- ✅ Use environment-specific secrets (if using GitHub Environments)
- ✅ Limit who can access these secrets (use branch protection)
- ✅ Use read-only service accounts when possible

### ❌ Don't:

- ❌ Don't commit kubeconfig files to the repository
- ❌ Don't share kubeconfig files via insecure channels
- ❌ Don't use admin/service account credentials with full cluster access
- ❌ Don't use the same kubeconfig for staging and production
- ❌ Don't store kubeconfig in plain text anywhere

---

## Troubleshooting

### Error: "Failed to decode KUBECONFIG_STAGING secret"

**Cause:** Secret is not base64-encoded or encoding is corrupted

**Fix:**

1. Re-encode the kubeconfig file:
   ```bash
   base64 staging-kubeconfig.yaml | pbcopy
   ```
2. Update the secret in GitHub with the new base64 string
3. Make sure there are no extra spaces or newlines

### Error: "Invalid kubeconfig or cluster unreachable"

**Cause:** Kubeconfig is invalid or cluster is not accessible from GitHub Actions

**Fix:**

1. Test the kubeconfig locally:
   ```bash
   export KUBECONFIG=staging-kubeconfig.yaml
   kubectl cluster-info
   kubectl get nodes
   ```
2. If it works locally but not in GitHub Actions:
   - Check if cluster allows external access
   - Verify firewall rules allow GitHub Actions IPs
   - Check if cluster requires VPN access (GitHub Actions can't use VPN)

### Error: "No pods found with label app=engine-ops"

**Cause:** Deployment doesn't exist yet or label is wrong

**Fix:**

1. Check if deployment exists:
   ```bash
   kubectl get deployments -n staging
   kubectl get deployments -n production
   ```
2. Verify the label selector:
   ```bash
   kubectl get pods -l app=engine-ops -n staging
   ```
3. If deployment doesn't exist, create it first (initial deployment)

---

## Example Kubeconfig Structure

A typical kubeconfig file looks like:

```yaml
apiVersion: v1
kind: Config
clusters:
  - cluster:
      certificate-authority-data: <base64-cert>
      server: https://<cluster-endpoint>
    name: staging-cluster
contexts:
  - context:
      cluster: staging-cluster
      user: staging-user
    name: staging-context
current-context: staging-context
users:
  - name: staging-user
    user:
      token: <service-account-token>
      # OR
      # exec:
      #   apiVersion: client.authentication.k8s.io/v1beta1
      #   command: az
      #   args:
      #     - aks
      #     - get-token
      #     - --resource-group
      #     - <rg-name>
      #     - --name
      #     - <cluster-name>
```

---

## Quick Reference

**Secret Names:**

- `KUBECONFIG_STAGING`
- `KUBECONFIG_PRODUCTION`

**Format:** Base64-encoded YAML kubeconfig file

**Location:** GitHub → Repository → Settings → Secrets and variables → Actions

**Workflow Usage:**

```yaml
echo "${{ secrets.KUBECONFIG_STAGING }}" | base64 -d > $HOME/.kube/config
```

---

## Next Steps

After setting up secrets:

1. ✅ Create GitHub Environments (staging, production)
2. ✅ Test the workflow with staging first
3. ✅ Verify deployments work correctly
4. ✅ Set up branch protection rules
5. ✅ Document your cluster access procedures

---

**Last Updated:** 2025-01-27  
**Questions?** Check the workflow logs or review `.github/workflows/rolling-deploy.yml`
