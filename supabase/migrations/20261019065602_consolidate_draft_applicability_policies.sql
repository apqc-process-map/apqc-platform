-- Consolidate mutually exclusive document/process draft applicability policies.
-- This preserves the document writer rules and the new Admin process-draft rule
-- while avoiding multiple permissive policies for the same operation.
begin;

drop policy if exists "editors write draft applicability" on public.object_applicability;
drop policy if exists "editors remove draft applicability" on public.object_applicability;
drop policy if exists "admins copy applicability to own drafts" on public.object_applicability;
drop policy if exists "admins remove applicability from own drafts" on public.object_applicability;

create policy "writers add draft applicability"
  on public.object_applicability for insert to authenticated
  with check (
    (
      object_type = 'document_version'::public.review_object_type
      and (select public.current_profile_role()) = any (
        array['editor'::public.system_role, 'admin'::public.system_role]
      )
      and exists (
        select 1
        from public.document_versions v
        where v.id = object_applicability.object_id
          and v.status in (
            'draft'::public.process_version_status,
            'rejected'::public.process_version_status
          )
          and (
            (select public.current_profile_role()) = 'admin'::public.system_role
            or v.created_by = (select auth.uid())
            or v.owner_id = (select auth.uid())
          )
      )
    )
    or (
      object_type = 'process_version'::public.review_object_type
      and (select public.current_profile_role()) = 'admin'::public.system_role
      and exists (
        select 1
        from public.process_versions pv
        where pv.id = object_applicability.object_id
          and pv.status = 'draft'::public.process_version_status
          and pv.created_by = (select auth.uid())
      )
    )
  );

create policy "writers remove draft applicability"
  on public.object_applicability for delete to authenticated
  using (
    (
      object_type = 'document_version'::public.review_object_type
      and (select public.current_profile_role()) = any (
        array['editor'::public.system_role, 'admin'::public.system_role]
      )
      and exists (
        select 1
        from public.document_versions v
        where v.id = object_applicability.object_id
          and v.status in (
            'draft'::public.process_version_status,
            'rejected'::public.process_version_status
          )
          and (
            (select public.current_profile_role()) = 'admin'::public.system_role
            or v.created_by = (select auth.uid())
            or v.owner_id = (select auth.uid())
          )
      )
    )
    or (
      object_type = 'process_version'::public.review_object_type
      and (select public.current_profile_role()) = 'admin'::public.system_role
      and exists (
        select 1
        from public.process_versions pv
        where pv.id = object_applicability.object_id
          and pv.status = 'draft'::public.process_version_status
          and pv.created_by = (select auth.uid())
      )
    )
  );

commit;
