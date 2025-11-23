# GitHub Actions Workflows

This repository contains 4 GitHub Actions workflows:

## 1. CI (`ci.yml`) ✅ Auto-runs on Push
**Trigger:** Automatic on every push to `main` and PRs  
**Purpose:** Build, lint, and test the codebase  
**Jobs:**
- Build TypeScript (Node 18.x, 20.x)
- Run linter
- Run tests with coverage
- License header compliance check

**Status:** Active and running on every push

---

## 2. Rolling Deployment (`rolling-deploy.yml`) 🔒 Manual Only
**Trigger:** Manual via `workflow_dispatch` only  
**Purpose:** Deploy to Kubernetes with rolling update strategy  
**Requirements:**
- Kubernetes cluster configured
- Secrets: `KUBECONFIG_STAGING`, `KUBECONFIG_PRODUCTION`
- Docker image registry access

**Status:** Disabled for auto-deploy (commented out push trigger)

---

## 3. Blue-Green Deployment (`blue-green-deploy.yml`) 🔒 Manual Only
**Trigger:** Manual via `workflow_dispatch` only  
**Purpose:** Zero-downtime deployment with traffic switching  
**Requirements:**
- Kubernetes cluster configured
- Secrets: `KUBECONFIG`
- Manual approval for traffic switching

**Status:** Manual only (no auto-trigger)

---

## 4. Release (`release.yml`) 📦 Tags Only
**Trigger:** Automatic on version tags  
**Purpose:** Create GitHub releases  

---

## Running Deployment Workflows

### Prerequisites
1. **Kubernetes Cluster:** Must be provisioned and accessible
2. **GitHub Secrets:** Add these in Settings → Secrets:
   - `KUBECONFIG` or `KUBECONFIG_STAGING` / `KUBECONFIG_PRODUCTION`
   - Encode with: `cat kubeconfig.yaml | base64`

### To Deploy Manually:
1. Go to **Actions** tab in GitHub
2. Select **Rolling Deployment** or **Blue-Green Deployment**
3. Click **Run workflow**
4. Choose:
   - Environment: `staging` or `production`
   - Version: e.g., `v0.3.0`
5. Click **Run workflow** button

---

## Troubleshooting

### "Connection to localhost:8080 refused" Errors
**Cause:** Workflow trying to connect to Kubernetes without proper kubeconfig  
**Solution:**
- Ensure you've added `KUBECONFIG` secrets to GitHub
- Only run deployment workflows manually when cluster is ready
- CI workflow doesn't need K8s (it only builds/tests)

### License Header Check Warnings
**Status:** Non-blocking warnings  
**Note:** 62 files currently missing license headers (intentional for now)
