#!/bin/bash
# Copyright (c) 2025, HUMMBL, LLC
# Licensed under the Apache License, Version 2.0

set -e

# Rollback Script for Engine-Ops
# Provides automated rollback capabilities for blue-green and rolling deployments

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NAMESPACE=${NAMESPACE:-default}
DEPLOYMENT_TYPE=${DEPLOYMENT_TYPE:-blue-green}
REVISION=${1}

# Usage information
usage() {
    echo "Usage: $0 [revision] [options]"
    echo ""
    echo "Options:"
    echo "  NAMESPACE=<namespace>              Kubernetes namespace (default: default)"
    echo "  DEPLOYMENT_TYPE=<type>             Deployment type: blue-green or rolling (default: blue-green)"
    echo ""
    echo "Arguments:"
    echo "  revision                           Specific revision to rollback to (optional)"
    echo ""
    echo "Examples:"
    echo "  $0                                  # Rollback to previous version"
    echo "  $0 5                                # Rollback to specific revision"
    echo "  NAMESPACE=production $0             # Rollback in production namespace"
    echo "  DEPLOYMENT_TYPE=rolling $0          # Rollback rolling deployment"
    exit 1
}

echo -e "${BLUE}=== Engine-Ops Rollback ===${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo -e "${BLUE}Deployment Type: ${DEPLOYMENT_TYPE}${NC}"
echo ""

# Function to rollback blue-green deployment
rollback_blue_green() {
    echo -e "${YELLOW}Initiating blue-green rollback...${NC}"
    
    # Get current active deployment
    ACTIVE_VERSION=$(kubectl get service engine-ops-active -n "$NAMESPACE" -o jsonpath='{.spec.selector.version}' 2>/dev/null || echo "blue")
    
    if [ "$ACTIVE_VERSION" == "blue" ]; then
        PREVIOUS_VERSION="green"
    else
        PREVIOUS_VERSION="blue"
    fi
    
    echo -e "${YELLOW}Current active: ${ACTIVE_VERSION}${NC}"
    echo -e "${YELLOW}Rolling back to: ${PREVIOUS_VERSION}${NC}"
    echo ""
    
    # Check if previous deployment is available
    PREV_REPLICAS=$(kubectl get deployment "engine-ops-${PREVIOUS_VERSION}" -n "$NAMESPACE" -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "0")
    
    if [ "$PREV_REPLICAS" == "0" ]; then
        echo -e "${YELLOW}Previous deployment is scaled down. Scaling up...${NC}"
        kubectl scale deployment "engine-ops-${PREVIOUS_VERSION}" --replicas=2 -n "$NAMESPACE"
        
        # Wait for pods to be ready
        kubectl wait --for=condition=ready pod \
            -l app=engine-ops,version=${PREVIOUS_VERSION} \
            -n "$NAMESPACE" \
            --timeout=120s
        
        echo -e "${GREEN}✓ Previous deployment is ready${NC}"
    fi
    
    # Health check on previous deployment
    echo -e "${YELLOW}Performing health check...${NC}"
    
    kubectl port-forward "service/engine-ops-${PREVIOUS_VERSION}" 8080:80 -n "$NAMESPACE" &
    PF_PID=$!
    sleep 3
    
    if curl -sf http://localhost:8080/api/v1/health/ready > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Previous deployment is healthy${NC}"
        kill $PF_PID 2>/dev/null || true
    else
        echo -e "${RED}✗ Previous deployment health check failed${NC}"
        kill $PF_PID 2>/dev/null || true
        exit 1
    fi
    
    # Confirm rollback
    echo ""
    read -p "Confirm rollback to ${PREVIOUS_VERSION}? (yes/no): " -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]es$ ]]; then
        echo -e "${YELLOW}Rollback cancelled${NC}"
        exit 0
    fi
    
    # Switch traffic
    echo -e "${YELLOW}Switching traffic to ${PREVIOUS_VERSION}...${NC}"
    
    kubectl patch service engine-ops-active -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"version\":\"${PREVIOUS_VERSION}\"}}}"
    
    kubectl patch service engine-ops-preview -n "$NAMESPACE" \
        -p "{\"spec\":{\"selector\":{\"version\":\"${ACTIVE_VERSION}\"}}}"
    
    echo -e "${GREEN}✓ Traffic switched to ${PREVIOUS_VERSION}${NC}"
    
    # Monitor
    sleep 5
    if kubectl wait --for=condition=ready pod \
        -l app=engine-ops,version=${PREVIOUS_VERSION} \
        -n "$NAMESPACE" \
        --timeout=30s > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Rollback successful${NC}"
    else
        echo -e "${RED}✗ Rollback verification failed${NC}"
        exit 1
    fi
}

# Function to rollback rolling deployment
rollback_rolling() {
    echo -e "${YELLOW}Initiating rolling deployment rollback...${NC}"
    
    DEPLOYMENT_NAME="engine-ops"
    
    if [ -n "$REVISION" ]; then
        echo -e "${YELLOW}Rolling back to revision ${REVISION}...${NC}"
        kubectl rollout undo deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE" --to-revision="$REVISION"
    else
        echo -e "${YELLOW}Rolling back to previous revision...${NC}"
        kubectl rollout undo deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE"
    fi
    
    # Wait for rollout
    echo -e "${YELLOW}Waiting for rollout to complete...${NC}"
    kubectl rollout status deployment/"$DEPLOYMENT_NAME" -n "$NAMESPACE" --timeout=300s
    
    echo -e "${GREEN}✓ Rollout completed${NC}"
    
    # Verify pods are ready
    if kubectl wait --for=condition=ready pod \
        -l app=engine-ops \
        -n "$NAMESPACE" \
        --timeout=60s > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Rollback successful${NC}"
    else
        echo -e "${RED}✗ Rollback verification failed${NC}"
        exit 1
    fi
}

# Main logic
if [ "$DEPLOYMENT_TYPE" == "blue-green" ]; then
    rollback_blue_green
elif [ "$DEPLOYMENT_TYPE" == "rolling" ]; then
    rollback_rolling
else
    echo -e "${RED}Error: Unknown deployment type '${DEPLOYMENT_TYPE}'${NC}"
    usage
fi

echo ""
echo -e "${GREEN}=== Rollback Complete ===${NC}"
echo -e "${BLUE}Monitor the deployment: kubectl logs -f -l app=engine-ops -n ${NAMESPACE}${NC}"
echo ""
