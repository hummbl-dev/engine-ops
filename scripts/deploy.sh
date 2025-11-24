#!/usr/bin/env bash

# ------------------------------------------------------------
# Deploy the Sovereign Stack to a Kubernetes cluster using a Dockerized kubectl.
# This works with any Docker runtime, including Colima on macOS.
# ------------------------------------------------------------

set -euo pipefail

# Ensure Docker (Colima) is running
if ! docker info > /dev/null 2>&1; then
  echo "Docker daemon not reachable. Starting Colima..."
  colima start
fi

# Path to the manifest (relative to repository root)
MANIFEST="infra/k8s/sovereign-stack-deployment.yaml"

# Verify the manifest exists
if [[ ! -f "$MANIFEST" ]]; then
  echo "Error: Manifest $MANIFEST not found."
  exit 1
fi

# Run kubectl inside a Docker container, mounting the kubeconfig and the repo
docker run --rm \
  -v "$HOME/.kube:/root/.kube:ro" \
  -v "$(pwd):/work" \
  -w /work \
  bitnami/kubectl:latest \
  apply -f "$MANIFEST" --validate=false

echo "Deployment applied successfully."
