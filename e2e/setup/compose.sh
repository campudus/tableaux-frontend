#!/bin/bash

# Determine which container runtime is available
if command -v docker &> /dev/null; then
  CONTAINER_CMD="docker"
elif command -v podman &> /dev/null; then
  CONTAINER_CMD="podman"
else
  echo "Error: Neither docker nor podman found!"
  exit 1
fi

echo "Using container runtime: $CONTAINER_CMD"

# Handle 'up' command differently to ensure the command is not hanging due to existing containers
if [[ "$@" == *"up"* ]]; then
  # Check if containers are already running
  RUNNING_CONTAINERS=$($CONTAINER_CMD compose -f ./e2e/setup/compose.yaml ps -q 2>/dev/null | wc -l)
  
  if [ "$RUNNING_CONTAINERS" -gt 0 ]; then
    # Containers are running, do nothing
    echo "Containers are already running."
  else
    # Containers are not running, clean up and recreate
    echo "Starting containers..."
    $CONTAINER_CMD compose -f ./e2e/setup/compose.yaml down 2>/dev/null
    $CONTAINER_CMD compose -f ./e2e/setup/compose.yaml up -d
  fi
else
  # Execute other compose commands normally
  $CONTAINER_CMD compose -f ./e2e/setup/compose.yaml "$@"
fi
