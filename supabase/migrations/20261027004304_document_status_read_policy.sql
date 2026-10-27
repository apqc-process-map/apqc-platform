-- Document workflow status is not an access classification. Preserve allowed_roles
-- and private signed-file access while permitting authorized roles to read every status.

drop policy if exists "users read permitted document versions" on public.document_versions;
drop policy if exists "active users read all document versions" on public.document_versions;
create policy "users read documents allowed for role"
on public.document_versions for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or (select public.current_profile_role()) = any(allowed_roles)
  or (
    (select public.current_profile_role()) = 'editor'
    and (created_by = (select auth.uid()) or owner_id = (select auth.uid()))
  )
);
