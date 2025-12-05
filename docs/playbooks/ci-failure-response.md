# CI Failure Response Playbook

## Purpose

Standardized procedures for triaging and resolving CI pipeline failures in the `engine-ops` repository.

## Quick Reference

| Failure Type      | Typical Cause         | First Action                           |
| ----------------- | --------------------- | -------------------------------------- |
| Build (Node 20.x) | Dependency conflict   | Check `package.json` versions          |
| Build (Node 18.x) | Syntax/Type errors    | Review recent commits                  |
| Lint              | Code style violations | Run `npm run lint -- --fix`            |
| Test              | Logic errors          | Check test logs in artifacts           |
| License Check     | Missing headers       | Run `./tools/apply-license-headers.sh` |

---

## Triage Process

### Step 1: Identify Failure Pattern

**Check the CI dashboard:** [Actions](https://github.com/hummbl-dev/engine-ops/actions)

**Common patterns:**

- ❌ **All builds failing** → Likely main branch issue
- ❌ **Only Node 20.x failing** → Dependency compatibility issue
- ❌ **Specific PR failing** → PR-specific code issue
- ❌ **Intermittent failures** → Flaky test or network issue

### Step 2: Gather Context

```bash
# View recent CI runs
gh run list --limit 10

# View specific run details
gh run view <run-id>

# Download artifacts for debugging
gh run download <run-id>
```

### Step 3: Classify Issue

- **P0 (Critical)**: Main branch broken, all PRs blocked
- **P1 (High)**: Specific feature blocked, deployment blocked
- **P2 (Medium)**: Flaky test, non-blocking warning
- **P3 (Low)**: Documentation, minor lint issue

---

## Common Failure Scenarios

### Scenario 1: Peer Dependency Conflict

**Symptoms:**

```
npm error ERESOLVE could not resolve
npm error Conflicting peer dependency: @typescript-eslint/parser@X.X.X
```

**Resolution:**

```bash
# Check current versions
npm list @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Update both packages together
npm install --save-dev @typescript-eslint/eslint-plugin@X.X.X @typescript-eslint/parser@X.X.X

# Verify locally
npm run build && npm run lint && npm test

# Commit fix
git add package.json package-lock.json
git commit -m "fix(deps): resolve typescript-eslint peer dependency"
git push origin main
```

**Prevention:** Dependabot grouping (already configured in `.github/dependabot.yml`)

---

### Scenario 2: TypeScript Build Errors

**Symptoms:**

```
error TS2554: Expected 2 arguments, but got 1
error TS7006: Parameter implicitly has an 'any' type
```

**Resolution:**

```bash
# Run build locally
npm run build

# Fix type errors in reported files
# Common fixes:
# - Add type annotations
# - Update function signatures
# - Fix import statements

# Verify fix
npm run build && npm test
```

**Debug artifacts:** Download `npm-debug-logs-node-*` from failed run

---

### Scenario 3: Test Failures

**Symptoms:**

```
FAIL core/__tests__/engine.test.ts
  ● OptimizationEngine › should handle invalid requests
```

**Resolution:**

```bash
# Run tests locally with verbose output
npm test -- --verbose

# Run specific test file
npm test -- core/__tests__/engine.test.ts

# Check coverage report
npm test -- --coverage
```

**Debug artifacts:** Download `coverage-report` from CI run

---

### Scenario 4: Lint Failures

**Symptoms:**

```
✖ 150 problems (4 errors, 146 warnings)
  1 error and 0 warnings potentially fixable with the `--fix` option
```

**Resolution:**

```bash
# Auto-fix fixable issues
npm run lint -- --fix

# Review remaining errors
npm run lint

# Common lint errors:
# - Missing return types
# - Unused variables
# - Import order

# Commit fixes
git add .
git commit -m "fix(lint): resolve eslint errors"
```

---

### Scenario 5: License Header Failures

**Symptoms:**

```
License header check failed
Missing headers in: core/new-file.ts
```

**Resolution:**

```bash
# Apply license headers to all files
./tools/apply-license-headers.sh

# Verify
./tools/apply-license-headers.sh --check

# Commit
git add .
git commit -m "chore: add license headers"
```

---

## Escalation Paths

### Level 1: Self-Service (0-30 min)

- Check this playbook
- Review recent commits
- Run local verification
- Apply standard fixes

### Level 2: Team Review (30 min - 2 hours)

- Post in team chat with CI run link
- Tag relevant code owner
- Share artifact downloads
- Pair debug if needed

### Level 3: Incident Response (> 2 hours)

- Create incident ticket
- Document timeline
- Implement temporary workaround
- Schedule post-mortem

---

## Preventive Measures

### Before Merging PRs

- ✅ All CI checks passing
- ✅ Code reviewed by team member
- ✅ Tests added for new features
- ✅ Documentation updated

### Regular Maintenance

- 📅 **Weekly**: Review Dependabot PRs
- 📅 **Monthly**: Update GitHub Actions versions
- 📅 **Quarterly**: Review and update this playbook

---

## Useful Commands

```bash
# Check CI status for all open PRs
gh pr list --json number,title,statusCheckRollup

# Re-run failed checks
gh run rerun <run-id>

# View workflow file
gh workflow view ci

# List recent workflow runs
gh run list --workflow=ci.yml --limit 20

# Download all artifacts from a run
gh run download <run-id> --dir ./ci-artifacts
```

---

## Related Documentation

- [CI Workflow Configuration](file:///.github/workflows/ci.yml)
- [Dependabot Configuration](file:///.github/dependabot.yml)
- [Contributing Guidelines](file:///CONTRIBUTING.md)
- [Deployment Procedures](file:///docs/playbooks/deployment-procedures.md)

---

**Last Updated:** 2025-11-22  
**Maintained By:** Engine Ops Team
