#!/bin/bash
set -e

echo "Checking for Homebrew..."
if ! command -v brew &> /dev/null; then
    echo "Homebrew not found. Please install Homebrew first."
    exit 1
fi

echo "Checking if Lima VM is already running..."
if limactl list | grep -q "default.*Running"; then
    echo "Lima VM is already running. Stopping to apply new configuration..."
    limactl stop default
fi

echo "Starting Lima with Ubuntu 22.04..."
# We use limactl directly to avoid Colima's image validation issues
# The lima.yaml includes Docker socket forwarding configuration
limactl start --name=default --tty=false lima.yaml

echo "Waiting for Docker socket to be available..."
sleep 5

echo "Configuring Docker context..."
# Create the socket directory if it doesn't exist
mkdir -p ~/.lima/default/sock

# Set Docker host to use the forwarded socket
export DOCKER_HOST="unix://${HOME}/.lima/default/sock/docker.sock"

echo "Verifying Docker connection..."
if docker ps &>/dev/null; then
    echo "✓ Docker is accessible from host!"
    docker ps
else
    echo "⚠ Docker socket not yet available. You can use:"
    echo "  lima docker ps"
    echo "  OR"
    echo "  export DOCKER_HOST=\"unix://${HOME}/.lima/default/sock/docker.sock\""
    echo "  docker ps"
fi

echo ""
echo "Setup complete! Lima is running."
echo "To use Docker, either:"
echo "  1. Use 'lima docker <command>' (e.g., 'lima docker ps')"
echo "  2. Or set: export DOCKER_HOST=\"unix://${HOME}/.lima/default/sock/docker.sock\""

