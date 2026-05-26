-- =============================================================================
-- 00010_vehicle_requests.sql
-- Customer-submitted "find me a vehicle" requests.
-- Admin manually fulfils these by searching the web / network.
-- =============================================================================

CREATE TABLE IF NOT EXISTS vehicle_requests (
  id              bigserial PRIMARY KEY,

  -- Contact (required)
  contact_phone   text NOT NULL,
  contact_name    text,
  whatsapp_pref   boolean NOT NULL DEFAULT true,

  -- What they want
  vehicle_type_id integer REFERENCES vehicle_types(id) ON DELETE SET NULL,
  make            text,
  model           text,
  year_min        integer,
  year_max        integer,
  budget_min      numeric(12, 2),
  budget_max      numeric(12, 2),
  fuel_type       text,
  transmission    text,
  condition       text,

  -- Location
  district_id     integer REFERENCES districts(id) ON DELETE SET NULL,
  city_id         integer REFERENCES cities(id) ON DELETE SET NULL,

  -- Free-form
  description     text,

  -- Provenance — was this from a failed search?
  source          text DEFAULT 'direct',  -- 'direct' | 'failed_search'
  source_query    text,                   -- original search query if from failed search

  -- Admin workflow
  status          text NOT NULL DEFAULT 'new',  -- 'new' | 'in_progress' | 'fulfilled' | 'closed' | 'spam'
  admin_notes     text,
  assigned_to     uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  contacted_at    timestamptz,
  fulfilled_at    timestamptz,

  -- Anti-abuse
  ip_address      inet,
  user_agent      text,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vehicle_requests_status_idx
  ON vehicle_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS vehicle_requests_phone_idx
  ON vehicle_requests (contact_phone);

CREATE INDEX IF NOT EXISTS vehicle_requests_created_idx
  ON vehicle_requests (created_at DESC);

ALTER TABLE vehicle_requests ENABLE ROW LEVEL SECURITY;

SELECT 'Vehicle requests table created' AS status;
