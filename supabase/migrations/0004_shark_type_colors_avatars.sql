-- 1. Baby Shark type: every shark is either a child ("baby shark") or a
--    pet ("pet shark"). No verification, just a required choice.
alter table public.baby_sharks
  add column shark_type text check (shark_type in ('baby', 'pet'));

-- 2. Team brand colors, used by the tap-to-pick split screen.
alter table public.nfl_teams add column primary_color text;
alter table public.nfl_teams add column secondary_color text;

update public.nfl_teams set primary_color = '#97233F', secondary_color = '#000000' where id = 'ARI';
update public.nfl_teams set primary_color = '#A71930', secondary_color = '#000000' where id = 'ATL';
update public.nfl_teams set primary_color = '#241773', secondary_color = '#000000' where id = 'BAL';
update public.nfl_teams set primary_color = '#00338D', secondary_color = '#C60C30' where id = 'BUF';
update public.nfl_teams set primary_color = '#0085CA', secondary_color = '#101820' where id = 'CAR';
update public.nfl_teams set primary_color = '#0B162A', secondary_color = '#C83803' where id = 'CHI';
update public.nfl_teams set primary_color = '#FB4F14', secondary_color = '#000000' where id = 'CIN';
update public.nfl_teams set primary_color = '#311D00', secondary_color = '#FF3C00' where id = 'CLE';
update public.nfl_teams set primary_color = '#003594', secondary_color = '#869397' where id = 'DAL';
update public.nfl_teams set primary_color = '#FB4F14', secondary_color = '#002244' where id = 'DEN';
update public.nfl_teams set primary_color = '#0076B6', secondary_color = '#B0B7BC' where id = 'DET';
update public.nfl_teams set primary_color = '#203731', secondary_color = '#FFB612' where id = 'GB';
update public.nfl_teams set primary_color = '#03202F', secondary_color = '#A71930' where id = 'HOU';
update public.nfl_teams set primary_color = '#002C5F', secondary_color = '#A2AAAD' where id = 'IND';
update public.nfl_teams set primary_color = '#101820', secondary_color = '#D7A22A' where id = 'JAX';
update public.nfl_teams set primary_color = '#E31837', secondary_color = '#FFB81C' where id = 'KC';
update public.nfl_teams set primary_color = '#000000', secondary_color = '#A5ACAF' where id = 'LV';
update public.nfl_teams set primary_color = '#0080C6', secondary_color = '#FFC20E' where id = 'LAC';
update public.nfl_teams set primary_color = '#003594', secondary_color = '#FFA300' where id = 'LAR';
update public.nfl_teams set primary_color = '#008E97', secondary_color = '#FC4C02' where id = 'MIA';
update public.nfl_teams set primary_color = '#4F2683', secondary_color = '#FFC62F' where id = 'MIN';
update public.nfl_teams set primary_color = '#002244', secondary_color = '#C60C30' where id = 'NE';
update public.nfl_teams set primary_color = '#D3BC8D', secondary_color = '#101820' where id = 'NO';
update public.nfl_teams set primary_color = '#0B2265', secondary_color = '#A71930' where id = 'NYG';
update public.nfl_teams set primary_color = '#125740', secondary_color = '#000000' where id = 'NYJ';
update public.nfl_teams set primary_color = '#004C54', secondary_color = '#A5ACAF' where id = 'PHI';
update public.nfl_teams set primary_color = '#FFB612', secondary_color = '#101820' where id = 'PIT';
update public.nfl_teams set primary_color = '#002244', secondary_color = '#69BE28' where id = 'SEA';
update public.nfl_teams set primary_color = '#AA0000', secondary_color = '#B3995D' where id = 'SF';
update public.nfl_teams set primary_color = '#D50A0A', secondary_color = '#34302B' where id = 'TB';
update public.nfl_teams set primary_color = '#0C2340', secondary_color = '#4B92DB' where id = 'TEN';
update public.nfl_teams set primary_color = '#5A1414', secondary_color = '#FFB612' where id = 'WAS';

-- 3. Storage bucket for Baby Shark profile pictures.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Files are stored under `{baby_shark_id}/...` — owners can manage only
-- the folder matching a shark they own. Public read comes for free since
-- the bucket itself is public.
create policy "Owners can upload avatars for their sharks"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.baby_sharks
      where baby_sharks.id::text = (storage.foldername(name))[1]
      and baby_sharks.owner_id = auth.uid()
    )
  );

create policy "Owners can update avatars for their sharks"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.baby_sharks
      where baby_sharks.id::text = (storage.foldername(name))[1]
      and baby_sharks.owner_id = auth.uid()
    )
  );

create policy "Owners can delete avatars for their sharks"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.baby_sharks
      where baby_sharks.id::text = (storage.foldername(name))[1]
      and baby_sharks.owner_id = auth.uid()
    )
  );
