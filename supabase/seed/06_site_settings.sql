-- =============================================================================
-- 06_site_settings.sql
-- Key-value config that admins edit without code changes.
-- =============================================================================

insert into site_settings (key, value, description) values
  ('promo_first_100_sellers',
   '{"active": true, "current_count": 0, "max_count": 100, "label_en": "First 100 sellers — free posting!", "label_si": "පළමු සාමාජිකයන් 100 ට නොමිලේ දැන්වීම්"}'::jsonb,
   'First-100-sellers free posting promotion. Auto-deactivates when current_count >= max_count.'),

  ('site_contact',
   '{"email": "hello@siraa.lk", "phone": "+94764790033", "whatsapp": "+94764790033", "address": "Sri Lanka"}'::jsonb,
   'Site-wide contact information shown in footer and contact page.'),

  ('homepage_banner',
   '{"active": false, "title": "", "subtitle": "", "cta_label": "", "cta_url": "", "background_color": "#2FA084"}'::jsonb,
   'Optional announcement banner at the top of the homepage.'),

  ('image_upload_limits',
   '{"max_files": 6, "min_files": 3, "max_size_mb": 8, "max_dimension_px": 4000, "compress_to_width": 1600, "target_quality": 82}'::jsonb,
   'Image upload constraints. Files larger than max_size_mb are rejected.'),

  ('search_config',
   '{"min_query_length": 1, "autocomplete_debounce_ms": 150, "max_autocomplete_results": 8, "popular_searches_count": 6}'::jsonb,
   'Search bar behavior tuning.'),

  ('boost_config',
   '{"daily_expiry_cron": "0 1 * * *", "show_boost_badge": true, "boost_pinned_color": "#2FA084"}'::jsonb,
   'Boost system runtime config.'),

  ('payment_config',
   '{"pending_timeout_minutes": 30, "auto_cancel_after_minutes": 30, "currency": "LKR"}'::jsonb,
   'PayHere checkout flow timing.'),

  ('contact_reveal_log_enabled',
   '{"enabled": true}'::jsonb,
   'Whether to count buyer clicks on "Show Number" button.'),

  ('seo_defaults',
   '{
     "title_suffix": " | Siraa.lk",
     "default_meta_description": "Sri Lanka''s premium vehicle marketplace. Buy and sell registered cars, vans, SUVs, motorcycles and more — fast, simple, trusted.",
     "default_og_image": "/og-default.png",
     "twitter_handle": "@siraalk"
   }'::jsonb,
   'Default SEO meta tag values.'),

  ('feature_flags',
   '{
     "saved_lists_enabled": true,
     "blog_enabled": true,
     "price_history_badge": true,
     "similar_vehicles_section": true,
     "report_button_visible": true,
     "show_view_counts_publicly": false
   }'::jsonb,
   'Toggle features on/off without redeploying.')
on conflict (key) do nothing;

-- Bootstrap the first super-admin from env (run separately after deploy)
-- Example to run manually with your phone:
--   insert into admin_users (phone, full_name, role)
--   values ('+94764790033', 'Bathila', 'super_admin')
--   on conflict (phone) do nothing;
