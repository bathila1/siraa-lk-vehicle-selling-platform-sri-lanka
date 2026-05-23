// import type { NextConfig } from 'next';

// const nextConfig: NextConfig = {
//   reactStrictMode: true,
//   poweredByHeader: false,
//   compress: true,

//   // Skip typecheck during build (we still typecheck in CI separately)
//   typescript: {
//     ignoreBuildErrors: true,
//   },

//   images: {
//     formats: ['image/avif', 'image/webp'],
//     deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
//     imageSizes: [16, 32, 64, 96, 128, 256],
//     remotePatterns: [
//       // Cloudflare R2 public bucket — replace with your actual R2 public domain
//       {
//         protocol: 'https',
//         hostname: '*.r2.dev',
//       },
//       {
//         protocol: 'https',
//         hostname: 'siraa.lk',
//       },
//       // Supabase storage fallback (if used)
//       {
//         protocol: 'https',
//         hostname: '*.supabase.co',
//       },
//     ],
//   },

//   // Hardening headers for production
//   async headers() {
//     return [
//       {
//         source: '/(.*)',
//         headers: [
//           { key: 'X-Content-Type-Options', value: 'nosniff' },
//           { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
//           { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
//           { key: 'X-DNS-Prefetch-Control', value: 'on' },
//           {
//             key: 'Strict-Transport-Security',
//             value: 'max-age=63072000; includeSubDomains; preload',
//           },
//           {
//             key: 'Permissions-Policy',
//             value: 'camera=(), microphone=(), geolocation=(self)',
//           },
//         ],
//       },
//     ];
//   },

//   // i18n is handled at the app router level via Singlish strings, no built-in i18n needed
//   experimental: {
//     // Enable when stable on your version
//     // reactCompiler: true,
//     optimizePackageImports: ['lucide-react', 'date-fns'],
//   },
// };

// export default nextConfig;

import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// Content Security Policy — what's allowed to load on your pages.
// Tightening this is the single biggest XSS protection.
// const cspDirectives = [
//   "default-src 'self'",
//   // Scripts: self + inline (Next.js needs this) + Google Analytics + PayHere + Turnstile
//   `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://www.payhere.lk https://sandbox.payhere.lk`,
//   // Styles: self + inline (Tailwind injects styles) + Google Fonts
//   "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
//   // Fonts: Google Fonts CDN
//   "font-src 'self' https://fonts.gstatic.com data:",
//   // Images: anywhere (R2, user uploads, etc) + data URIs for blur placeholders
//   "img-src 'self' data: blob: https:",
//   // Network: API calls — Supabase, R2, PayHere, GA, your own domain
//   "connect-src 'self' https://*.supabase.co https://*.r2.dev https://images.siraa.lk https://www.google-analytics.com https://*.google-analytics.com https://challenges.cloudflare.com https://www.payhere.lk https://sandbox.payhere.lk https://i.ytimg.com",
//   // Iframes: only YouTube (lazy embed) + Turnstile + PayHere
//   "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://challenges.cloudflare.com https://www.payhere.lk https://sandbox.payhere.lk",
//   // Forms: only post to self + PayHere
//   "form-action 'self' https://www.payhere.lk https://sandbox.payhere.lk",
//   // Don't allow being embedded in iframes (anti-clickjacking)
//   "frame-ancestors 'none'",
//   // Block all object/embed tags (Flash etc)
//   "object-src 'none'",
//   // Force HTTPS for all subresources
//   'upgrade-insecure-requests',
//   // Limit base URL to prevent base-tag injection
//   "base-uri 'self'",
// ].join('; ');

const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://www.googletagmanager.com https://www.google-analytics.com https://challenges.cloudflare.com https://www.payhere.lk https://sandbox.payhere.lk`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co https://*.r2.dev https://*.r2.cloudflarestorage.com https://images.siraa.lk https://www.google-analytics.com https://*.google-analytics.com https://challenges.cloudflare.com https://www.payhere.lk https://sandbox.payhere.lk https://i.ytimg.com",
  "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://challenges.cloudflare.com https://www.payhere.lk https://sandbox.payhere.lk",
  "form-action 'self' https://www.payhere.lk https://sandbox.payhere.lk",
  "frame-ancestors 'none'",
  "object-src 'none'",
  'upgrade-insecure-requests',
  "base-uri 'self'",
].join('; ');
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  typescript: {
    // TODO Phase 8B: generate real Supabase types and remove this
    ignoreBuildErrors: true,
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'siraa.lk' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(self), payment=(self), usb=(), browsing-topics=()',
          },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Content-Security-Policy', value: cspDirectives },
        ],
      },
      // API routes: no caching, no indexing
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      // Admin: never cache or index
      {
        source: '/admin/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      // Dashboard: never index
      {
        source: '/dashboard/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
