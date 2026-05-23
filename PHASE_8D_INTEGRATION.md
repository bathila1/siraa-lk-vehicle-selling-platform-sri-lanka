# Phase 8D Integration Guide

SEO landing pages + performance.

## What's new

| File | Purpose |
|---|---|
| `supabase/migrations/00009_phase8d_seo_perf.sql` | Adds blur_data_url col + SEO indexes |
| `lib/db/seo-queries.ts` | All landing-page query helpers |
| `lib/r2/blur-placeholder.ts` | LQIP generator (tiny base64 blur) |
| `app/categories/page.tsx` | Categories index |
| `app/cars/[type]/page.tsx` | Type landing (e.g. `/cars/car`, `/cars/suv-jeep`) |
| `app/cars/[type]/[make]/page.tsx` | Type+make landing (e.g. `/cars/car/toyota`) |
| `app/locations/page.tsx` | All districts |
| `app/locations/[district]/page.tsx` | District landing (e.g. `/locations/colombo`) |
| `app/price-guide/page.tsx` | Price guide index |
| `app/price-guide/[slug]/page.tsx` | Make+model price guide (e.g. `/price-guide/toyota-aqua`) |
| `app/sitemap.ts` | Updated to include ALL new pages |
| `app/robots.ts` | Updated with new allow/disallow rules |
| `app/page.tsx` | Homepage category icons now link to `/cars/[type]` (SEO) |

## Required steps

### Step 1 — Run SQL migration

Supabase Dashboard → SQL Editor → run `00009_phase8d_seo_perf.sql`. Adds:
- `blur_data_url` column on `vehicle_images`
- 4 performance indexes for new landing pages

### Step 2 — That's it

Everything else works automatically. Visit:

| URL | Page |
|---|---|
| `/categories` | All vehicle types |
| `/cars/car` | All cars (by make) |
| `/cars/car/toyota` | All Toyota cars + popular models + stats |
| `/locations` | All districts |
| `/locations/colombo` | Vehicles in Colombo + cities list |
| `/price-guide` | Top models with price data |
| `/price-guide/toyota-aqua` | Year/mileage price breakdown |
| `/sitemap.xml` | Now lists all the above for Google |
| `/robots.txt` | Updated rules |

## Page hierarchy

```
/                                  # Homepage
├── /categories                    # All vehicle types
│   └── /cars/[type]               # e.g. /cars/car
│       └── /cars/[type]/[make]    # e.g. /cars/car/toyota
├── /locations                     # All districts
│   └── /locations/[district]      # e.g. /locations/colombo
└── /price-guide                   # Popular models
    └── /price-guide/[slug]        # e.g. /price-guide/toyota-aqua
```

## SEO benefits

1. **Hundreds of new indexable pages** — every type, every type+make combo, every district, every popular price guide. Google loves volume of unique pages.

2. **Long-tail search wins** — someone searching "used Toyota Aqua price Sri Lanka" will land on `/price-guide/toyota-aqua` (high intent buyer).

3. **Internal linking** — every landing page links to others (breadcrumbs, related categories, popular models). Helps Google crawl & PageRank flow.

4. **JSON-LD schema** — breadcrumb schemas on every landing page = rich results in Google.

5. **Image optimization ready** — blur_data_url column exists. Future image uploads can populate it (LQIP generator in `lib/r2/blur-placeholder.ts`).

## Image optimization — using LQIP going forward

When uploading new images via your post-ad flow, generate the blur placeholder server-side:

```typescript
import { generateBlurPlaceholder } from '@/lib/r2/blur-placeholder';

// In your upload pipeline:
const blurDataUrl = await generateBlurPlaceholder(imageBuffer);
// Save it to vehicle_images.blur_data_url along with the URL
```

Then in your Next.js Image components:

```tsx
<Image
  src={image.url}
  alt="..."
  fill
  placeholder={image.blur_data_url ? 'blur' : 'empty'}
  blurDataURL={image.blur_data_url ?? undefined}
  sizes="(max-width: 640px) 50vw, 200px"
/>
```

## Caching strategy

| Page | revalidate | Why |
|---|---|---|
| `/categories` | 3600s (1h) | Vehicle types rarely change |
| `/cars/[type]` | 1800s (30min) | New listings appear |
| `/cars/[type]/[make]` | 1800s (30min) | Stats need to be fresh |
| `/locations/[district]` | 1800s (30min) | New listings appear |
| `/price-guide/[slug]` | 21600s (6h) | Expensive query, slow-changing data |
| `/sitemap.xml` | Dynamic | Always fresh |
| `/robots.txt` | Static | Never changes |

## SEO checklist (do these after deploy)

- [ ] Submit `/sitemap.xml` to Google Search Console
- [ ] Submit to Bing Webmaster Tools
- [ ] Test mobile-friendly: https://search.google.com/test/mobile-friendly
- [ ] Test rich results: https://search.google.com/test/rich-results
- [ ] Verify `/robots.txt` blocks `/admin` and `/dashboard`
- [ ] Visit a few landing pages, confirm breadcrumbs render
- [ ] Check page-load speed with Lighthouse (aim for >85)
