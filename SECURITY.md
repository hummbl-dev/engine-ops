# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 5.1.x   | :white_check_mark: |
| 5.0.x   | :x:                |
| 4.0.x   | :white_check_mark: |
| < 4.0   | :x:                |

## Reporting a Vulnerability

To report a security vulnerability:

- Please email [security@hummbl.dev](mailto:security@hummbl.dev) or use [GitHub Security Advisories](https://docs.github.com/en/code-security/security-advisories).
- Include affected version, reproduction steps, and impact assessment.
- You will receive a response within 3 business days.
- Updates will be provided at least weekly until resolution.

## Disclosure Policy

- We support responsible disclosure.
- Vulnerabilities will be publicly disclosed after a fix is released and users are notified.

## Patch & Release Process

- Security patches are released as soon as possible after validation.
- Users are notified via GitHub releases and changelogs.
- All security fixes are documented in the changelog and release notes.

## Engine-Ops Security Features

- Policy enforcement: All agent actions validated against runtime policies.
- Audit trails: Full traceability via telemetry and logging.
- RBAC and compliance: Supports encrypted secrets, role-based access, and regulatory frameworks.
- See [docs/engine-ops-overview-technical.md](docs/engine-ops-overview-technical.md) for details.

## CodeQL & Automated Security Scans

- CodeQL is enabled for continuous code analysis.
- Warnings and vulnerabilities are triaged and addressed promptly.
- See [.github/workflows/codeql.yml](.github/workflows/codeql.yml) for configuration.
