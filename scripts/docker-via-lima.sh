#!/bin/bash
# Helper script to use Docker via Lima VM
# This script forwards Docker commands to the Lima VM

# Check if Lima VM is running
if ! limactl list | grep -q "default.*Running"; then
    echo "Lima VM is not running. Starting it..."
    limactl start default
    sleep 5
fi

# Use lima to execute docker commands in the VM
lima docker "$@"

