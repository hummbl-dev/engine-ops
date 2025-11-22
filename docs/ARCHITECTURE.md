# Engine-Ops Architecture

## System Overview

Engine-Ops is a high-performance optimization platform designed for resource allocation, scheduling, and performance optimization at scale. Built with TypeScript and designed for cloud-native deployments.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Clients                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   REST   │  │WebSocket │  │ Python   │  │   Go     │   │
│  │   API    │  │  Client  │  │   SDK    │  │   SDK    │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼────────────┼─────────────┼─────────────┼───────────┘
        │            │             │             │
        └────────────┴─────────────┴─────────────┘
                     │
        ┌────────────▼────────────┐
        │   API Gateway Layer     │
        │  ┌──────────────────┐   │
        │  │  Authentication  │   │
        │  │  Rate Limiting   │   │
        │  │  RBAC            │   │
        │  └──────────────────┘   │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Application Layer     │
        │  ┌──────────────────┐   │
        │  │  Express Server  │   │
        │  │  Socket.io       │   │
        │  │  Middleware      │   │
        │  └──────────────────┘   │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   Business Logic        │
        │  ┌──────────────────┐   │
        │  │ Optimization     │   │
        │  │ Engine           │   │
        │  └────────┬─────────┘   │
        └───────────┼─────────────┘
                    │
        ┌───────────▼─────────────┐
        │   Algorithm Layer       │
        │  ┌───────────────────┐  │
        │  │ Bin Packing       │  │
        │  │ Least Loaded      │  │
        │  │ Genetic Algorithm │  │
        │  │ Simulated Anneal  │  │
        │  └───────────────────┘  │
        └─────────────────────────┘
                    │
        ┌───────────▼─────────────┐
        │   Infrastructure        │
        │  ┌───────────────────┐  │
        │  │ LRU Cache         │  │
        │  │ Metrics Collector │  │
        │  │ Logger            │  │
        │  │ Circuit Breaker   │  │
        │  └───────────────────┘  │
        └─────────────────────────┘
```

## Component Breakdown

### 1. Client Layer
- **REST API**: HTTP/JSON interface for synchronous requests
- **WebSocket**: Real-time bidirectional communication
- **Python SDK**: Native Python client library
- **Go SDK**: Native Go client library

### 2. API Gateway
- **Authentication**: API keys and JWT tokens
- **Rate Limiting**: Token bucket algorithm, per-user limits
- **RBAC**: Role-based access control (admin, user, readonly)

### 3. Application Layer
- **Express Server**: Node.js web framework
- **Socket.io**: WebSocket server for real-time updates
- **Middleware**: Request logging, error handling, validation

### 4. Business Logic
- **Optimization Engine**: Core orchestration and lifecycle management
- **Request Validation**: Zod schema validation
- **Result Caching**: LRU cache with TTL

### 5. Algorithm Layer
- **Bin Packing**: First Fit Decreasing (FFD) algorithm
- **Least Loaded**: Load-based scheduling
- **Genetic Algorithm**: Population-based optimization
- **Simulated Annealing**: Probabilistic optimization

### 6. Infrastructure
- **LRU Cache**: In-memory caching with eviction
- **Metrics Collector**: Performance tracking (P50/P95/P99)
- **Structured Logger**: JSON logging with correlation IDs
- **Circuit Breaker**: Failure isolation and recovery

## Data Flow

### Optimization Request Flow

```
1. Client → API Gateway
   - Authentication check
   - Rate limit check
   - Permission validation

2. API Gateway → Application Layer
   - Request validation (Zod)
   - Cache lookup

3. Application Layer → Business Logic
   - Route to appropriate algorithm
   - Execute optimization
   - Emit WebSocket events (progress)

4. Business Logic → Algorithm Layer
   - Run optimization algorithm
   - Return result

5. Algorithm Layer → Infrastructure
   - Log execution
   - Record metrics
   - Cache result

6. Response Path (reverse)
   - Cache result
   - Emit WebSocket complete event
   - Return HTTP response
