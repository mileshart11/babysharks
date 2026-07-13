-- Adds a stable external reference so the NFL schedule sync script can
-- upsert games safely (re-running the sync updates existing rows instead
-- of creating duplicates). Run this once in the Supabase Dashboard SQL Editor.

alter table public.games add column external_id text unique;