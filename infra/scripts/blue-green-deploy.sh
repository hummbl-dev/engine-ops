#!/bin/bash
# Copyright (c) 2025, HUMMBL, LLC
# Licensed under the Apache License, Version 2.0

set -e

# Blue-Green Deployment Script for Engine-Ops
# This script automates zero-downtime deployments using blue-green strategy

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${NAMESPACE:-default}
NEW_VERSION=${1}
SMOKE_TEST_TIMEOUT=${SMOKE_TEST_TIMEOUT:-60}
HEALTH_CHECK_RETRIES=${HEALTH_CHECK_RETRIES:-10}
HEALTH_CHECK_INTERVAL=${HEALTH_CHECK_INTERVAL:-5}

# Usage information
usage() {
    echo "Usage: $0 <new-version> [options]"
    echo ""
    echo "Options:"
    echo "  NAMESPACE=<namespace>              Kubernetes namespace (default: default)"
    echo "  SMOKE_TEST_TIMEOUT=<seconds>       Timeout for smoke tests (default: 60)"
    echo "  HEALTH_CHECK_RETRIES=<count>       Number of health check retries (default: 10)"
    echo "  HEALTH_CHECK_INTERVAL=<seconds>    Interval between health checks (default: 5)"
    echo ""
    echo "Example:"
    echo "  $0 v0.3.0"
    echo "  NAMESPACE=production $0 v0.3.0"
    exit 1
}

# Check if version is provided
if [ -z "$NEW_VERSION" ]; then
    echo -e "${RED}Error: New version not specified${NC}"
    usage
fi

echo -e "${BLUE}=== Engine-Ops Blue-Green Deployment ===${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo -e "${BLUE}New Version: ${NEW_VERSION}${NC}"
echo ""

