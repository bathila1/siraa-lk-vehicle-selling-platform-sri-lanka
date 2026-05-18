/**
 * Homepage — Phase 1 functional skeleton.
 *
 * Real homepage (Phase 2) will include:
 *  - BoostPro hero carousel (6 rotating slots)
 *  - Vehicle type icons grid
 *  - Search bar with autocomplete + smart parser
 *  - Latest ads feed (paginated)
 *  - Popular searches chips
 *  - Blog teaser strip
 *  - Promo banner for first-100-sellers
 *
 * For now: a sanity-check page that proves the server, fonts, and Supabase
 * connection are wired up.
 */

export default function HomePage() {
  return (
    <main>
      <h1>Siraa.lk</h1>
      <p>Sri Lanka&apos;s vehicle marketplace</p>
      <p className="lang-si">අභිමානවත් ශ්‍රී ලාංකීය නිර්මාණයකි</p>
      <p>
        <strong>Status:</strong> Phase 1 (Foundation) — backend and schema in place.
        Real UI lands in Phase 2.
      </p>
    </main>
  );
}
