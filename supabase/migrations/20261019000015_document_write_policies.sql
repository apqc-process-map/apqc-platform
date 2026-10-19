-- Complete document write boundaries for authenticated workers.
grant insert on public.document_files to authenticated;
grant update on public.document_versions to authenticated;

create policy "workers insert document file metadata"
on public.document_files for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and (select public.current_profile_role()) in ('editor','admin')
);

create policy "workers update document versions"
on public.document_versions for update to authenticated
using ((select public.current_profile_role()) in ('editor','admin'))
with check ((select public.current_profile_role()) in ('editor','admin'));

create policy "uploaders delete own process documents"
on storage.objects for delete to authenticated
using (
  bucket_id='process-documents'
  and (
    owner_id=(select auth.uid())
    or (select public.current_profile_role())='admin'
  )
);

create or replace function public.enforce_document_version_role()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
declare
  actor_role public.system_role;
begin
  if (select auth.uid()) is null then
    return new;
  end if;

  actor_role := public.current_profile_role();
  if actor_role not in ('editor','admin') then
    raise exception 'Only editors and admins may update document versions';
  end if;

  if actor_role='editor' then
    if old.status in ('approved','scheduled','effective','superseded','archived')
      or new.status in ('approved','scheduled','effective','superseded','archived') then
      raise exception 'Only admins may approve, publish, supersede, or archive documents';
    end if;
    if new.approved_by is distinct from old.approved_by
      or new.published_by is distinct from old.published_by then
      raise exception 'Only admins may set approval or publication fields';
    end if;
  end if;
  return new;
end
$$;

drop trigger if exists document_versions_role_gate on public.document_versions;
create trigger document_versions_role_gate
before update on public.document_versions
for each row execute function public.enforce_document_version_role();

revoke all on function public.enforce_document_version_role() from public,anon,authenticated;
