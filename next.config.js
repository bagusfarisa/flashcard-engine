/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: '',
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID || '', // Google Analytics Measurement ID
  },
  // Handle base path for production deployments
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn', 'info'], // Keep important logs
    } : false,
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@heroicons/react', 'framer-motion'],
  },
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  // Ensure static files are copied correctly
  output: 'standalone',
  // Disable automatic static optimization for pages that need 
  // to load dynamic content
  staticPageGenerationTimeout: 300,
};

module.exports = nextConfig;
