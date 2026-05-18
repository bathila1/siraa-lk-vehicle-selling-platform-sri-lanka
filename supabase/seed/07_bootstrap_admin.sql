-- =============================================================================
-- BOOTSTRAP FIRST ADMIN USER
-- Run this ONCE in Supabase Dashboard → SQL Editor after deploying.
-- Replace +94xxxxxxxxx with your phone number.
-- =============================================================================

insert into admin_users (phone, full_name, role)
values ('+94764790033', 'Bathiya', 'super_admin')
on conflict (phone) do nothing;

-- After this, go to /admin/login and sign in with the same phone number.
-- You'll receive an OTP via SMS.
