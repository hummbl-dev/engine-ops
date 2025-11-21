# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-11-21

### Added
- **Production Hardening**: Enterprise-grade reliability, security, and observability
- **Prometheus Metrics**: `/metrics` endpoint with counters, histograms, gauges
  - Request count, duration, cache hits/misses, active connections
  - Default metrics: CPU, memory, event loop
- **Circuit Breaker**: Failure isolation with automatic recovery
  - States: CLOSED, OPEN, HALF_OPEN
  - Configurable failure threshold and timeout
- **Retry Policy**: Exponential backoff with jitter
  - Configurable max retries and delays
  - Custom retry predicates
- **Authentication**: Multi-method authentication
  - API key support (X-API-Key header)
  - JWT token support (Bearer token)
- **RBAC**: Role-based access control
  - Permissions: READ, WRITE, ADMIN
  - Roles: admin, user, readonly
- **Documentation**:
  - `CHANGELOG.md` - Complete version history
  - `docs/ARCHITECTURE.md` - System architecture and diagrams

### Dependencies
- Added prom-client for Prometheus metrics
- Added OpenTelemetry for distributed tracing
- Added jsonwebtoken and bcrypt for authentication
- Added swagger-ui-express for API documentation
- Added artillery for load testing

## [0.2.0] - 2025-11-21

### Added
- **REST API Server**: Express.js server with 5 endpoints
  - `POST /api/v1/optimize` - Submit optimization requests
  - `GET /api/v1/health` - Health check
  - `GET /api/v1/metrics` - Performance metrics
  - `GET /api/v1/cache/stats` - Cache statistics
  - `GET /` - API information
- **WebSocket Support**: Real-time optimization updates with Socket.io
  - Event-driven architecture (start, progress, complete, error)
  - Room-based broadcasting
- **Advanced Algorithms**:
  - Genetic Algorithm with tournament selection, crossover, mutation
  - Simulated Annealing with temperature scheduling
- **Multi-Language SDKs**:
  - Python SDK with Pydantic models and async support
  - Go SDK with idiomatic Go patterns
- **Analytics Dashboard**: Real-time metrics visualization
  - Chart.js integration
  - WebSocket live updates
  - Responsive design
- **Performance & Monitoring**:
  - LRU cache with TTL and statistics
  - Structured logging system
  - Performance metrics collection (P50/P95/P99)
  - Detailed validation schemas
- **Kubernetes Deployment**:
  - Deployment, Service, ConfigMap, HPA, Ingress manifests
  - Helm chart for parameterized deployment
  - Health probes (liveness/readiness)
  - Horizontal pod autoscaling (2-10 replicas)
- **Testing Framework**: Jest with 30 tests (100% passing)
  - Core engine tests
  - Algorithm tests
  - API integration tests

### Changed
- Updated package description to reflect new features
- Enhanced keywords for better discoverability

## [0.1.1] - 2025-11-20

### Fixed
- Corrected Zod dependency version to `^3.23.8`
- Fixed TypeScript compilation errors
- Updated contact email to `hummbldev@gmail.com`

## [0.1.0] - 2025-11-20

### Added
- **Core Engine**: OptimizationEngine with lifecycle management
- **Algorithms**:
  - Bin Packing (First Fit Decreasing)
  - Least Loaded Scheduling
- **Validation**: Zod schemas for type-safe requests
- **Public API**: EngineOps facade class
- **Infrastructure**:
  - Docker multi-stage build
  - docker-compose configuration
- **CI/CD**:
  - GitHub Actions for build, lint, test
  - Automated releases
- **Documentation**:
  - TypeDoc API documentation
  - README with usage examples
  - CONTRIBUTING guide
- **License Management**: Automated header application (BSL 1.1 / Apache 2.0)

### Initial Release
- First public release of Engine-Ops platform
- TypeScript-based optimization engine
- npm package published as `hummbl-engine-ops`

[Unreleased]: https://github.com/hummbl-dev/engine-ops/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/hummbl-dev/engine-ops/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/hummbl-dev/engine-ops/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/hummbl-dev/engine-ops/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/hummbl-dev/engine-ops/releases/tag/v0.1.0
