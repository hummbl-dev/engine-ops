# Infrastructure Directory

This directory contains all infrastructure-as-code and deployment configurations.

## Structure

- **`terraform/`** - Cloud infrastructure (GKE/GCP)
  - `main.tf` - VPC, GKE cluster, node pools
  - `variables.tf` - Configuration parameters
  - `outputs.tf` - Cluster connection details

- **`helm/`** - Kubernetes application packaging
  - `engine-ops/` - Main application chart (Blue-Green support)
  - `monitoring/` - Prometheus/Grafana monitoring stack

- **`argocd/`** - GitOps configuration
  - `root.yaml` - App-of-Apps pattern
  - `applications/` - Staging and production app definitions

- **`k8s/`** - Raw Kubernetes manifests
  - `blue-green/` - Blue-Green deployment examples

- **`scripts/`** - Automation and migration scripts
- **`webhooks/`** - Kubernetes admission webhooks

## Key Concepts

- **Blue-Green Deployments** - Zero-downtime releases via traffic switching
- **GitOps** - Declarative deployments via ArgoCD
- **Multi-environment** - Separate configs for staging/production
