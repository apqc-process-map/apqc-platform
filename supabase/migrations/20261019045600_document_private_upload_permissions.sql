-- Only assigned document authors/admins can upload files into active draft versions.
drop policy if exists "editors upload process documents" on storage.objects;
create policy "document draft authors upload private objects"
on storage.objects for insert to authenticated
with check (
  bucket_id='process-documents'
  and (select public.current_profile_role()) in ('editor','admin')
  and exists (
    select 1 from public.document_versions v
    where v.id::text=split_part(name,'/',1)
      and v.status in ('draft','rejected')
      and (
        (select public.current_profile_role())='admin'
        or v.created_by=(select auth.uid())
        or v.owner_id=(select auth.uid())
      )
  )
);

drop policy if exists "workers insert document file metadata" on public.document_files;
create policy "draft authors insert document file metadata"
on public.document_files for insert to authenticated
with check (
  uploaded_by=(select auth.uid())
  and storage_bucket='process-documents'
  and (select public.current_profile_role()) in ('editor','admin')
  and exists (
    select 1 from public.document_versions v
    where v.id=document_version_id and v.status in ('draft','rejected')
      and (
        (select public.current_profile_role())='admin'
        or v.created_by=(select auth.uid())
        or v.owner_id=(select auth.uid())
      )
  )
);
