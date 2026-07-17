-- Locks picks 10 minutes before kickoff: no new picks, changes, or
-- deletions once a game is about to start. Enforced here (not just in the
-- app) so it can't be bypassed by calling the API directly.

create or replace function public.validate_pick()
returns trigger
language plpgsql
as $$
declare
  v_home text;
  v_away text;
  v_kickoff timestamptz;
  v_game_id uuid;
begin
  -- NEW isn't assigned during a DELETE (and OLD isn't during an INSERT) —
  -- referencing the wrong one raises "record ... is not assigned yet", so
  -- branch on tg_op before touching either.
  if tg_op = 'DELETE' then
    v_game_id := old.game_id;
  else
    v_game_id := new.game_id;
  end if;

  select home_team_id, away_team_id, kickoff_at
    into v_home, v_away, v_kickoff
    from public.games where id = v_game_id;

  if now() >= v_kickoff - interval '10 minutes' then
    raise exception 'Picks lock 10 minutes before kickoff.';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  if new.picked_team_id not in (v_home, v_away) then
    raise exception 'picked_team_id must be one of the game''s two teams';
  end if;

  return new;
end;
$$;

drop trigger if exists picks_validate on public.picks;
create trigger picks_validate
  before insert or update or delete on public.picks
  for each row execute function public.validate_pick();
