# Siraa.lk — Sri Lankan Vehicle Marketplace

> A fast, SEO-first, mobile-first vehicle marketplace built for Sri Lanka. Open source.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E)](https://supabase.com)

**Status:** 🚧 Work in progress — Phase 1 (Foundation) in active development.

---

## What this is

Siraa is a vehicle marketplace specifically designed for the Sri Lankan market — targeting *registered, used vehicles* sold by individual owners (not large dealerships).

It exists because the current Sri Lankan options (riyasewana.lk, ikman.lk) have well-known shortcomings: stale ads of already-sold vehicles, dated UI, weak mobile experience, poor search relevance, and intrusive layouts. Siraa is the focused, modern alternative.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16.2 LTS (App Router) | SSR/SSG/ISR for SEO + speed |
| Language | TypeScript (strict) | Type safety end-to-end |
| Database | PostgreSQL via Supabase | Free tier, RLS, full-text search |
| Auth | Phone OTP via SMSLenz | No email, no friction |
| Image storage | Cloudflare R2 | Free 10 GB + free egress |
| Payments | PayHere | Sri Lankan gateway |
| Hosting | Vercel | Edge cache + free tier |
| Styling | Tailwind CSS + CSS variables | Smallest CSS payload |
| Search | Postgres `pg_trgm` + FTS | Fuzzy match, free, fast |
| Bot protection | hCaptcha (invisible) | Zero-friction for humans |
| Analytics | Google Analytics 4 | + Search Console integration |

## Features

### MVP (in development)
- 📱 Phone OTP signup (Sri Lankan numbers, +94)
- 🚗 Free unlimited posting (first 100 sellers promo)
- 🔍 Smart search bar with fuzzy match, autocomplete, smart parsing
- 💸 Paid boosting (NormalBoost / BoostPro)
- 💬 WhatsApp + call deeplinks
- 📍 Google Maps location pin per vehicle
- 🛡️ Report & remove sold vehicles
- 📊 Full admin panel with CRUD, audit log, dynamic attribute schema
- 💾 Save vehicles without signup (localStorage + shareable link)
- 📈 Price-drop tracking
- 🇱🇰 Singlish UI with Sinhala accents

### Planned for v2
- Saved ads with seller accounts
- Seller ratings
- In-app chat (currently WhatsApp deeplink only)
- Mobile app

## Quickstart

### Prerequisites
- Node.js 20 or later
- Supabase CLI: `npm install -g supabase`
- A Supabase project (free tier works)
- A Cloudflare account (for R2)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/bathila1/siraa-lk-vehicle-selling-platform-sri-lanka.git
cd siraa-lk-vehicle-selling-platform-sri-lanka

# 2. Install dependencies
npm install

# 3. Copy env template and fill in values
cp .env.example .env.local

# 4. Run database migrations against your Supabase project
supabase link --project-ref your-project-ref
supabase db push

# 5. Seed reference data (districts, cities, makes, etc.)
psql "$SUPABASE_DB_URL" -f supabase/seed/01_districts_cities.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/02_vehicle_types.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/03_vehicle_makes.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/04_boost_plans.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/05_attributes_schema.sql
psql "$SUPABASE_DB_URL" -f supabase/seed/06_site_settings.sql

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — Turbopack-powered, ~400ms cold start.

## Project structure

```
siraa-lk/
├── app/                    Next.js App Router pages
│   ├── (public)/           Public-facing routes
│   ├── (auth)/             Seller dashboard, post-ad
│   ├── admin/              Admin panel (middleware-protected)
│   └── api/                Route handlers
├── components/             Reusable UI components
├── lib/                    Server/client utilities
│   ├── supabase/           Supabase clients
│   ├── search/             Smart search, FTS query builder
│   ├── payhere/            PayHere integration
│   ├── smslenz/            SMS OTP integration
│   ├── r2/                 Cloudflare R2 uploads
│   └── validations/        Zod schemas
├── supabase/
│   ├── migrations/         SQL migrations
│   └── seed/               Reference data seeds
├── types/                  TypeScript types
└── locales/                Singlish (en) + Sinhala (si) strings
```

## Architecture decisions

See [`docs/`](./docs) for the full set of decision records (ADRs).

Highlights:
- **SSG + ISR**: vehicle pages are statically generated, revalidated on edit. Google sees fully-rendered HTML.
- **Slug-based URLs**: `/vehicle/toyota-aqua-2015-colombo-abc123` — readable, SEO-friendly.
- **JSON-LD per listing**: `Vehicle` schema for Google rich results.
- **Dynamic sitemap**: auto-generated from the database.
- **No buyer accounts at MVP**: lowest possible friction.
- **Phone OTP only**: kills 80%+ of scammers immediately. SMSLenz with `SiraaLK` sender.
- **R2 for images, not Supabase Storage**: free egress means no surprise bills.
- **Admin-editable everything**: boost prices, slot counts, custom attribute fields per vehicle type — no redeploys to change business rules.

## Security

- Zod validation on every input (frontend + server)
- Supabase Row Level Security on all tables
- Rate limiting in Next.js middleware (10 req/s per IP for writes)
- CSRF protection via SameSite cookies
- hCaptcha (invisible) before OTP send to protect SMS credit
- EXIF stripping + WebP conversion on image upload
- All secrets via env vars, never committed
- Audit log for every admin action

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) — note that the "Siraa" name and logo are trademarks of the project owner and not covered by the code license.

## Acknowledgments

Built by [Bathila](mailto:bathi.solutions@gmail.com) — University of Moratuwa.

---

*අභිමානවත් ශ්‍රී ලාංකීය නිර්මාණයකි · A proudly Sri Lankan creation.*
