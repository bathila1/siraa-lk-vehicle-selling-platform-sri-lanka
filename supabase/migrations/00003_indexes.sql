-- =============================================================================
-- 00003_indexes.sql
-- Indexes for fast queries — especially full-text search and filtering.
-- Without these, the site will be slow at scale.
-- =============================================================================

-- ---------- Locations ----------
create index if not exists idx_cities_district on cities(district_id);

-- ---------- Sellers ----------
create index if not exists idx_sellers_phone on sellers(phone);
create index if not exists idx_sellers_district on sellers(district_id);
create index if not exists idx_sellers_created on sellers(created_at desc);

-- ---------- OTP ----------
create index if not exists idx_otp_phone on otp_codes(phone, purpose);
create index if not exists idx_otp_expires on otp_codes(expires_at);

-- ---------- Vehicle taxonomy ----------
-- GIN with trigram for fuzzy matching makes ("hnda" → "Honda")
create index if not exists idx_vehicle_makes_name_trgm
  on vehicle_makes using gin (name gin_trgm_ops);

-- For "find makes that apply to vehicle type X"
create index if not exists idx_vehicle_makes_type_ids on vehicle_makes using gin (type_ids);

-- ---------- Vehicles: the heavy hitter ----------
-- Full-text search index (most important index in the whole DB)
create index if not exists idx_vehicles_search
  on vehicles using gin (search_vector);

-- Trigram on model for fuzzy "civic" → "Civic EX"
create index if not exists idx_vehicles_model_trgm
  on vehicles using gin (model gin_trgm_ops);

-- Composite filters: status + type + make is the most common combo
create index if not exists idx_vehicles_status_type_make
  on vehicles (status, vehicle_type_id, make_id);

-- Common range filters
create index if not exists idx_vehicles_year on vehicles(year) where status = 'active';
create index if not exists idx_vehicles_price on vehicles(price) where status = 'active';
create index if not exists idx_vehicles_district on vehicles(district_id) where status = 'active';

-- "Latest ads" homepage query
create index if not exists idx_vehicles_created_active
  on vehicles (created_at desc) where status = 'active';

-- Slug lookup
create index if not exists idx_vehicles_slug on vehicles(slug);

-- Seller dashboard query
create index if not exists idx_vehicles_seller on vehicles(seller_id, created_at desc);

-- ---------- Vehicle images ----------
create index if not exists idx_vehicle_images_vehicle on vehicle_images(vehicle_id, sort_order);

-- ---------- Boosts ----------
-- Daily cron: "find active boosts that have expired"
create index if not exists idx_boosts_expiry
  on boosts(expires_at) where status = 'active';

-- Vehicle detail page: "is this vehicle currently boosted?"
create index if not exists idx_boosts_vehicle_active
  on boosts(vehicle_id, status) where status = 'active';

-- ---------- Payments ----------
create index if not exists idx_payments_seller on payments(seller_id, created_at desc);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_payments_gateway_order on payments(gateway_order_id);

-- ---------- Reports ----------
create index if not exists idx_reports_status on reports(status, created_at desc);
create index if not exists idx_reports_vehicle on reports(vehicle_id);

-- ---------- Saved lists ----------
create index if not exists idx_saved_lists_expires on saved_lists(expires_at);

-- ---------- Search log ----------
create index if not exists idx_searches_normalized on searches_log(normalized, created_at desc);
create index if not exists idx_searches_created on searches_log(created_at desc);

-- ---------- Blog ----------
create index if not exists idx_blog_published
  on blog_posts(published_at desc) where published = true;
create index if not exists idx_blog_slug on blog_posts(slug);

-- ---------- Price history ----------
create index if not exists idx_price_history_vehicle on price_history(vehicle_id, changed_at desc);

-- ---------- Audit log ----------
create index if not exists idx_audit_admin on audit_log(admin_user_id, created_at desc);
create index if not exists idx_audit_target on audit_log(target_type, target_id);
