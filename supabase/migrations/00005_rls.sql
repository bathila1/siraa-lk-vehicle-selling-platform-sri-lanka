-- =============================================================================
-- 00005_rls.sql
-- Row Level Security: by default Supabase exposes ALL tables via the anon key.
-- These policies restrict what anonymous and authenticated users can see/do.
-- =============================================================================

-- ---------- Enable RLS on every user-touchable table ----------
alter table sellers              enable row level security;
alter table otp_codes            enable row level security;
alter table vehicles             enable row level security;
alter table vehicle_images       enable row level security;
alter table price_history        enable row level security;
alter table boosts               enable row level security;
alter table payments             enable row level security;
alter table reports              enable row level security;
alter table saved_lists          enable row level security;
alter table searches_log         enable row level security;
alter table admin_users          enable row level security;
alter table audit_log            enable row level security;
alter table blog_posts           enable row level security;
alter table site_settings        enable row level security;

-- Reference tables (taxonomy) — public read, server-only write
alter table districts                enable row level security;
alter table cities                   enable row level security;
alter table vehicle_types            enable row level security;
alter table vehicle_makes            enable row level security;
alter table vehicle_attributes_schema enable row level security;
alter table boost_plans              enable row level security;
alter table boost_slot_config        enable row level security;

-- ---------- Helper: identify the current seller via JWT claim ----------
-- We use a custom claim 'seller_id' set when issuing the session.
create or replace function current_seller_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'seller_id', '')::uuid;
$$;

create or replace function current_admin_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'admin_id', '')::uuid;
$$;

create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select current_admin_id() is not null;
$$;

-- =============================================================================
-- Public reference tables (anyone can read, only service role can write)
-- =============================================================================

create policy "districts public read" on districts for select using (true);
create policy "cities public read"    on cities    for select using (true);
create policy "vehicle_types public read" on vehicle_types for select using (active = true);
create policy "vehicle_makes public read" on vehicle_makes for select using (active = true);
create policy "vehicle_attributes_schema public read" on vehicle_attributes_schema
  for select using (active = true);
create policy "boost_plans public read" on boost_plans for select using (active = true);
create policy "boost_slot_config public read" on boost_slot_config for select using (true);

-- =============================================================================
-- Vehicles
-- =============================================================================

-- Anyone (including anonymous) can read active vehicles
create policy "vehicles public read active"
  on vehicles for select
  using (status = 'active' or seller_id = current_seller_id() or is_admin());

-- Sellers can insert their own vehicles
create policy "vehicles seller insert"
  on vehicles for insert
  with check (seller_id = current_seller_id());

-- Sellers update only their own vehicles
create policy "vehicles seller update"
  on vehicles for update
  using (seller_id = current_seller_id())
  with check (seller_id = current_seller_id());

-- Sellers delete only their own vehicles
create policy "vehicles seller delete"
  on vehicles for delete
  using (seller_id = current_seller_id());

-- =============================================================================
-- Vehicle images
-- =============================================================================

create policy "vehicle_images public read"
  on vehicle_images for select
  using (
    exists (
      select 1 from vehicles v
      where v.id = vehicle_id
        and (v.status = 'active' or v.seller_id = current_seller_id() or is_admin())
    )
  );

create policy "vehicle_images seller write"
  on vehicle_images for all
  using (
    exists (
      select 1 from vehicles v
      where v.id = vehicle_id and v.seller_id = current_seller_id()
    )
  );

-- =============================================================================
-- Sellers
-- =============================================================================

-- Public can read non-sensitive seller fields (handled by selecting columns in SQL)
create policy "sellers public read"
  on sellers for select
  using (true);

-- Sellers can update only themselves
create policy "sellers self update"
  on sellers for update
  using (id = current_seller_id())
  with check (id = current_seller_id());

-- Inserts come through the OTP verify server endpoint (service role only)

-- =============================================================================
-- OTP codes — server only (no anon access)
-- =============================================================================

-- No policies = nothing allowed for anon/authenticated.
-- Only service-role-key bypasses RLS.

-- =============================================================================
-- Saved lists — public access, codes are unguessable
-- =============================================================================

create policy "saved_lists public read"    on saved_lists for select using (expires_at > now());
create policy "saved_lists public insert"  on saved_lists for insert with check (true);
-- No update/delete from clients; let TTL handle cleanup

-- =============================================================================
-- Reports — anyone can submit
-- =============================================================================

create policy "reports public insert" on reports for insert with check (true);
-- Reads only via admin (service role)

-- =============================================================================
-- Price history — public read (for "Price dropped" badge)
-- =============================================================================

create policy "price_history public read" on price_history for select using (true);

-- =============================================================================
-- Boosts — sellers see their own, public sees status only via vehicles
-- =============================================================================

create policy "boosts seller read"
  on boosts for select
  using (
    exists (
      select 1 from vehicles v where v.id = vehicle_id and v.seller_id = current_seller_id()
    )
    or is_admin()
    or status = 'active'
  );

-- =============================================================================
-- Payments — seller sees only their own
-- =============================================================================

create policy "payments seller read"
  on payments for select
  using (seller_id = current_seller_id() or is_admin());

-- =============================================================================
-- Blog — public reads only published posts
-- =============================================================================

create policy "blog public read"
  on blog_posts for select
  using (published = true or is_admin());

-- =============================================================================
-- Site settings — public read for non-sensitive keys (use SQL views for sensitive)
-- =============================================================================

create policy "site_settings public read" on site_settings for select using (true);

-- =============================================================================
-- Searches log — write-only from clients (no read back)
-- =============================================================================

create policy "searches_log insert" on searches_log for insert with check (true);

-- =============================================================================
-- Admin tables — no anon access at all
-- =============================================================================
-- admin_users and audit_log have RLS enabled but no policies for anon.
-- Only the service role (used by admin server routes) can read/write.
