import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
    // Optimize image loading
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
  // Enable compression
  compress: true,
  // Performance optimizations
  poweredByHeader: false,
  // Optimize bundle size
  trailingSlash: false,
  // Optimize for production
  productionBrowserSourceMaps: false,
  // Disable x-powered-by header
  generateEtags: false,
  // Optimize static generation
  staticPageGenerationTimeout: 120,
  // Enable SWC minification
  swcMinify: true,
};

export default nextConfig;
