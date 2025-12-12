#!/bin/bash
# Railway startup script for Next.js
# Ensures PORT is explicitly used and service listens on 0.0.0.0

set -e

# Get port from Railway or default to 3000
PORT=${PORT:-3000}

# Debug: Print environment info
echo "=========================================="
echo "Starting Next.js Frontend"
echo "Port: $PORT"
echo "Host: 0.0.0.0"
echo "Environment: ${NODE_ENV:-production}"
echo "Working Directory: $(pwd)"
echo "Next.js Version: $(next --version 2>/dev/null || echo 'unknown')"
echo "=========================================="

# Verify we're in the frontend directory
if [ ! -f "package.json" ]; then
  echo "ERROR: package.json not found. Current directory: $(pwd)"
  exit 1
fi

# Verify Next.js is available
if ! command -v next &> /dev/null; then
  echo "ERROR: next command not found. Installing dependencies..."
  pnpm install --frozen-lockfile
fi

# Start Next.js with explicit port and host
# Use exec to replace shell process with Next.js
echo "Executing: next start -H 0.0.0.0 -p $PORT"
exec next start -H 0.0.0.0 -p "$PORT"

