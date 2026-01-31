/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint config removed - Next.js 16 no longer supports it in next.config.mjs
  // Use .eslintrc.json or eslint.config.js instead
  images: {
    unoptimized: true,
  },
  // Hide dev indicators for demo mode
  devIndicators: false,
  // Explicitly define environment variables for Railway
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT || '30000',
    NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS: process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS || 'false',
  },
  // Skip static generation for error pages to avoid build-time issues
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

export default nextConfig