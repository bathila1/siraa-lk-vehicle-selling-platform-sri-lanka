# Phase 8C Integration Guide

## What's new

| File | Purpose |
|---|---|
| `supabase/migrations/00008_phase8c_engagement.sql` | DB: trusted seller fields + notifications table |
| `components/ui/VerifiedBadge.tsx` | Trust badge (3 tiers: trusted/verified/none) |
| `components/auth/NotificationBell.tsx` | Bell icon with dropdown |
| `components/admin/SellerRowActions.tsx` | Updated with trust toggle |
| `app/admin/sellers/page.tsx` | Updated with trust column + filter |
| `app/api/admin/sellers/[id]/trust/route.ts` | Grant/revoke trusted status |
| `app/api/notifications/route.ts` | List notifications |
| `app/api/notifications/count/route.ts` | Unread count (polled by bell) |
| `app/api/notifications/[id]/read/route.ts` | Mark one read |
| `app/api/notifications/read-all/route.ts` | Mark all read |
| `app/dashboard/notifications/page.tsx` | Full notifications page |
| `components/search/RecentSearches.tsx` | localStorage search history |
| `components/search/SearchBar.tsx` | Updated to save searches |
| `components/shared/Confetti.tsx` | Canvas confetti, no deps |
| `components/shared/CelebrationConfetti.tsx` | URL-trigger wrapper |
| `styles/transitions.css` | View Transitions API + click bounce |
| `app/layout.tsx` | Imports transitions.css |
| `app/api/cron/expire-boosts/route.ts` | Updated to send notifications |

## Required setup

### Step 1 — Run the SQL migration

Supabase Dashboard → SQL Editor → run `00008_phase8c_engagement.sql`. This adds:
- `trusted_at`, `trusted_by_admin`, `trusted_reason` columns to `sellers`
- New `notifications` table + RLS policies
- `cleanup_old_notifications()` function 

### Step 2 — Wire NotificationBell into Header

Open `components/shared/Header.tsx` and add the bell next to user actions (only for logged-in sellers):

```tsx
import { NotificationBell } from '@/components/auth/NotificationBell';

// Inside Header, find the auth section (logged-in user actions area)
// Add the bell before "My Ads" or wherever you want it:

)}
```

The bell shows nothing until there are notifications, so it's safe to always render for logged-in users.

### Step 3 — Show VerifiedBadge on seller name

In any place that displays a seller name (vehicle detail, seller profile, dashboard), import and use:

```tsx
import { VerifiedBadge, getTrustTier } from '@/components/ui/VerifiedBadge';

// Wherever a seller name is shown:
<span className="flex items-center gap-1.5">
  {seller.full_name}
  <VerifiedBadge tier={getTrustTier(seller)} />
</span>
```

**Files to update:**
- `app/vehicle/[slug]/page.tsx` — next to seller name in the contact card
- `app/seller/[id]/page.tsx` — already shows "Phone verified", replace with ``

Make sure your DB queries select `trusted_at` and `verified_at` on sellers.

### Step 4 — Add RecentSearches to homepage

Open `app/page.tsx`. Add somewhere below the main search bar (probably below the hero section):

```tsx
import { RecentSearches } from '@/components/search/RecentSearches';

// In the JSX, e.g. after the search bar section:

```

It only renders if there are saved searches, so safe to put anywhere.

### Step 5 — Add confetti on celebration moments

In `app/dashboard/page.tsx`, add at the top of the JSX:

```tsx
import { CelebrationConfetti } from '@/components/shared/CelebrationConfetti';

// In the return JSX:
<>
  {/* rest of dashboard */}
</>
```

Now whenever someone returns to `/dashboard?posted=<slug>` after posting an ad, confetti fires automatically.

You can also fire it manually:

```tsx

```

**Suggested moments to wire confetti:**
- First ad posted ✅ (already wired via dashboard ?posted=)
- Boost activated → in `app/dashboard/boost/[id]/page.tsx` when status changes to active
- First sale → when marking sold for the first time
- Account creation → on first dashboard visit

### Step 6 — Page transitions are automatic

`styles/transitions.css` is already imported in layout. All page navigations now have a subtle fade-in.

If you want stronger transitions on specific elements, add `style={{ viewTransitionName: 'something' }}` to elements you want to morph between pages (advanced — usually not needed).

## Testing checklist

| Feature | How to test |
|---|---|
| Trusted badge | Go to `/admin/sellers` → click "Trust" on a seller → visit their profile → see blue badge |
| Notification bell | Run the cron once (or manually insert a notification) → bell shows red dot |
| Recent searches | Search for "Toyota" → search for "Aqua" → return to homepage → chips appear |
| Confetti | Post a new ad → returns to `/dashboard?posted=...` → confetti fires |
| Page transitions | Navigate between any pages → subtle fade-up |
| Cron notifications | Manually call cron endpoint (with auth) → check notifications table for boost_expires_soon entries |

## Auto-notification triggers

The cron now creates notifications for:

| Event | When | Title |
|---|---|---|
| Boost expiring soon | 24h before expiry | "Boost expiring soon" |
| Boost expired | At expiry | "{plan} expired" |
| Trusted status granted | On admin action | "You are now a Trusted Seller!" |

To add more triggers (e.g. when a report is filed against an ad), insert into `notifications` table from the relevant API route. Example:

```typescript
await supabase.from('notifications').insert({
  seller_id: vehicleSellerId,
  category: 'ad_reported',
  title: 'Your ad was reported',
  body: 'A user reported your ad. We will review it shortly.',
  link_url: `/dashboard`,
});
```
