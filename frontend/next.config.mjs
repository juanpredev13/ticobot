/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT || '30000',
    NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS: process.env.NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS || 'false',
  },
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Disable standalone output to avoid symlink issues on Windows
  // webpack: (config, { isServer }) => {
  //   if (!isServer) {
  //     config.resolve.symlinks = false
  //   }
  //   return config
  // },
  // Empty turbopack config to avoid conflicts
  turbopack: {},
}

export default nextConfig