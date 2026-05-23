-- =============================================================================
-- 00008_phase8c_engagement.sql
-- Phase 8C — Engagement features
--   - Trusted seller flag (manual admin verification)
--   - Notifications table for the bell-icon dropdown
-- =============================================================================

-- ---------- Trusted seller flag ----------
-- `verified_at` already exists and means "phone-OTP verified" (automatic).
-- `trusted_at` is the new manual verification (set by admin).
ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS trusted_at        timestamptz,
  ADD COLUMN IF NOT EXISTS trusted_by_admin  uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS trusted_reason    text;

CREATE INDEX IF NOT EXISTS sellers_trusted_idx
  ON sellers (trusted_at) WHERE trusted_at IS NOT NULL;

-- ---------- Notifications table ----------
-- Per-seller notifications that the bell-icon dropdown reads from.
-- Categories:
--   'boost_expires_soon' - 24h before boost expires
--   'boost_expired'      - when boost actually expires
--   'ad_reported'        - admin notification (also for seller)
--   'ad_approved'        - after manual moderation (future)
--   'system'             - general announcements
CREATE TABLE IF NOT EXISTS notifications (
  id           bigserial PRIMARY KEY,
  seller_id    uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  category     text NOT NULL,
  title        text NOT NULL,
  body         text,
  link_url     text,
  read_at      timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_seller_unread_idx
  ON notifications (seller_id, created_at DESC) WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS notifications_seller_recent_idx
  ON notifications (seller_id, created_at DESC);

-- Auto-delete old notifications (older than 90 days)
-- We'll call this from the daily cron.
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM notifications WHERE created_at < now() - interval '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Enable RLS (safety net — code uses service role)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Sellers can read their own notifications
CREATE POLICY IF NOT EXISTS "notifications seller read"
  ON notifications FOR SELECT
  USING (seller_id = current_seller_id());

-- Sellers can mark their own as read
CREATE POLICY IF NOT EXISTS "notifications seller update"
  ON notifications FOR UPDATE
  USING (seller_id = current_seller_id())
  WITH CHECK (seller_id = current_seller_id());

SELECT 'Phase 8C schema applied' AS status;
