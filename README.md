# Engine-Ops

**Engine-Ops** is a comprehensive engine optimization operations platform designed for high-performance computing, data processing, and infrastructure management. Built with a hybrid licensing model to balance commercial sustainability with open-source principles.

## 🏗️ Repository Structure

```
engine-ops/
├── core/              # Core engine optimization logic (BSL 1.1)
├── schemas/           # Data schemas and validation (BSL 1.1)
├── docs/              # Documentation and guides (BSL 1.1)
├── public/            # Public APIs and interfaces (Apache 2.0)
├── infra/             # Infrastructure configurations (Apache 2.0)
├── tools/             # Development and maintenance tools
│   ├── license-headers/
│   │   ├── BSL_HEADER.txt
│   │   └── APACHE_HEADER.txt
│   └── apply-license-headers.sh
├── LICENSE            # Business Source License 1.1
├── CONTRIBUTING.md    # Contribution guidelines
└── README.md          # This file
```

## 📜 Hybrid Licensing Model

Engine-Ops uses a strategic dual-licensing approach:

### Business Source License (BSL) 1.1
**Directories:** `core/`, `schemas/`, `docs/`

- **Non-production use:** Freely permitted
- **Change Date:** 2029-01-01
- **Change License:** Apache License 2.0
- **Production limitations:** See LICENSE for Additional Use Grant details

After the Change Date, these components automatically convert to Apache 2.0, ensuring eventual open-source availability.

### Apache License 2.0
**Directories:** `public/`, `infra/`

- **All use cases:** Freely permitted including commercial production
- **Permissive:** Minimal restrictions on usage and distribution

### Why Hybrid Licensing?

- **Sustainable Development:** BSL allows commercial sustainability for core IP
- **Community Friendly:** Public APIs and infrastructure freely available
- **Future Open Source:** Automatic conversion to Apache 2.0 after Change Date
- **Clear Boundaries:** Directory-based licensing is unambiguous

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (for TypeScript/JavaScript components)
- Python 3.9+ (for Python components)
- Bash 4.0+ (for shell scripts)

### Installation

```bash
# Clone the repository
git clone https://github.com/hummbl-dev/engine-ops.git
cd engine-ops

# Install dependencies (when available)
npm install

# Verify license headers
./tools/apply-license-headers.sh --check
```

## 🛠️ Development

### License Header Management

All source files must include appropriate license headers. Use the provided tool:

```bash
# Apply license headers to all files
./tools/apply-license-headers.sh

# Check without modifying
./tools/apply-license-headers.sh --check

# Verbose output
./tools/apply-license-headers.sh --verbose
```

The script automatically applies:
- **BSL headers** → `core/`, `schemas/`, `docs/`
- **Apache 2.0 headers** → `public/`, `infra/`

### Project Guidelines

1. **Follow directory licensing** - Place code in the appropriate directory based on licensing needs
2. **Add license headers** - All source files must have headers
3. **Write tests** - Maintain high test coverage
4. **Document changes** - Update relevant documentation
5. **Code quality** - Follow language-specific style guides

## 📖 Documentation

- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines and licensing rules
- **[LICENSE](LICENSE)** - Business Source License 1.1 full text
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture overview
- **[docs/MULTI-CLOUD.md](docs/MULTI-CLOUD.md)** - Multi-cloud and edge compute guide
- **[docs/KUBERNETES.md](docs/KUBERNETES.md)** - Kubernetes deployment guide

## 🤝 Contributing

We welcome contributions! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Hybrid licensing guidelines
- Code style standards
- Testing requirements
- Pull request process
- License compliance checklist

### Contribution Quick Guide

```bash
# 1. Fork and clone
git clone https://github.com/your-username/engine-ops.git

# 2. Create a feature branch
git checkout -b feature/your-feature

# 3. Make changes and add license headers
./tools/apply-license-headers.sh

# 4. Test your changes
npm test

# 5. Submit a pull request
```

## 📋 Features (Roadmap)

### Core Engine (BSL)
- [x] High-performance optimization algorithms
- [x] Resource allocation and scheduling
- [x] Performance monitoring and analytics
- [x] Advanced caching strategies
- [x] **Multi-cloud and edge compute support**
  - [x] AWS, GCP, Azure provider adapters
  - [x] Edge cluster support
  - [x] Federated scheduling across providers
  - [x] Geo-sharding for distributed workloads

### Schemas (BSL)
- [x] Data validation framework
- [ ] Schema versioning and migration
- [x] Type-safe data structures
- [x] API schema definitions
- [x] Multi-cloud workload schemas

### Public APIs (Apache 2.0)
- [ ] RESTful API interfaces
- [ ] WebSocket real-time communication
- [ ] Client SDKs and libraries
- [ ] API documentation

### Infrastructure (Apache 2.0)
- [ ] Docker containerization
- [ ] Kubernetes deployment configs
- [ ] CI/CD pipelines
- [ ] Infrastructure-as-code templates

## 🔒 Security

Security is a top priority. To report security vulnerabilities:

- **Do not** open public issues for security concerns
- **Email:** hummbldev@gmail.com
- **Include:** Detailed description and reproduction steps

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/hummbl-dev/engine-ops/issues)
- **Discussions:** [GitHub Discussions](https://github.com/hummbl-dev/engine-ops/discussions)
- **Email:** hummbldev@gmail.com

## 📄 License

This project uses a hybrid licensing model:

- **BSL 1.1** (`core/`, `schemas/`, `docs/`) - See [LICENSE](LICENSE)
- **Apache 2.0** (`public/`, `infra/`) - See license headers in files

See [LICENSE](LICENSE) for the Business Source License terms.

---

**Copyright (c) 2025, HUMMBL, LLC**


