begin;
delete from public.notifications where type like 'demo_%' or title like '[DEMO]%'
  or object_id in (select dv.id from public.document_versions dv join public.documents d on d.id=dv.document_id where d.document_code like 'DEMO-DOC-%');
delete from public.reading_assignments where object_type='document_version'
  and object_id in (select dv.id from public.document_versions dv join public.documents d on d.id=dv.document_id where d.document_code like 'DEMO-DOC-%');
delete from public.review_requests where object_type='document_version'
  and object_id in (select dv.id from public.document_versions dv join public.documents d on d.id=dv.document_id where d.document_code like 'DEMO-DOC-%');
delete from storage.objects where bucket_id='process-documents'
  and name in (select df.storage_key from public.document_files df join public.document_versions dv on dv.id=df.document_version_id join public.documents d on d.id=dv.document_id where d.document_code like 'DEMO-DOC-%');
delete from public.object_tags where object_type='document_version'
  and object_id in (select dv.id from public.document_versions dv join public.documents d on d.id=dv.document_id where d.document_code like 'DEMO-DOC-%');
delete from public.object_applicability where object_type='document_version'
  and object_id in (select dv.id from public.document_versions dv join public.documents d on d.id=dv.document_id where d.document_code like 'DEMO-DOC-%');
delete from public.documents where document_code like 'DEMO-DOC-%';
delete from public.comments where thread_id in (select ct.id from public.comment_threads ct join public.findings f on f.id=ct.context_id where ct.context_type='finding' and f.title like '[DEMO]%');
delete from public.comment_threads where context_type='finding' and context_id in (select id from public.findings where title like '[DEMO]%');
delete from public.finding_reactions where finding_id in (select id from public.findings where title like '[DEMO]%');
delete from public.finding_participants where finding_id in (select id from public.findings where title like '[DEMO]%');
delete from public.finding_links where finding_id in (select id from public.findings where title like '[DEMO]%');
delete from public.findings where title like '[DEMO]%';
delete from public.object_relationships where source_id in (select id from public.processes where source_code like 'DEMO-20261016-%')
  or target_id in (select id from public.processes where source_code like 'DEMO-20261016-%');
delete from public.object_tags where object_type='process_version'
  and object_id in (select pv.id from public.process_versions pv join public.processes p on p.id=pv.process_id where p.source_code like 'DEMO-20261016-%');
delete from public.object_applicability where object_type='process_version'
  and object_id in (select pv.id from public.process_versions pv join public.processes p on p.id=pv.process_id where p.source_code like 'DEMO-20261016-%');
delete from public.process_business_object_flows where process_id in (select id from public.processes where source_code like 'DEMO-20261016-%');
delete from public.processes where source_code like 'DEMO-20261016-%';
delete from public.systems where code like 'DEMO-20261016-%';
delete from public.risks where code like 'DEMO-20261016-%';
delete from public.kpis where code like 'DEMO-20261016-%';
delete from public.business_roles where code like 'DEMO-20261016-%';
delete from public.business_objects where code like 'DEMO-20261016-%';
delete from public.governance_tags where code like 'DEMO-TAG-%';
commit;
