-- =============================================================================
-- 04_boost_plans.sql
-- The two boost plans (NormalBoost, BoostPro) + slot configuration.
-- All editable from admin panel later.
-- =============================================================================

insert into boost_plans (name, type, price, duration_days, description, active, sort_order) values
  ('NormalBoost', 'normal', 500,   7,
   'Get pinned above non-boosted ads in search results for 7 days. Includes "Boosted" badge.',
   true, 1),
  ('BoostPro',    'pro',    1500, 14,
   'Top placement above all other ads + featured on homepage carousel for 14 days. Includes "Pro" badge.',
   true, 2)
on conflict do nothing;

-- ---------- Slot configuration ----------
-- How many boosted ads to show in each placement.
insert into boost_slot_config (slot_key, count, description) values
  ('homepage_hero',     6, 'BoostPro ads shown in rotating hero carousel on homepage'),
  ('search_top_pro',    2, 'BoostPro ads pinned at the top of search results'),
  ('search_top_normal', 3, 'NormalBoost ads pinned just below BoostPro slots in search')
on conflict (slot_key) do nothing;
