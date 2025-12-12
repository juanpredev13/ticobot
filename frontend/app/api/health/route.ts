import { NextResponse } from 'next/server';

/**
 * Health check endpoint for Railway
 * Railway can use this to verify the service is ready
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'ticobot-frontend',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  });
}

