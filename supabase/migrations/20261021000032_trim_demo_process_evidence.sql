-- Retain only correctly mapped process evidence on the 06 DEMO findings.
delete from public.finding_links fl
using public.findings f
where fl.finding_id=f.id
  and f.title like '[DEMO 06/%'
  and fl.object_type='process_version'
  and not exists (
    select 1 from public.finding_links dl
    join public.document_process_links dpl on dpl.document_version_id=dl.object_id
    join public.process_versions pv on pv.id=fl.object_id and pv.process_id=dpl.process_id
    where dl.finding_id=f.id and dl.object_type='document_version'
  );
