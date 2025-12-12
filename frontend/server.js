#!/usr/bin/env node
/**
 * Railway startup script for Next.js
 * Ensures PORT is explicitly used and service listens on 0.0.0.0
 */

const { spawn } = require('child_process');
const path = require('path');

// Get port from Railway or default to 3000
const PORT = process.env.PORT || '3000';

console.log('==========================================');
console.log('Starting Next.js Frontend');
console.log(`Port: ${PORT}`);
console.log('Host: 0.0.0.0');
console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
console.log(`Working Directory: ${process.cwd()}`);
console.log('==========================================');

// Start Next.js with explicit port and host
const nextProcess = spawn('next', ['start', '-H', '0.0.0.0', '-p', PORT], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: PORT,
  },
});

nextProcess.on('error', (error) => {
  console.error('Failed to start Next.js:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  process.exit(code || 0);
});

