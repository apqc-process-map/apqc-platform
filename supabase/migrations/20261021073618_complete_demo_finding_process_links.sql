-- Ensure every DEMO 06 document finding also references its *actual* enterprise processes.
-- The findings and clauses remain illustrative and not verified conflicts.
insert into public.finding_links(finding_id,object_type,object_id,link_role,evidence_excerpt)
select distinct
  f.id,'process_version',pv.id,'evidence'::public.finding_link_role,
  '[DEMO] Quy trình tham chiếu: '||p.process_code||' – '||pv.name_vi||'; tình huống giả lập chưa được kiểm chứng.'
from public.findings f
join public.finding_links fl on fl.finding_id=f.id and fl.object_type='document_version'
join public.document_process_links dpl on dpl.document_version_id=fl.object_id
join public.processes p on p.id=dpl.process_id
join lateral (
  select latest.id,latest.name_vi from public.process_versions latest
  where latest.process_id=p.id order by latest.version_number desc limit 1
) pv on true
where f.title like '[DEMO 06/%' and p.process_code between 'PROC-000011' and 'PROC-000020'
on conflict do nothing;
