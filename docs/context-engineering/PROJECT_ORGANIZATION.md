# Project Organization & Governance

## 1. Repository Structure
The `engine-ops` repository follows a domain-driven monorepo-like structure:

- **`core/`**: The brain of the system. Pure business logic, algorithms, and domain entities. Dependency-free where possible.
- **`public/`**: The interface layer. API routes, server configuration, and external adapters. Depends on `core`.
- **`k8s-operator/`**: The Kubernetes control plane integration. Depends on `core`.
- **`infra/`**: Infrastructure-as-Code. Helm charts, Terraform, and scripts.
- **`docs/`**: The knowledge base. Context, playbooks, and API references.

## 2. Governance Model
### Roles
- **Maintainer:** Strategic direction, merge rights to `main`.
- **Contributor:** PR submission, code review participation.
- **Bot:** Automated tasks (Dependabot, GitHub Actions).

### Decision Making
- **RFC Process:** Major architectural changes require a Request for Comments (RFC) issue.
- **Consensus:** Decisions are made by consensus among Maintainers.
- **Lazy Consensus:** If no objection within 72 hours, the proposal is accepted.

## 3. Pull Request Management
### Lifecycle
1.  **Draft:** Work in progress. CI may fail.
2.  **Review Required:** Ready for review. CI must pass.
3.  **Changes Requested:** Address feedback.
4.  **Approved:** Ready to merge.
5.  **Merged:** Integrated into `main`.

### Standards
- **Title:** Conventional Commits (e.g., `feat: add scheduler`, `fix: resolve race condition`).
- **Description:** Link to issue, explain "Why" and "How".
- **Size:** Keep PRs small (< 400 lines) for better review quality.
- **Verification:** Must include tests and pass CI.

## 4. Issue Management
### Labels
- `bug`: Something isn't working.
- `feat`: New feature.
- `docs`: Documentation only.
- `chore`: Maintenance tasks.
- `context`: Context engineering updates.
- `good first issue`: Good for newcomers.

### Triage
- Issues should be triaged within 48 hours.
- Assign priority (`P0`-`P3`) and complexity (`XS`-`XL`).

## 5. Context Engineering
- **SITREPs:** Weekly status updates.
- **AARs:** Required after every incident or major release.
- **Documentation:** Treated as code. Must be updated in the same PR as the code change.
