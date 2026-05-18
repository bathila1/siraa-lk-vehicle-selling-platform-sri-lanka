import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Skip typecheck during build (we still typecheck in CI separately)
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    remotePatterns: [
      // Cloudflare R2 public bucket — replace with your actual R2 public domain
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.siraa.lk',
      },
      // Supabase storage fallback (if used)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Hardening headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ];
  },

  // i18n is handled at the app router level via Singlish strings, no built-in i18n needed
  experimental: {
    // Enable when stable on your version
    // reactCompiler: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};

export default nextConfig;
