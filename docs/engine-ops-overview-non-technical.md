# Engine-Ops Non-Technical Overview

> **Version:** v1.0  
> **Last updated:** 2025-11-24  
> **Changelog:** Initial release—aligned with technical overview, onboarding, and product recommendations.

---

**See also:**

- [Technical Overview](engine-ops-overview-technical.md)
- [Onboarding Quickstart](onboarding-quickstart.md)
- [Copilot Instructions](../.github/copilot-instructions.md)

---

## Limitations & Compatibility

- **Operating System Support:**
  - Engine-Ops works best on recent versions of macOS, Windows, and Linux.
  - Some tools (Homebrew, Python, Terraform) may not be fully supported on older OS versions (e.g., macOS 13 is Tier 2/3 for Homebrew).
  - For unsupported systems, consider alternatives like MacPorts or manual installation.
- **Hardware Requirements:**
  - Modern hardware (multi-core CPU, 8GB+ RAM) is recommended for best performance.
  - Large-scale operations are best run in the cloud or on dedicated servers.
- **Tool Licensing & Deprecation:**
  - Python@3.9 and Terraform open-source versions are deprecated; future updates may require manual management or alternative tools.
- **Troubleshooting:**
  - If you encounter installation or compatibility issues, check the documentation for recommended OS versions and hardware specs.

## What is Engine-Ops?

Engine-Ops is a flexible platform that helps organizations optimize operations, automate tasks, and improve reliability. It works with any cloud provider or local setup, and is designed to be easy to adopt and scale.

## Onboarding Guidance

- **Local Setup:**
  1. Install prerequisites: Node.js, Python, Git, Helm, Terraform.
  2. Follow the [Onboarding Quickstart](onboarding-quickstart.md) for step-by-step instructions.
  3. If you encounter issues, consult the troubleshooting section below.
- **Cloud Deployment:**
  1. Use Helm charts, Kubernetes manifests, or Terraform scripts as described in the technical overview.
  2. Ensure cloud provider credentials and permissions are configured.
- **Hybrid Use:**
  1. Combine local and cloud resources for maximum flexibility.
  2. Review environment support in the technical docs.

## How Does It Work?

- **Multi-agent teamwork:** Specialized agents (like detection, triage, resolution, audit) collaborate to solve problems and keep systems running smoothly.
- **Smart context sharing:** Information flows between agents, ensuring decisions are made with full awareness of goals, policies, and history.
- **Extensible:** New capabilities can be added as your needs grow, without vendor lock-in.

## Environment Support

- **Local:** Run Engine-Ops on your own computer for development or small-scale use.
- **Cloud:** Deploy to any major cloud provider for large-scale, distributed operations.
- **Hybrid:** Combine local and cloud resources for maximum flexibility.

## Requirements

- Recommended: Recent OS version, modern hardware, and supported tool versions.
- Basic setup: Node.js, Python, Git, Helm, Terraform (free, open-source tools)
- No vendor lock-in: Anyone can clone and use Engine-Ops
- For unsupported platforms, see alternatives in the Limitations section above.

## Support & Feedback

- For help, open an issue in the repository or contact support.
- Community resources and documentation are available in the `docs/` folder.
- Feedback is welcome to improve onboarding and product experience.

## Learn More

- See the technical overview for details on architecture and setup.
- Explore the documentation in the `docs/` folder for guides and examples.
- Review onboarding quickstart and troubleshooting tips for smooth setup.
