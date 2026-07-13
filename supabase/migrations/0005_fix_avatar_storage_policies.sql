-- Fixes a column-shadowing bug in the avatar storage policies: the bare
-- `name` reference inside the EXISTS subquery resolved to
-- baby_sharks.name (the shark's display name, e.g. "JoJo") instead of
-- storage.objects.name (the file path), because baby_sharks also has a
-- `name` column and Postgres resolves unqualified names to the innermost
-- matching scope. storage.foldername() was therefore called on things
-- like 'JoJo' instead of '<shark-id>/avatar-123.png', which never has a
-- folder separator — so the policy could never match and every upload
-- was rejected.

drop policy "Owners can upload avatars for their sharks" on storage.objects;
drop policy "Owners can update avatars for their sharks" on storage.objects;
drop policy "Owners can delete avatars for their sharks" on storage.objects;

create policy "Owners can upload avatars for their sharks"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.baby_sharks
      where baby_sharks.id::text = (storage.foldername(storage.objects.name))[1]
      and baby_sharks.owner_id = auth.uid()
    )
  );

create policy "Owners can update avatars for their sharks"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.baby_sharks
      where baby_sharks.id::text = (storage.foldername(storage.objects.name))[1]
      and baby_sharks.owner_id = auth.uid()
    )
  );

create policy "Owners can delete avatars for their sharks"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and exists (
      select 1 from public.baby_sharks
      where baby_sharks.id::text = (storage.foldername(storage.objects.name))[1]
      and baby_sharks.owner_id = auth.uid()
    )
  );
