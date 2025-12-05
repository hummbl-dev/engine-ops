# Contributing to Engine-Ops

Thank you for your interest in contributing to Engine-Ops! This document provides guidelines for contributing to this project, which uses a hybrid licensing model.

## Hybrid Licensing Structure

Engine-Ops uses a dual-licensing approach based on directory structure:

### Business Source License (BSL) 1.1

The following directories are licensed under the Business Source License 1.1 with Change Date 2029-01-01:

- **`core/`** - Core engine optimization logic and algorithms
- **`schemas/`** - Data schemas and validation logic
- **`docs/`** - Documentation and guides

**BSL Implications:**

- Non-production use is freely permitted
- Production use is limited (see Additional Use Grant in LICENSE)
- After the Change Date (2029-01-01), these components automatically convert to Apache 2.0
- Commercial database service use requires a commercial license

### Apache License 2.0

The following directories are licensed under the Apache License 2.0:

- **`public/`** - Public APIs and interfaces
- **`infra/`** - Infrastructure and deployment configurations

**Apache 2.0 Implications:**

- Freely usable for any purpose, including commercial production use
- Permissive license with minimal restrictions

## How to Contribute

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/engine-ops.git
cd engine-ops
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes

- Follow existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass

### 4. License Headers

All source files **must** include appropriate license headers. Use the provided script:

```bash
# Add license headers to new files
./tools/apply-license-headers.sh

# Check if all files have proper headers
./tools/apply-license-headers.sh --check
```

The script automatically applies:

- **BSL headers** to files in `core/`, `schemas/`, `docs/`
- **Apache 2.0 headers** to files in `public/`, `infra/`

### 5. Contributor License Agreement (CLA)

By contributing to this project, you agree that:

1. **For BSL-licensed directories** (`core/`, `schemas/`, `docs/`):
   - Your contributions will be licensed under BSL 1.1 with the same Change Date
   - You retain copyright to your contributions
   - You grant Hummbl Dev rights to use, modify, and relicense your contributions

2. **For Apache-licensed directories** (`public/`, `infra/`):
   - Your contributions will be licensed under Apache 2.0
   - You retain copyright to your contributions
   - You grant perpetual, worldwide, non-exclusive, royalty-free rights

3. **You have the right to submit the contribution**:
   - The work is your original creation
   - You have necessary rights from your employer (if applicable)
   - The contribution does not violate any third-party rights

### 6. Submit a Pull Request

```bash
git add .
git commit -m "Brief description of changes"
git push origin feature/your-feature-name
```

Then open a Pull Request on GitHub.

## Code Style Guidelines

### General Principles

- Write clear, readable, maintainable code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Language-Specific Guidelines

#### TypeScript/JavaScript

- Use TypeScript for type safety
- Follow ESLint/Prettier configurations
- Use async/await over callbacks
- Prefer `const` over `let`, avoid `var`

#### Python

- Follow PEP 8 style guide
- Use type hints where appropriate
- Use docstrings for functions and classes
- Prefer list comprehensions when clear

#### Bash

- Use `set -euo pipefail` at script start
- Quote variables: `"$variable"`
- Use `[[` instead of `[` for conditionals
- Include usage/help information

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- core

# Run with coverage
npm test -- --coverage
```

### Writing Tests

- Write tests for all new functionality
- Follow existing test patterns
- Use descriptive test names
- Test edge cases and error conditions
- Aim for high code coverage

## Documentation

### Updating Documentation

When making changes:

1. Update relevant README files
2. Update API documentation (if applicable)
3. Add/update inline code comments
4. Update CHANGELOG.md with notable changes

### Documentation Style

- Use clear, concise language
- Include code examples
- Document parameters and return values
- Explain "why" not just "what"

## Directory-Specific Contribution Guidelines

### Contributing to `core/` (BSL)

- High-quality, production-ready code required
- Comprehensive tests mandatory
- Performance considerations critical
- Security review for sensitive operations

### Contributing to `schemas/` (BSL)

- Schema changes require migration path
- Backward compatibility when possible
- Validation logic must be comprehensive
- Document schema structure and constraints

### Contributing to `docs/` (BSL)

- Clear, accurate documentation
- Include practical examples
- Keep documentation up-to-date with code
- Follow existing documentation structure

### Contributing to `public/` (Apache 2.0)

- API stability is critical
- Comprehensive API documentation
- Version public APIs carefully
- Consider backward compatibility

### Contributing to `infra/` (Apache 2.0)

- Infrastructure-as-code best practices
- Security-first approach
- Documentation for deployment
- Environment-agnostic configurations

## Review Process

1. **Automated Checks**
   - CI/CD pipeline runs automatically
   - License headers verified
   - Tests must pass
   - Code quality checks

2. **Code Review**
   - At least one maintainer approval required
   - Address all review comments
   - Keep discussions professional and constructive

3. **Merge**
   - Squash commits for clean history
   - Delete branch after merge

## Getting Help

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately to hummbldev@gmail.com

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Accept differing viewpoints gracefully

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or trolling
- Spam or off-topic content
- Publishing private information

## License Compliance Checklist

Before submitting a PR, ensure:

- [ ] All new files have appropriate license headers
- [ ] Changes are in the correct directory for intended license
- [ ] No BSL code copied to Apache directories (or vice versa without proper consideration)
- [ ] Third-party dependencies are compatible with our licensing
- [ ] License headers applied using `./tools/apply-license-headers.sh`

## Questions?

If you have questions about licensing or contributions:

- Open a GitHub Discussion
- Email: hummbldev@gmail.com
- Review the LICENSE file for full legal terms

Thank you for contributing to Engine-Ops! 🚀
