-- =============================================================================
-- Phase 8A — RLS verification & re-enable
-- =============================================================================
--
-- Run this in Supabase SQL Editor. It does two things:
--   1) Confirms RLS is enabled on every user-facing table
--   2) If any are disabled, enables them (idempotent — safe to re-run)
--
-- Your code uses service role (`createServiceClient`) which BYPASSES RLS, so
-- enabling these policies has zero impact on functionality. They act as a
-- safety net: if you ever switch to the anon client OR if a misconfigured
-- query ever runs as anon, the data is protected by policy.
-- =============================================================================

-- Enable RLS on all sensitive tables (idempotent)
ALTER TABLE IF EXISTS sellers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS otp_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_images       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS price_history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS boosts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reports              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS saved_lists          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS searches_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_log            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS blog_posts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS districts                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cities                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_makes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vehicle_attributes_schema ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS boost_plans              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS boost_slot_config        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rate_limits              ENABLE ROW LEVEL SECURITY;

-- Verify: show RLS status of every public table
-- (Run this query in the SQL editor to see the report)
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rls_enabled DESC, tablename;

-- =============================================================================
-- Optional: Migrate existing phone numbers to canonical +94 format
-- =============================================================================
-- If you've been storing phones in mixed formats (e.g. "0771234567" and
-- "+94771234567"), this normalizes everything to +94 form.
--
-- SAFE TO RUN: only updates rows that don't already match +94XXXXXXXXX pattern.
-- =============================================================================

-- Sellers table
UPDATE sellers
SET phone = CASE
  WHEN phone ~ '^0\d{9}$' THEN '+94' || substring(phone from 2)
  WHEN phone ~ '^94\d{9}$' THEN '+' || phone
  ELSE phone
END
WHERE phone !~ '^\+94\d{9}$';

UPDATE sellers
SET whatsapp_number = CASE
  WHEN whatsapp_number ~ '^0\d{9}$' THEN '+94' || substring(whatsapp_number from 2)
  WHEN whatsapp_number ~ '^94\d{9}$' THEN '+' || whatsapp_number
  ELSE whatsapp_number
END
WHERE whatsapp_number IS NOT NULL AND whatsapp_number !~ '^\+94\d{9}$';

-- Admin users
UPDATE admin_users
SET phone = CASE
  WHEN phone ~ '^0\d{9}$' THEN '+94' || substring(phone from 2)
  WHEN phone ~ '^94\d{9}$' THEN '+' || phone
  ELSE phone
END
WHERE phone !~ '^\+94\d{9}$';

-- OTP codes (recent only — old ones don't matter)
UPDATE otp_codes
SET phone = CASE
  WHEN phone ~ '^0\d{9}$' THEN '+94' || substring(phone from 2)
  WHEN phone ~ '^94\d{9}$' THEN '+' || phone
  ELSE phone
END
WHERE phone !~ '^\+94\d{9}$' AND created_at > now() - interval '1 day';

-- Reports
UPDATE reports
SET reporter_phone = CASE
  WHEN reporter_phone ~ '^0\d{9}$' THEN '+94' || substring(reporter_phone from 2)
  WHEN reporter_phone ~ '^94\d{9}$' THEN '+' || reporter_phone
  ELSE reporter_phone
END
WHERE reporter_phone IS NOT NULL AND reporter_phone !~ '^\+94\d{9}$';

SELECT 'Phone normalization complete' AS status;
