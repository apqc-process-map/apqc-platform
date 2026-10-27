-- Avoid overlapping permissive tag policies and cover the assignee foreign key.
begin;

drop policy if exists "admins can write governance tags" on public.governance_tags;
drop policy if exists "editors can write object tags" on public.object_tags;

create policy "admins can insert governance tags" on public.governance_tags
  for insert to authenticated
  with check ((select public.current_profile_role()) = any (array['admin']::public.system_role[]));
create policy "admins can update governance tags" on public.governance_tags
  for update to authenticated
  using ((select public.current_profile_role()) = any (array['admin']::public.system_role[]))
  with check ((select public.current_profile_role()) = any (array['admin']::public.system_role[]));
create policy "admins can delete governance tags" on public.governance_tags
  for delete to authenticated
  using ((select public.current_profile_role()) = any (array['admin']::public.system_role[]));

create policy "editors can insert object tags" on public.object_tags
  for insert to authenticated
  with check ((select public.current_profile_role()) = any (array['admin','editor']::public.system_role[]));
create policy "editors can update object tags" on public.object_tags
  for update to authenticated
  using ((select public.current_profile_role()) = any (array['admin','editor']::public.system_role[]))
  with check ((select public.current_profile_role()) = any (array['admin','editor']::public.system_role[]));
create policy "editors can delete object tags" on public.object_tags
  for delete to authenticated
  using ((select public.current_profile_role()) = any (array['admin','editor']::public.system_role[]));

create index if not exists object_tags_assigned_by_idx on public.object_tags(assigned_by);

commit;