import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const supabase = await createClient();

    // Active vehicle slugs
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('slug, updated_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5000);

    const vehicleRoutes: MetadataRoute.Sitemap = (vehicles ?? []).map((v) => ({
      url: `${SITE_URL}/vehicle/${v.slug}`,
      lastModified: new Date(v.updated_at),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // Published blog posts
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    return [...staticRoutes, ...vehicleRoutes, ...blogRoutes];
  } catch {
    return staticRoutes;
  }
}
