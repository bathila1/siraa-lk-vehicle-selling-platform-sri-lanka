-- =============================================================================
-- 00009_phase8d_seo_perf.sql
-- Phase 8D — SEO & image optimization schema changes
-- =============================================================================

-- Add blur placeholder column for vehicle_images.
-- Stores a base64-encoded tiny JPEG (~1-2 KB) for blur-up loading.
ALTER TABLE vehicle_images
  ADD COLUMN IF NOT EXISTS blur_data_url text;

-- Helpful indexes for the new SEO landing pages
CREATE INDEX IF NOT EXISTS vehicles_type_status_idx
  ON vehicles (vehicle_type_id, status, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS vehicles_make_status_idx
  ON vehicles (make_id, status, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS vehicles_district_status_idx
  ON vehicles (district_id, status, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS vehicles_make_model_idx
  ON vehicles (make_id, lower(model))
  WHERE status IN ('active', 'sold');

SELECT 'Phase 8D schema applied' AS status;
