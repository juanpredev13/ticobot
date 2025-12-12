#!/bin/bash
# Railway startup script for Next.js
# Ensures PORT is explicitly used and service listens on 0.0.0.0

set -e

# Get port from Railway or default to 3000
PORT=${PORT:-3000}

echo "=========================================="
echo "Starting Next.js Frontend"
echo "Port: $PORT"
echo "Host: 0.0.0.0"
echo "Environment: ${NODE_ENV:-production}"
echo "=========================================="

# Start Next.js with explicit port and host
# Use exec to replace shell process with Next.js
exec next start -H 0.0.0.0 -p "$PORT"

