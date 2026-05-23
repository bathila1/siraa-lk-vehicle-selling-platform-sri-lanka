import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/search',
          '/vehicle/',
          '/categories',
          '/cars/',
          '/locations',
          '/price-guide',
          '/blog',
          '/seller/',
          '/about',
          '/contact',
          '/terms',
          '/privacy',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/admin',
          '/admin/',
          '/api/',
          '/login',
          '/post-ad',
          '/payment/',
          '/report/',
        ],
      },
      // Block known bad bots
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'MJ12bot'],
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
