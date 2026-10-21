-- Consolidate role-aware relationship write policies and cover audit foreign keys.

create index if not exists object_relationships_updated_by_idx on public.object_relationships(updated_by);
create index if not exists object_relationships_verified_by_idx on public.object_relationships(verified_by);

drop policy if exists "editors create proposed relationships" on public.object_relationships;
drop policy if exists "admins create relationships" on public.object_relationships;
drop policy if exists "editors update own proposed relationships" on public.object_relationships;
drop policy if exists "admins update relationships" on public.object_relationships;

create policy "workers create governed relationships"
on public.object_relationships for insert to authenticated
with check (
  (
    (select public.current_profile_role()) = 'editor'::public.system_role
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
    and status = 'proposed'::public.relationship_status
    and verified_by is null
  )
  or
  (
    (select public.current_profile_role()) = 'admin'::public.system_role
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
    and (
      (status = 'verified'::public.relationship_status and verified_by = (select auth.uid()))
      or (status <> 'verified'::public.relationship_status and verified_by is null)
    )
  )
);

create policy "workers update governed relationships"
on public.object_relationships for update to authenticated
using (
  (select public.current_profile_role()) = 'admin'::public.system_role
  or (
    (select public.current_profile_role()) = 'editor'::public.system_role
    and created_by = (select auth.uid())
    and status in ('proposed'::public.relationship_status, 'rejected'::public.relationship_status)
  )
)
with check (
  (
    (select public.current_profile_role()) = 'editor'::public.system_role
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
    and status = 'proposed'::public.relationship_status
    and verified_by is null
  )
  or
  (
    (select public.current_profile_role()) = 'admin'::public.system_role
    and updated_by = (select auth.uid())
    and (
      (status = 'verified'::public.relationship_status and verified_by = (select auth.uid()))
      or (status <> 'verified'::public.relationship_status and verified_by is null)
    )
  )
);