```

## Technology Stack

### Core
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: Express.js

### Libraries
- **Validation**: Zod
- **WebSocket**: Socket.io
- **Metrics**: prom-client
- **Tracing**: OpenTelemetry
- **Auth**: jsonwebtoken, bcrypt
- **Testing**: Jest, Supertest

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Package Management**: Helm
- **CI/CD**: GitHub Actions

## Deployment Architecture

### Kubernetes Deployment

```
┌─────────────────────────────────────┐
│          Load Balancer              │
│         (Ingress/Service)           │
└──────────────┬──────────────────────┘
               │
    ┌──────────▼──────────┐
    │   HPA (2-10 pods)   │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │    Pod Replicas     │
    │  ┌──────────────┐   │
    │  │ Engine-Ops   │   │
    │  │ Container    │   │
    │  └──────────────┘   │
    └─────────────────────┘
               │
    ┌──────────▼──────────┐
    │   ConfigMap/Secrets │
    └─────────────────────┘
```

## Scalability

- **Horizontal**: Auto-scaling 2-10 pods based on CPU/memory
- **Vertical**: Configurable resource limits per pod
- **Caching**: LRU cache reduces redundant computations
- **Stateless**: No persistent state, fully horizontal scalable

## Security

- **Authentication**: Multi-method (API keys, JWT)
- **Authorization**: RBAC with granular permissions
- **Transport**: HTTPS/WSS in production
- **Input Validation**: Zod schema validation
- **Rate Limiting**: Per-IP and per-user limits
- **Security Headers**: CSP, HSTS, X-Frame-Options

## Monitoring & Observability

- **Metrics**: Prometheus format (`/metrics`)
- **Tracing**: OpenTelemetry with Jaeger export
- **Logging**: Structured JSON logs
- **Health Checks**: Liveness and readiness probes
- **Dashboard**: Real-time analytics UI

## Performance Characteristics

- **Request Latency**: P95 < 100ms (cached), < 500ms (uncached)
- **Throughput**: 1000+ req/sec per pod
- **Cache Hit Rate**: 60-80% typical
- **Memory**: ~128MB baseline, ~512MB under load
- **CPU**: ~100m baseline, ~500m under load

## Multi-Cloud Architecture

### Provider Abstraction Layer

The engine now includes comprehensive multi-cloud support:

```
┌────────────────────────────────────────────┐
│      Multi-Cloud Resource Manager         │
│  ┌─────────────────────────────────────┐  │
│  │  Federated Scheduler                │  │
│  │  - Intelligent placement scoring    │  │
│  │  - Geo-sharding support            │  │
│  │  - Provider preferences            │  │
│  └─────────────────────────────────────┘  │
└───┬────────┬──────────┬─────────┬─────────┘
    │        │          │         │
┌───▼───┐┌──▼────┐┌────▼───┐┌───▼────┐
│  AWS  ││  GCP  ││ Azure  ││  Edge  │
│       ││       ││        ││Clusters│
└───────┘└───────┘└────────┘└────────┘
```

### Supported Providers

- **AWS**: us-east-1, us-west-2, eu-west-1, ap-southeast-1
- **GCP**: us-central1, europe-west1, asia-east1
- **Azure**: eastus, westeurope, southeastasia
- **Edge**: Distributed edge computing locations

### Key Features

- **Federated Scheduling**: Intelligent workload placement across providers
- **Geo-Sharding**: Automatic geographical distribution
- **Provider Preferences**: Configurable provider and region preferences
- **Resource Optimization**: Balanced resource utilization
- **Latency Optimization**: Edge placement for low-latency workloads

See [MULTI-CLOUD.md](./MULTI-CLOUD.md) for detailed documentation.

## Future Enhancements

- Distributed caching (Redis)
- Message queue integration (RabbitMQ/Kafka)
- ~~Multi-region deployment~~ ✅ **Completed**
- Advanced ML algorithms
- GraphQL API
- Cost optimization across providers
- Custom provider implementations
