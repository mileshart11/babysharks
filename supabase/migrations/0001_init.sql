-- BabySharks initial schema
-- Run this once in the Supabase Dashboard: Project -> SQL Editor -> New query -> paste -> Run.

-- ============================================================
-- profiles: one row per logged-in manager, auto-created on signup
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
-- Username comes from the "username" field passed at signup, falling back to the email prefix.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- nfl_teams: static reference data, seeded below
-- ============================================================
create table public.nfl_teams (
  id text primary key, -- standard abbreviation, e.g. 'KC'
  city text not null,
  name text not null,
  logo_url text
);

alter table public.nfl_teams enable row level security;

create policy "Teams are viewable by everyone"
  on public.nfl_teams for select
  using (true);

-- ============================================================
-- games: NFL schedule + scores.
-- PLACEHOLDER: seeded by hand below until a real schedule/scores
-- feed is picked. Shape is provider-agnostic on purpose.
-- ============================================================
create table public.games (
  id uuid primary key default gen_random_uuid(),
  season int not null,
  week int not null,
  home_team_id text not null references public.nfl_teams (id),
  away_team_id text not null references public.nfl_teams (id),
  kickoff_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'final')),
  home_score int,
  away_score int,
  winner_team_id text references public.nfl_teams (id),
  created_at timestamptz not null default now()
);

alter table public.games enable row level security;

create policy "Games are viewable by everyone"
  on public.games for select
  using (true);

-- ============================================================
-- baby_sharks: the pick-making sub-profiles, publicly viewable
-- ============================================================
create table public.baby_sharks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.baby_sharks enable row level security;

create policy "Baby sharks are viewable by everyone"
  on public.baby_sharks for select
  using (true);

create policy "Owners can create baby sharks"
  on public.baby_sharks for insert
  with check (auth.uid() = owner_id);

create policy "Owners can update their baby sharks"
  on public.baby_sharks for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their baby sharks"
  on public.baby_sharks for delete
  using (auth.uid() = owner_id);

-- ============================================================
-- picks: one straight-up winner pick per (baby shark, game)
-- ============================================================
create table public.picks (
  id uuid primary key default gen_random_uuid(),
  baby_shark_id uuid not null references public.baby_sharks (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete cascade,
  picked_team_id text not null references public.nfl_teams (id),
  created_at timestamptz not null default now(),
  unique (baby_shark_id, game_id)
);

alter table public.picks enable row level security;

-- Picked team must belong to the game it's a pick for.
create or replace function public.validate_pick()
returns trigger
language plpgsql
as $$
declare
  v_home text;
  v_away text;
begin
  select home_team_id, away_team_id into v_home, v_away
  from public.games where id = new.game_id;

  if new.picked_team_id not in (v_home, v_away) then
    raise exception 'picked_team_id must be one of the game''s two teams';
  end if;

  return new;
end;
$$;

create trigger picks_validate
  before insert or update on public.picks
  for each row execute function public.validate_pick();

create policy "Picks are viewable by everyone"
  on public.picks for select
  using (true);

create policy "Owners can create picks for their baby sharks"
  on public.picks for insert
  with check (
    exists (
      select 1 from public.baby_sharks
      where baby_sharks.id = picks.baby_shark_id
      and baby_sharks.owner_id = auth.uid()
    )
  );

create policy "Owners can update picks for their baby sharks"
  on public.picks for update
  using (
    exists (
      select 1 from public.baby_sharks
      where baby_sharks.id = picks.baby_shark_id
      and baby_sharks.owner_id = auth.uid()
    )
  );

create policy "Owners can delete picks for their baby sharks"
  on public.picks for delete
  using (
    exists (
      select 1 from public.baby_sharks
      where baby_sharks.id = picks.baby_shark_id
      and baby_sharks.owner_id = auth.uid()
    )
  );

-- Convenience view: each pick joined with its game and computed result.
create view public.baby_shark_picks_with_result
with (security_invoker = true) as
select
  p.id as pick_id,
  p.baby_shark_id,
  p.game_id,
  p.picked_team_id,
  g.season,
  g.week,
  g.status,
  g.winner_team_id,
  case
    when g.status = 'final' and g.winner_team_id is null then 'push'
    when g.status = 'final' and p.picked_team_id = g.winner_team_id then 'win'
    when g.status = 'final' and p.picked_team_id != g.winner_team_id then 'loss'
    else null
  end as result
from public.picks p
join public.games g on g.id = p.game_id;

-- ============================================================
-- follows: a manager follows a baby shark
-- ============================================================
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.profiles (id) on delete cascade,
  baby_shark_id uuid not null references public.baby_sharks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, baby_shark_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on public.follows for select
  using (true);

create policy "Users can follow as themselves"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow themselves"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- ============================================================
-- Seed: 32 NFL teams
-- ============================================================
insert into public.nfl_teams (id, city, name) values
  ('BUF', 'Buffalo', 'Bills'),
  ('MIA', 'Miami', 'Dolphins'),
  ('NE', 'New England', 'Patriots'),
  ('NYJ', 'New York', 'Jets'),
  ('BAL', 'Baltimore', 'Ravens'),
  ('CIN', 'Cincinnati', 'Bengals'),
  ('CLE', 'Cleveland', 'Browns'),
  ('PIT', 'Pittsburgh', 'Steelers'),
  ('HOU', 'Houston', 'Texans'),
  ('IND', 'Indianapolis', 'Colts'),
  ('JAX', 'Jacksonville', 'Jaguars'),
  ('TEN', 'Tennessee', 'Titans'),
  ('DEN', 'Denver', 'Broncos'),
  ('KC', 'Kansas City', 'Chiefs'),
  ('LV', 'Las Vegas', 'Raiders'),
  ('LAC', 'Los Angeles', 'Chargers'),
  ('DAL', 'Dallas', 'Cowboys'),
  ('NYG', 'New York', 'Giants'),
  ('PHI', 'Philadelphia', 'Eagles'),
  ('WAS', 'Washington', 'Commanders'),
  ('CHI', 'Chicago', 'Bears'),
  ('DET', 'Detroit', 'Lions'),
  ('GB', 'Green Bay', 'Packers'),
  ('MIN', 'Minnesota', 'Vikings'),
  ('ATL', 'Atlanta', 'Falcons'),
  ('CAR', 'Carolina', 'Panthers'),
  ('NO', 'New Orleans', 'Saints'),
  ('TB', 'Tampa Bay', 'Buccaneers'),
  ('ARI', 'Arizona', 'Cardinals'),
  ('LAR', 'Los Angeles', 'Rams'),
  ('SF', 'San Francisco', '49ers'),
  ('SEA', 'Seattle', 'Seahawks');

-- ============================================================
-- Seed: placeholder Week 1 games so the pick flow can be tested
-- locally. Replace/delete once a real schedule feed is wired up.
-- ============================================================
insert into public.games (season, week, home_team_id, away_team_id, kickoff_at) values
  (2026, 1, 'KC', 'BAL', now() + interval '3 days'),
  (2026, 1, 'SF', 'DAL', now() + interval '3 days 3 hours'),
  (2026, 1, 'BUF', 'MIA', now() + interval '4 days'),
  (2026, 1, 'PHI', 'GB', now() + interval '4 days 3 hours');

-- harmless trailing statement: if a paste ever gets cut off at the
-- very end again, it truncates this instead of real schema/data.
select 1;
