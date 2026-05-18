-- =============================================================================
-- 00002_schema.sql
-- All tables. Foreign keys enforce data integrity.
-- =============================================================================

-- ---------- Locations ----------
create table if not exists districts (
  id            smallserial primary key,
  name_en       text not null unique,
  name_si       text,
  slug          text not null unique,
  sort_order    smallint not null default 0
);

create table if not exists cities (
  id            serial primary key,
  district_id   smallint not null references districts(id) on delete cascade,
  name_en       text not null,
  name_si       text,
  slug          text not null,
  sort_order    smallint not null default 0,
  unique (district_id, slug)
);

-- ---------- Vehicle taxonomy ----------
create table if not exists vehicle_types (
  id            smallserial primary key,
  name_en       text not null unique,
  name_si       text,
  slug          text not null unique,
  icon          text,                       -- icon name from lucide-react
  sort_order    smallint not null default 0,
  active        boolean not null default true
);

create table if not exists vehicle_makes (
  id              serial primary key,
  name            text not null unique,
  slug            text not null unique,
  -- which vehicle_types this make applies to (Toyota → Car, SUV, Van)
  type_ids        smallint[] not null default '{}',
  active          boolean not null default true,
  sort_order      smallint not null default 0
);

-- ---------- Sellers ----------
create table if not exists sellers (
  id                  uuid primary key default gen_random_uuid(),
  phone               text not null unique,           -- +9476XXXXXXX format
  whatsapp_number     text,                            -- may differ from phone
  full_name           text not null,
  district_id         smallint references districts(id) on delete set null,
  city_id             integer references cities(id) on delete set null,
  verified_at         timestamptz,                     -- set after phone OTP verified
  banned_at           timestamptz,
  banned_reason       text,
  free_posting_used   boolean not null default false,  -- for first-100 promo tracking
  last_seen_at        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- One-time-password storage. Codes are hashed before storage.
create table if not exists otp_codes (
  id              bigserial primary key,
  phone           text not null,
  code_hash       text not null,                       -- bcrypt
  purpose         text not null,                       -- 'seller_signup' | 'seller_login' | 'admin_login'
  expires_at      timestamptz not null,
  attempts        smallint not null default 0,
  consumed_at     timestamptz,
  ip_address      inet,
  user_agent      text,
  created_at      timestamptz not null default now()
);

-- ---------- Dynamic attribute schema ----------
-- Lets admin add/remove fields per vehicle type without code changes.
-- Values stored in vehicles.custom_attributes JSONB.
create table if not exists vehicle_attributes_schema (
  id              serial primary key,
  vehicle_type_id smallint references vehicle_types(id) on delete cascade,
  -- null vehicle_type_id = applies to all types
  field_key       text not null,                       -- snake_case identifier
  label_en        text not null,
  label_si        text,
  field_type      attr_field_type not null,
  options         jsonb,                                -- for select/multiselect: [{value, label_en, label_si}]
  required        boolean not null default false,
  sort_order      smallint not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (vehicle_type_id, field_key)
);

-- ---------- Vehicles (the heart of the app) ----------
create table if not exists vehicles (
  id                  bigserial primary key,
  slug                text not null unique,             -- toyota-aqua-2015-colombo-x9k2n
  seller_id           uuid not null references sellers(id) on delete cascade,
  vehicle_type_id     smallint not null references vehicle_types(id),
  make_id             integer not null references vehicle_makes(id),
  model               text not null,                    -- free-text (e.g., "Aqua", "Civic EX")
  year                smallint not null,
  price               bigint not null,                  -- in LKR, stored as integer (no decimals)
  mileage_km          integer,
  engine_cc           integer,
  body_type           body_type,
  transmission        transmission_type,
  fuel_type           fuel_type,
  condition           vehicle_condition not null default 'registered',
  color               text,
  previous_owners     smallint,
  description         text,

  -- Location
  district_id         smallint not null references districts(id),
  city_id             integer references cities(id),
  lat                 double precision,
  lng                 double precision,

  -- Lifecycle
  status              vehicle_status not null default 'active',
  view_count          integer not null default 0,
  contact_reveal_count integer not null default 0,
  sold_at             timestamptz,
  hidden_at           timestamptz,
  hide_reason         text,

  -- Dynamic extras (admin-defined fields)
  custom_attributes   jsonb not null default '{}'::jsonb,

  -- Full-text search vector (auto-populated by trigger)
  search_vector       tsvector,

  -- Audit
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint year_sensible check (year between 1900 and (extract(year from now())::int + 1)),
  constraint price_positive check (price > 0)
);

-- ---------- Vehicle images ----------
create table if not exists vehicle_images (
  id              bigserial primary key,
  vehicle_id      bigint not null references vehicles(id) on delete cascade,
  url             text not null,
  sort_order      smallint not null default 0,
  is_primary      boolean not null default false,
  width           integer,
  height          integer,
  size_bytes      integer,
  created_at      timestamptz not null default now()
);

-- ---------- Price history (for "Price dropped" badge) ----------
create table if not exists price_history (
  id              bigserial primary key,
  vehicle_id      bigint not null references vehicles(id) on delete cascade,
  old_price       bigint not null,
  new_price       bigint not null,
  changed_at      timestamptz not null default now()
);

-- ---------- Boosting ----------
create table if not exists boost_plans (
  id              smallserial primary key,
  name            text not null,                        -- 'NormalBoost' | 'BoostPro'
  type            boost_type not null,
  price           bigint not null,                      -- LKR
  duration_days   smallint not null,
  description     text,
  active          boolean not null default true,
  sort_order      smallint not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists boosts (
  id              bigserial primary key,
  vehicle_id      bigint not null references vehicles(id) on delete cascade,
  plan_id         smallint not null references boost_plans(id),
  starts_at       timestamptz not null default now(),
  expires_at      timestamptz not null,
  status          boost_status not null default 'pending',
  amount_paid     bigint not null,
  payment_id      bigint,                                -- set after payment confirmed
  created_at      timestamptz not null default now()
);

-- Configurable slot counts: how many boosted ads appear where
create table if not exists boost_slot_config (
  slot_key        text primary key,                      -- 'homepage_hero' | 'search_top_pro' | 'search_top_normal'
  count           smallint not null,
  description     text,
  updated_at      timestamptz not null default now()
);

-- ---------- Payments ----------
create table if not exists payments (
  id                  bigserial primary key,
  seller_id           uuid not null references sellers(id),
  boost_id            bigint references boosts(id),
  amount              bigint not null,
  currency            text not null default 'LKR',
  gateway             text not null default 'payhere',
  gateway_order_id    text not null unique,              -- our order ref sent to PayHere
  gateway_payment_id  text,                              -- PayHere's payment_id from callback
  status              payment_status not null default 'pending',
  raw_request         jsonb,
  raw_response        jsonb,
  ipn_received_at     timestamptz,
  created_at          timestamptz not null default now(),
  completed_at        timestamptz
);

-- Add FK after payments exists (cyclic reference broken)
alter table boosts
  drop constraint if exists boosts_payment_id_fkey,
  add constraint boosts_payment_id_fkey
    foreign key (payment_id) references payments(id) on delete set null;

-- ---------- Reports (sold / scam / wrong info) ----------
create table if not exists reports (
  id              bigserial primary key,
  vehicle_id      bigint not null references vehicles(id) on delete cascade,
  reason          report_reason not null,
  reporter_phone  text,
  reporter_name   text,
  notes           text,
  status          report_status not null default 'pending',
  ip_address      inet,
  admin_notes     text,
  resolved_by     uuid,                                  -- admin_users.id
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------- Saved lists (anonymous, shareable) ----------
create table if not exists saved_lists (
  share_code      text primary key,                      -- 8-char nanoid
  vehicle_ids     bigint[] not null default '{}',
  created_at      timestamptz not null default now(),
  expires_at      timestamptz not null default (now() + interval '90 days'),
  view_count      integer not null default 0
);

-- ---------- Search analytics ----------
create table if not exists searches_log (
  id              bigserial primary key,
  query           text not null,
  normalized      text,                                  -- lowercased, unaccented
  results_count   integer not null,
  district_id     smallint references districts(id),
  vehicle_type_id smallint references vehicle_types(id),
  ip_address      inet,
  created_at      timestamptz not null default now()
);

-- ---------- Admin ----------
create table if not exists admin_users (
  id              uuid primary key default gen_random_uuid(),
  phone           text not null unique,
  full_name       text not null,
  role            admin_role not null default 'moderator',
  active          boolean not null default true,
  last_login_at   timestamptz,
  created_at      timestamptz not null default now()
);

create table if not exists audit_log (
  id              bigserial primary key,
  admin_user_id   uuid references admin_users(id) on delete set null,
  action          text not null,                         -- e.g., 'vehicle.delete', 'seller.ban'
  target_type     text,                                  -- 'vehicle' | 'seller' | 'report' | ...
  target_id       text,
  details         jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

-- ---------- Blog (SEO) ----------
create table if not exists blog_posts (
  id              bigserial primary key,
  slug            text not null unique,
  title           text not null,
  excerpt         text,
  content_md      text not null,
  cover_image     text,
  author_name     text,
  meta_title      text,
  meta_description text,
  published       boolean not null default false,
  published_at    timestamptz,
  view_count      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- Site-wide settings (key-value config) ----------
create table if not exists site_settings (
  key             text primary key,
  value           jsonb not null,
  description     text,
  updated_at      timestamptz not null default now()
);