# Step 1: Determine current active deployment
echo -e "${YELLOW}Step 1: Determining current active deployment...${NC}"
ACTIVE_SERVICE=$(kubectl get service engine-ops-active -n "$NAMESPACE" -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue")
if [ "$ACTIVE_SERVICE" == "blue" ]; then
    INACTIVE_SERVICE="green"
    NEW_COLOR="green"
else
    INACTIVE_SERVICE="blue"
    NEW_COLOR="blue"
fi

echo -e "${GREEN}✓ Active deployment: ${ACTIVE_SERVICE}${NC}"
echo -e "${GREEN}✓ Will deploy to: ${INACTIVE_SERVICE}${NC}"
echo ""

# Step 2: Build and tag new Docker image
echo -e "${YELLOW}Step 2: Building Docker image...${NC}"
docker build -t "engine-ops:${NEW_VERSION}" -f infra/Dockerfile .
docker tag "engine-ops:${NEW_VERSION}" "engine-ops:${NEW_COLOR}"
echo -e "${GREEN}✓ Docker image built and tagged${NC}"
echo ""

# Step 3: Update inactive deployment
echo -e "${YELLOW}Step 3: Deploying to ${INACTIVE_SERVICE} environment...${NC}"
kubectl set image deployment/engine-ops-${INACTIVE_SERVICE} \
    engine-ops="engine-ops:${NEW_COLOR}" \
    -n "$NAMESPACE"

# Wait for rollout to complete
kubectl rollout status deployment/engine-ops-${INACTIVE_SERVICE} -n "$NAMESPACE" --timeout=300s
echo -e "${GREEN}✓ Deployment rolled out successfully${NC}"
echo ""

# Step 4: Wait for pods to be ready
echo -e "${YELLOW}Step 4: Waiting for pods to be ready...${NC}"
kubectl wait --for=condition=ready pod \
    -l app=engine-ops,version=${INACTIVE_SERVICE} \
    -n "$NAMESPACE" \
    --timeout=120s
echo -e "${GREEN}✓ All pods are ready${NC}"
echo ""

# Step 5: Health checks on preview service
echo -e "${YELLOW}Step 5: Running health checks on preview service...${NC}"
PREVIEW_SERVICE="engine-ops-${INACTIVE_SERVICE}"

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    echo -n "  Attempt $i/$HEALTH_CHECK_RETRIES... "
    
    # Port-forward to preview service
    kubectl port-forward "service/${PREVIEW_SERVICE}" 8080:80 -n "$NAMESPACE" &
    PF_PID=$!
    sleep 2
    
    # Health check
    if curl -sf http://localhost:8080/api/v1/health/ready > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Health check passed${NC}"
        kill $PF_PID 2>/dev/null || true
        break
    else
        echo -e "${RED}✗ Health check failed${NC}"
        kill $PF_PID 2>/dev/null || true
        if [ $i -eq $HEALTH_CHECK_RETRIES ]; then
            echo -e "${RED}Error: Health checks failed after $HEALTH_CHECK_RETRIES attempts${NC}"
            echo -e "${YELLOW}Rolling back...${NC}"
            kubectl rollout undo deployment/engine-ops-${INACTIVE_SERVICE} -n "$NAMESPACE"
            exit 1
        fi
        sleep $HEALTH_CHECK_INTERVAL
    fi
done
echo ""

# Step 6: Run smoke tests
echo -e "${YELLOW}Step 6: Running smoke tests...${NC}"
kubectl port-forward "service/${PREVIEW_SERVICE}" 8080:80 -n "$NAMESPACE" &
PF_PID=$!
sleep 2

# Basic API tests
if curl -sf http://localhost:8080/api/v1/health > /dev/null; then
    echo -e "${GREEN}✓ Health endpoint test passed${NC}"
else
    echo -e "${RED}✗ Health endpoint test failed${NC}"
    kill $PF_PID 2>/dev/null || true
    exit 1
fi

if curl -sf http://localhost:8080/metrics > /dev/null; then
    echo -e "${GREEN}✓ Metrics endpoint test passed${NC}"
else
    echo -e "${RED}✗ Metrics endpoint test failed${NC}"
    kill $PF_PID 2>/dev/null || true
    exit 1
fi

kill $PF_PID 2>/dev/null || true
echo ""

# Step 7: Prompt for traffic switch
echo -e "${YELLOW}Step 7: Ready to switch traffic${NC}"
echo -e "${YELLOW}Current active: ${ACTIVE_SERVICE}${NC}"
echo -e "${YELLOW}New deployment: ${INACTIVE_SERVICE}${NC}"
echo ""

read -p "Do you want to switch traffic to ${INACTIVE_SERVICE}? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
    echo -e "${YELLOW}Deployment cancelled. ${INACTIVE_SERVICE} remains in preview mode.${NC}"
    exit 0
fi

# Step 8: Switch traffic
echo -e "${YELLOW}Step 8: Switching traffic to ${INACTIVE_SERVICE}...${NC}"

# Update active service selector
kubectl patch service engine-ops-active -n "$NAMESPACE" \
    -p "{\"spec\":{\"selector\":{\"version\":\"${INACTIVE_SERVICE}\"}}}"

# Update preview service selector to point to old active
kubectl patch service engine-ops-preview -n "$NAMESPACE" \
    -p "{\"spec\":{\"selector\":{\"version\":\"${ACTIVE_SERVICE}\"}}}"

echo -e "${GREEN}✓ Traffic switched to ${INACTIVE_SERVICE}${NC}"
echo ""

# Step 9: Monitor new active deployment
echo -e "${YELLOW}Step 9: Monitoring new active deployment...${NC}"
sleep 5

# Check if pods are still healthy
if kubectl wait --for=condition=ready pod \
    -l app=engine-ops,version=${INACTIVE_SERVICE} \
    -n "$NAMESPACE" \
    --timeout=30s > /dev/null 2>&1; then
    echo -e "${GREEN}✓ New active deployment is healthy${NC}"
else
    echo -e "${RED}✗ New active deployment has issues${NC}"
    echo -e "${YELLOW}Consider rolling back by running:${NC}"
    echo -e "${YELLOW}kubectl patch service engine-ops-active -n $NAMESPACE -p '{\"spec\":{\"selector\":{\"version\":\"${ACTIVE_SERVICE}\"}}}'${NC}"
    exit 1
fi
echo ""

# Step 10: Success
echo -e "${GREEN}=== Deployment Successful ===${NC}"
echo -e "${GREEN}Active deployment: ${INACTIVE_SERVICE} (${NEW_VERSION})${NC}"
echo -e "${GREEN}Preview deployment: ${ACTIVE_SERVICE} (previous version)${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Monitor the application: kubectl logs -f -l app=engine-ops,version=${INACTIVE_SERVICE} -n ${NAMESPACE}"
echo -e "  2. Check metrics: kubectl port-forward service/engine-ops-active 8080:80 -n ${NAMESPACE}"
echo -e "  3. If issues arise, rollback: kubectl patch service engine-ops-active -n ${NAMESPACE} -p '{\"spec\":{\"selector\":{\"version\":\"${ACTIVE_SERVICE}\"}}}'"
echo -e "  4. After verification, scale down old deployment: kubectl scale deployment/engine-ops-${ACTIVE_SERVICE} --replicas=0 -n ${NAMESPACE}"
echo ""
