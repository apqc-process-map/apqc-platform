-- Permit Admin-only Process Map metadata editing through governed draft versions.
begin;

drop policy if exists "admins create process drafts" on public.process_versions;
drop policy if exists "admins update process drafts" on public.process_versions;
drop policy if exists "admins delete own process drafts" on public.process_versions;
drop policy if exists "admins copy process assignments to own drafts" on public.process_assignments;
drop policy if exists "admins copy process mappings to own drafts" on public.process_apqc_mappings;
drop policy if exists "admins copy applicability to own drafts" on public.object_applicability;
drop policy if exists "admins remove applicability from own drafts" on public.object_applicability;

create policy "admins create process drafts"
  on public.process_versions for insert to authenticated
  with check (
    (select public.current_profile_role()) = 'admin'::public.system_role
    and status = 'draft'::public.process_version_status
    and created_by = (select auth.uid())
    and updated_by = (select auth.uid())
  );

create policy "admins update process drafts"
  on public.process_versions for update to authenticated
  using (
    (select public.current_profile_role()) = 'admin'::public.system_role
    and status in ('draft'::public.process_version_status, 'rejected'::public.process_version_status)
  )
  with check (
    (select public.current_profile_role()) = 'admin'::public.system_role
    and status in ('draft'::public.process_version_status, 'rejected'::public.process_version_status)
    and updated_by = (select auth.uid())
  );

create policy "admins delete own process drafts"
  on public.process_versions for delete to authenticated
  using (
    (select public.current_profile_role()) = 'admin'::public.system_role
    and status = 'draft'::public.process_version_status
    and created_by = (select auth.uid())
  );

create policy "admins copy process assignments to own drafts"
  on public.process_assignments for insert to authenticated
  with check (
    (select public.current_profile_role()) = 'admin'::public.system_role
    and exists (
      select 1 from public.process_versions pv
      where pv.id = process_assignments.process_version_id
        and pv.status = 'draft'::public.process_version_status
        and pv.created_by = (select auth.uid())
    )
  );

create policy "admins copy process mappings to own drafts"
  on public.process_apqc_mappings for insert to authenticated
  with check (
    (select public.current_profile_role()) = 'admin'::public.system_role
    and exists (
      select 1 from public.process_versions pv
      where pv.id = process_apqc_mappings.process_version_id
        and pv.status = 'draft'::public.process_version_status
        and pv.created_by = (select auth.uid())
    )
  );

create policy "admins copy applicability to own drafts"
  on public.object_applicability for insert to authenticated
  with check (
    object_type = 'process_version'::public.review_object_type
    and (select public.current_profile_role()) = 'admin'::public.system_role
    and exists (
      select 1 from public.process_versions pv
      where pv.id = object_applicability.object_id
        and pv.status = 'draft'::public.process_version_status
        and pv.created_by = (select auth.uid())
    )
  );

create policy "admins remove applicability from own drafts"
  on public.object_applicability for delete to authenticated
  using (
    object_type = 'process_version'::public.review_object_type
    and (select public.current_profile_role()) = 'admin'::public.system_role
    and exists (
      select 1 from public.process_versions pv
      where pv.id = object_applicability.object_id
        and pv.status = 'draft'::public.process_version_status
        and pv.created_by = (select auth.uid())
    )
  );

grant insert, update, delete on public.process_versions to authenticated;
grant insert on public.process_assignments, public.process_apqc_mappings to authenticated;
grant insert, delete on public.object_applicability to authenticated;

commit;
