-- Marks specific profiles as admins. Plain data instead of an env var, so
-- granting admin access (gating /admin's user-creation page) is a SQL
-- update instead of a deploy-time configuration change.
alter table public.profiles add column is_admin boolean not null default false;

-- Run this separately, with your own email, to grant yourself access:
-- update public.profiles set is_admin = true
--   where id = (select id from auth.users where email = 'your-login-email@example.com');
