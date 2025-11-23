# Security Praxis Framework

**Version:** 1.0
**Last Updated:** 2025-11-22

## 1. Core Philosophy
Security is not a gate; it is a continuous context. Every line of code, every configuration, and every operational procedure must be evaluated against the principle of **Least Privilege** and **Defense in Depth**.

## 2. Secure Coding Standards
### Input Validation
- **Strict Typing:** Use TypeScript strict mode. No `any`.
- **Schema Validation:** All API inputs must be validated via Zod schemas.
- **Sanitization:** Sanitize all user inputs before processing or logging.

### Secrets Management
- **No Hardcoded Secrets:** CI/CD pipelines must fail if secrets are detected in code.
- **Vault Integration:** Use HashiCorp Vault or AWS Secrets Manager for runtime secrets.
- **Environment Variables:** Use `.env` files for local development (git-ignored).

### Authentication & Authorization
- **Zero Trust:** Verify identity at every service boundary.
- **RBAC:** Implement Role-Based Access Control for all API endpoints.
- **Audit Logging:** Log all access decisions (allow/deny) with context.

## 3. Infrastructure Security
### Container Security
- **Distroless Images:** Use minimal base images (e.g., `gcr.io/distroless/nodejs`).
- **Non-Root User:** Run containers as non-root user.
- **Image Scanning:** Scan images for vulnerabilities during CI (Trivy/Grype).

### Kubernetes Security
- **Network Policies:** Deny all ingress/egress by default; allowlist required traffic.
- **Pod Security Standards:** Enforce `Restricted` profile where possible.
- **RBAC:** Minimize ServiceAccount permissions.

## 4. Operational Security (OpSec)
### Incident Response
- **See:** [CI Failure Response](../playbooks/ci-failure-response.md)
- **See:** [Deployment Procedures](../playbooks/deployment-procedures.md)

### Compliance
- **License Compliance:** Ensure all dependencies are compatible with BSL 1.1.
- **Dependency Updates:** Weekly Dependabot updates for security patches.

## 5. Security Context in CI/CD
- **SAST:** Static Application Security Testing (ESLint security plugins).
- **DAST:** Dynamic Application Security Testing (OWASP ZAP) in staging.
- **SCA:** Software Composition Analysis (Dependabot/npm audit).
