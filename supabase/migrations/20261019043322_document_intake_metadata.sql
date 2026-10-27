-- Enable role-controlled creation of document drafts and optional metadata.
-- Deletes are limited to incomplete, unpublished records for upload rollback.
alter table public.documents
  add column if not exists created_by uuid references public.profiles(id);
alter table public.document_versions
  add column if not exists owner_id uuid references public.profiles(id),
  add column if not exists issuing_department text,
  add column if not exists applicability_note text,
  add column if not exists keywords text;

grant usage, select on sequence public.document_code_seq to authenticated;
grant insert, delete on public.documents to authenticated;
grant insert, delete on public.document_versions to authenticated;
grant insert, delete on public.document_process_links to authenticated;

create policy "document creators insert identities"
on public.documents for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (select public.current_profile_role()) in ('editor','admin')
);

create policy "creators clean up empty draft identities"
on public.documents for delete to authenticated
using (
  created_by = (select auth.uid())
  and (select public.current_profile_role()) in ('editor','admin')
  and not exists (select 1 from public.document_versions v where v.document_id = documents.id)
);

create policy "authors insert draft document versions"
on public.document_versions for insert to authenticated
with check (
  status = 'draft'
  and created_by = (select auth.uid())
  and (select public.current_profile_role()) in ('editor','admin')
);

create policy "authors clean up empty draft versions"
on public.document_versions for delete to authenticated
using (
  status = 'draft'
  and created_by = (select auth.uid())
  and (select public.current_profile_role()) in ('editor','admin')
  and not exists (select 1 from public.document_files f where f.document_version_id = document_versions.id)
);

create policy "workers link draft documents to processes"
on public.document_process_links for insert to authenticated
with check (
  (select public.current_profile_role()) in ('editor','admin')
  and exists (
    select 1 from public.document_versions v
    where v.id = document_version_id and v.status in ('draft','rejected')
    and ((select public.current_profile_role()) = 'admin'
      or v.created_by = (select auth.uid()) or v.owner_id = (select auth.uid()))
  )
);

create policy "workers unlink draft documents from processes"
on public.document_process_links for delete to authenticated
using (
  (select public.current_profile_role()) in ('editor','admin')
  and exists (
    select 1 from public.document_versions v
    where v.id = document_version_id and v.status in ('draft','rejected')
    and ((select public.current_profile_role()) = 'admin'
      or v.created_by = (select auth.uid()) or v.owner_id = (select auth.uid()))
  )
);

drop policy if exists "workers update document versions" on public.document_versions;
create policy "workers update document versions"
on public.document_versions for update to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or ((select public.current_profile_role()) = 'editor'
      and (created_by = (select auth.uid()) or owner_id = (select auth.uid())))
)
with check (
  (select public.current_profile_role()) = 'admin'
  or ((select public.current_profile_role()) = 'editor'
      and (created_by = (select auth.uid()) or owner_id = (select auth.uid())))
);
