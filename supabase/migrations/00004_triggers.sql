-- =============================================================================
-- 00004_triggers.sql
-- Triggers that keep derived data consistent automatically.
-- =============================================================================

-- ---------- Generic: updated_at on row update ----------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_sellers_updated_at on sellers;
create trigger trg_sellers_updated_at
  before update on sellers
  for each row execute function set_updated_at();

drop trigger if exists trg_vehicles_updated_at on vehicles;
create trigger trg_vehicles_updated_at
  before update on vehicles
  for each row execute function set_updated_at();

drop trigger if exists trg_boost_plans_updated_at on boost_plans;
create trigger trg_boost_plans_updated_at
  before update on boost_plans
  for each row execute function set_updated_at();

drop trigger if exists trg_blog_updated_at on blog_posts;
create trigger trg_blog_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

drop trigger if exists trg_site_settings_updated_at on site_settings;
create trigger trg_site_settings_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

-- ---------- Vehicle search_vector: rebuild on insert/update ----------
-- This is the secret sauce of fast, fuzzy search.
-- Includes make name + model + description + city/district name, weighted.
create or replace function vehicles_search_vector_update()
returns trigger
language plpgsql
as $$
declare
  v_make    text;
  v_type    text;
  v_city    text;
  v_distr   text;
begin
  select name into v_make from vehicle_makes where id = new.make_id;
  select name_en into v_type from vehicle_types where id = new.vehicle_type_id;
  select name_en into v_city from cities where id = new.city_id;
  select name_en into v_distr from districts where id = new.district_id;

  new.search_vector :=
    setweight(to_tsvector('simple', unaccent(coalesce(v_make, ''))), 'A')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.model, ''))), 'A')
    || setweight(to_tsvector('simple', coalesce(new.year::text, '')), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(v_type, ''))), 'B')
    || setweight(to_tsvector('simple', unaccent(coalesce(v_city, ''))), 'C')
    || setweight(to_tsvector('simple', unaccent(coalesce(v_distr, ''))), 'C')
    || setweight(to_tsvector('simple', unaccent(coalesce(new.description, ''))), 'D');

  return new;
end;
$$;

drop trigger if exists trg_vehicles_search_vector on vehicles;
create trigger trg_vehicles_search_vector
  before insert or update of make_id, model, year, vehicle_type_id, city_id, district_id, description
  on vehicles
  for each row execute function vehicles_search_vector_update();

-- ---------- Price history: record every price change ----------
create or replace function vehicles_price_history()
returns trigger
language plpgsql
as $$
begin
  if old.price is distinct from new.price then
    insert into price_history (vehicle_id, old_price, new_price)
    values (new.id, old.price, new.price);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vehicles_price_history on vehicles;
create trigger trg_vehicles_price_history
  after update of price on vehicles
  for each row execute function vehicles_price_history();

-- ---------- Vehicle slug generation helper ----------
-- App generates the slug, but we provide a fallback to ensure uniqueness.
create or replace function generate_vehicle_slug(
  p_make text, p_model text, p_year int, p_city text
) returns text
language plpgsql
as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  base_slug := lower(regexp_replace(
    coalesce(p_make, '') || '-' || coalesce(p_model, '') || '-' ||
    coalesce(p_year::text, '') || '-' || coalesce(p_city, ''),
    '[^a-z0-9]+', '-', 'g'
  ));
  base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
  final_slug := base_slug || '-' || substring(md5(random()::text || clock_timestamp()::text), 1, 6);
  return final_slug;
end;
$$;

-- ---------- Saved list cleanup function (call from cron) ----------
create or replace function cleanup_expired_saved_lists()
returns int
language plpgsql
as $$
declare deleted_count int;
begin
  delete from saved_lists where expires_at < now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ---------- OTP cleanup function (call from cron) ----------
create or replace function cleanup_expired_otps()
returns int
language plpgsql
as $$
declare deleted_count int;
begin
  delete from otp_codes where expires_at < now() - interval '1 day';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- ---------- Boost expiry function (call from cron) ----------
create or replace function expire_boosts()
returns int
language plpgsql
as $$
declare updated_count int;
begin
  update boosts
  set status = 'expired'
  where status = 'active' and expires_at < now();
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

-- ---------- Increment view count safely (avoid lock contention) ----------
create or replace function increment_vehicle_views(p_vehicle_id bigint)
returns void
language sql
as $$
  update vehicles set view_count = view_count + 1 where id = p_vehicle_id;
$$;

create or replace function increment_contact_reveal(p_vehicle_id bigint)
returns void
language sql
as $$
  update vehicles set contact_reveal_count = contact_reveal_count + 1 where id = p_vehicle_id;
$$;
