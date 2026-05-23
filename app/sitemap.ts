import type { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase/server';
import { slugifyLocation } from '@/lib/db/seo-queries';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://siraa.lk';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'hourly', priority: 1.0 },
    { url: `${SITE_URL}/search`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/locations`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/price-guide`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  try {
    const supabase = createServiceClient();

    // ===== Vehicles (active) =====
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('slug, updated_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(10000);

    const vehicleRoutes: MetadataRoute.Sitemap = (vehicles ?? []).map((v: any) => ({
      url: `${SITE_URL}/vehicle/${v.slug}`,
      lastModified: new Date(v.updated_at),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    // ===== Blog posts =====
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true)
      .order('published_at', { ascending: false });

    const blogRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p: any) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    // ===== Sellers (public profiles) =====
    const { data: sellers } = await supabase
      .from('sellers')
      .select('id, updated_at')
      .is('banned_at', null)
      .order('updated_at', { ascending: false })
      .limit(5000);

    const sellerRoutes: MetadataRoute.Sitemap = (sellers ?? []).map((s: any) => ({
      url: `${SITE_URL}/seller/${s.id}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: 'weekly',
      priority: 0.5,
    }));

    // ===== Category landing pages (vehicle types + types×makes) =====
    const { data: types } = await supabase
      .from('vehicle_types')
      .select('id, slug')
      .eq('active', true);

    const { data: makes } = await supabase
      .from('vehicle_makes')
      .select('id, slug, type_ids')
      .eq('active', true);

    const categoryRoutes: MetadataRoute.Sitemap = [];

    if (types) {
      // /cars/[type]
      for (const t of types as any[]) {
        categoryRoutes.push({
          url: `${SITE_URL}/cars/${t.slug}`,
          lastModified: now,
          changeFrequency: 'daily',
          priority: 0.7,
        });

        // /cars/[type]/[make]
        if (makes) {
          for (const m of makes as any[]) {
            if (m.type_ids?.includes(t.id)) {
              categoryRoutes.push({
                url: `${SITE_URL}/cars/${t.slug}/${m.slug}`,
                lastModified: now,
                changeFrequency: 'daily',
                priority: 0.6,
              });
            }
          }
        }
      }
    }

    // ===== Location landing pages =====
    const { data: districts } = await supabase
      .from('districts')
      .select('id, name_en')
      .order('sort_order');

    const locationRoutes: MetadataRoute.Sitemap = (districts ?? []).map((d: any) => ({
      url: `${SITE_URL}/locations/${slugifyLocation(d.name_en)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    }));

    // City pages: only include cities that have at least 1 active listing
    const { data: citiesWithListings } = await supabase
      .from('vehicles')
      .select('city_id, cities ( id, name_en, district_id, districts ( name_en ) )')
      .eq('status', 'active')
      .not('city_id', 'is', null);

    const seenCities = new Set<number>();
    const cityRoutes: MetadataRoute.Sitemap = [];
    (citiesWithListings ?? []).forEach((row: any) => {
      const city = row.cities;
      if (!city || seenCities.has(city.id) || !city.districts?.name_en) return;
      seenCities.add(city.id);
      cityRoutes.push({
        url: `${SITE_URL}/locations/${slugifyLocation(city.districts.name_en)}/${slugifyLocation(city.name_en)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.5,
      });
    });

    // ===== Price guide pages (top models with sufficient data) =====
    const { data: priceModels } = await supabase
      .from('vehicles')
      .select('make_id, model, vehicle_makes ( slug )')
      .in('status', ['active', 'sold'])
      .limit(5000);

    const modelCounts = new Map<string, { slug: string; count: number }>();
    (priceModels ?? []).forEach((v: any) => {
      if (!v.model || !v.vehicle_makes?.slug) return;
      const modelSlug = `${v.vehicle_makes.slug}-${v.model.toLowerCase().replace(/\s+/g, '-')}`;
      const existing = modelCounts.get(modelSlug);
      if (existing) {
        existing.count++;
      } else {
        modelCounts.set(modelSlug, { slug: modelSlug, count: 1 });
      }
    });

    // Only include models with enough data for a useful guide (5+)
    const priceGuideRoutes: MetadataRoute.Sitemap = Array.from(modelCounts.values())
      .filter((m) => m.count >= 5)
      .map((m) => ({
        url: `${SITE_URL}/price-guide/${m.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
      }));

    return [
      ...staticRoutes,
      ...vehicleRoutes,
      ...blogRoutes,
      ...sellerRoutes,
      ...categoryRoutes,
      ...locationRoutes,
      ...cityRoutes,
      ...priceGuideRoutes,
    ];
  } catch (err) {
    console.error('[sitemap] generation failed:', err);
    return staticRoutes;
  }
}
