-- =============================================================================
-- 00001_extensions_and_enums.sql
-- PostgreSQL extensions + enum types used across the schema.
-- =============================================================================

-- ---------- Extensions ----------
create extension if not exists pg_trgm;       -- fuzzy text search (typo tolerance)
create extension if not exists unaccent;      -- normalize accents (Sinhala-friendly)
create extension if not exists pgcrypto;      -- gen_random_uuid()

-- Note: postgis is great for geo queries but heavy. We use plain lat/lng floats
-- for now since "find vehicles within X km" is not in MVP. Can add later.

-- ---------- Enums ----------
do $$ begin
  create type vehicle_status as enum ('active', 'sold', 'hidden', 'pending_review');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vehicle_condition as enum ('registered');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transmission_type as enum ('auto', 'manual', 'tiptronic', 'cvt', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fuel_type as enum ('petrol', 'diesel', 'hybrid', 'electric', 'cng', 'lpg', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type body_type as enum (
    'sedan', 'hatchback', 'coupe', 'wagon', 'suv', 'pickup',
    'van', 'convertible', 'mpv', 'other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type boost_type as enum ('normal', 'pro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type boost_status as enum ('pending', 'active', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('pending', 'completed', 'failed', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_reason as enum ('sold', 'scam', 'wrong_info', 'duplicate', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('pending', 'investigating', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('super_admin', 'moderator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attr_field_type as enum ('text', 'number', 'select', 'multiselect', 'boolean');
exception when duplicate_object then null; end $$;
