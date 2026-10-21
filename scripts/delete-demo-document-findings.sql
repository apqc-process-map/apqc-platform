-- Manual cleanup for the explicitly labeled 06. Finding DEMO dataset.
-- Do not run during ordinary migrations. Refuses to remove documents adopted by real records.
begin;
do $guard$
begin
  if exists (
    select 1
    from public.document_versions dv
    join public.documents d on d.id=dv.document_id
    join public.finding_links fl on fl.object_type='document_version' and fl.object_id=dv.id
    join public.findings f on f.id=fl.finding_id
    where d.document_code like 'DEMO-FND-DOC-%' and f.title not like '[DEMO 06/%'
  ) then
    raise exception 'Demo documents are linked by non-demo findings. Review and unlink them first.';
  end if;
  if exists (
    select 1 from public.document_files df
    join public.document_versions dv on dv.id=df.document_version_id
    join public.documents d on d.id=dv.document_id
    where d.document_code like 'DEMO-FND-DOC-%'
  ) then
    raise exception 'Demo document has uploaded files. Cleanup requires a separate file-review step.';
  end if;
  if exists (
    select 1 from public.reading_assignments a
    join public.document_versions dv on dv.id=a.object_id and a.object_type='document_version'
    join public.documents d on d.id=dv.document_id
    where d.document_code like 'DEMO-FND-DOC-%'
  ) then
    raise exception 'Demo document has reading assignments. Do not remove adopted demo records.';
  end if;
end $guard$;
delete from public.notifications
where object_type='finding' and object_id in
  (select id from public.findings where title like '[DEMO 06/%');
delete from public.findings where title like '[DEMO 06/%';
delete from public.document_process_links
where document_version_id in (
  select dv.id from public.document_versions dv join public.documents d on d.id=dv.document_id
  where d.document_code like 'DEMO-FND-DOC-%'
);
delete from public.document_versions
where document_id in (select id from public.documents where document_code like 'DEMO-FND-DOC-%');
delete from public.documents where document_code like 'DEMO-FND-DOC-%';
commit;
