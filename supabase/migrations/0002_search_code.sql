-- Adds a short, shareable, unique code so people can find and follow a
-- specific Baby Shark without relying on (possibly duplicate) display names.
-- Run this once in the Supabase Dashboard SQL Editor.

alter table public.baby_sharks add column search_code text unique;
