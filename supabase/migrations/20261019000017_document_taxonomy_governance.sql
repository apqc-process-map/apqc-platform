-- Align document taxonomy with PRD §14; repair corrupted legacy Vietnamese labels.
-- Add optional governance metadata and protect confidential document read paths.
alter table public.vocabulary_values
  add column if not exists document_group_code text;

insert into public.vocabulary_values(vocabulary_id,code,label_vi,label_en,display_order,document_group_code)
select v.id,x.code,x.label_vi,x.label_en,x.sort_order,x.group_code
from public.vocabularies v
cross join (values
  ('policy','Chính sách','Policy',1,'governance'),
  ('regulation','Quy định','Regulation',2,'governance'),
  ('standard','Tiêu chuẩn','Standard',3,'governance'),
  ('decision','Quyết định','Decision',4,'governance'),
  ('delegation_matrix','Ma trận phân quyền','Delegation Matrix',5,'governance'),
  ('procedure','Quy trình','Procedure',6,'execution'),
  ('work_instruction','Hướng dẫn công việc','Work Instruction',7,'execution'),
  ('form_template','Biểu mẫu / mẫu biểu','Form / Template',8,'execution'),
  ('checklist','Danh sách kiểm tra','Checklist',9,'execution'),
  ('announcement','Thông báo','Announcement',10,'communication'),
  ('guidance','Tài liệu hướng dẫn','Guidance',11,'communication'),
  ('training_material','Tài liệu đào tạo','Training Material',12,'communication'),
  ('meeting_minutes','Biên bản họp','Meeting Minutes',13,'evidence'),
  ('audit_report','Báo cáo kiểm toán / đánh giá','Audit / Assessment Report',14,'evidence'),
  ('incident_record','Biên bản sự cố','Incident Record',15,'evidence'),
  ('rca_report','Báo cáo phân tích nguyên nhân','Root Cause Analysis Report',16,'evidence'),
  ('project_charter','Điều lệ dự án','Project Charter',17,'planning'),
  ('business_case','Đề xuất đầu tư / kinh doanh','Business Case',18,'planning'),
  ('plan','Kế hoạch','Plan',19,'planning'),
  ('law_legal_basis','Văn bản pháp luật','Law / Legal Basis',20,'external'),
  ('contract','Hợp đồng','Contract',21,'external'),
  ('external_reference','Tài liệu tham khảo bên ngoài','External Reference',22,'external'),
  ('other','Khác','Other',23,'other')
) as x(code,label_vi,label_en,sort_order,group_code)
where v.code = 'document_type'
on conflict (vocabulary_id,code) do update
set label_vi=excluded.label_vi,
    label_en=excluded.label_en,
    display_order=excluded.display_order,
    document_group_code=excluded.document_group_code,
    is_active=true;

alter table public.document_versions
  add column if not exists designated_approver_id uuid references public.profiles(id),
  add column if not exists legal_reference text,
  add column if not exists retention_note text,
  add column if not exists risk_rating text,
  add constraint document_versions_risk_rating_check check (
    risk_rating is null or risk_rating in ('low','medium','high','critical')
  );

-- Authorizations match the PRD: only effective versions can be seen by Viewer.
drop policy if exists "active users read document_versions" on public.document_versions;
create policy "users read permitted document versions"
on public.document_versions for select to authenticated
using (
  (select public.current_profile_role())='admin'
  or (
    (select public.current_profile_role())='editor'
    and (created_by=(select auth.uid()) or owner_id=(select auth.uid()))
  )
  or (
    (select public.current_profile_role())=any(allowed_roles)
    and (
      (select public.current_profile_role())='editor'
      or status='effective'
    )
  )
);

drop policy if exists "active users read document_files" on public.document_files;
create policy "users read files of accessible document versions"
on public.document_files for select to authenticated
using (exists (
  select 1 from public.document_versions v where v.id=document_version_id
));

drop policy if exists "active users read document_process_links" on public.document_process_links;
create policy "users read links of accessible document versions"
on public.document_process_links for select to authenticated
using (exists (
  select 1 from public.document_versions v where v.id=document_version_id
));

drop policy if exists "active users read object_applicability" on public.object_applicability;
create policy "users read scoped object applicability"
on public.object_applicability for select to authenticated
using (
  (object_type <> 'document_version' and (select public.current_profile_role()) is not null)
  or (object_type='document_version' and exists (
    select 1 from public.document_versions v where v.id=object_id
  ))
);

drop policy if exists "active users can read object tags" on public.object_tags;
create policy "users read scoped object tags"
on public.object_tags for select to authenticated
using (
  (object_type <> 'document_version' and (select public.current_profile_role()) is not null)
  or (object_type='document_version' and exists (
    select 1 from public.document_versions v where v.id=object_id
  ))
);

drop policy if exists "active users read process documents" on storage.objects;
create policy "users read authorized process documents"
on storage.objects for select to authenticated
using (
  bucket_id='process-documents'
  and (
    owner_id=(select auth.uid())::text
    or exists (
      select 1 from public.document_files f
      where f.storage_bucket='process-documents' and f.storage_key=name
    )
  )
);

create policy "editors write draft applicability"
on public.object_applicability for insert to authenticated
with check (
  object_type='document_version'
  and (select public.current_profile_role()) in ('editor','admin')
  and exists (
    select 1 from public.document_versions v
    where v.id=object_id and v.status in ('draft','rejected')
    and (
      (select public.current_profile_role())='admin'
      or v.created_by=(select auth.uid()) or v.owner_id=(select auth.uid())
    )
  )
);

create policy "editors remove draft applicability"
on public.object_applicability for delete to authenticated
using (
  object_type='document_version'
  and (select public.current_profile_role()) in ('editor','admin')
  and exists (
    select 1 from public.document_versions v
    where v.id=object_id and v.status in ('draft','rejected')
    and (
      (select public.current_profile_role())='admin'
      or v.created_by=(select auth.uid()) or v.owner_id=(select auth.uid())
    )
  )
);

create index if not exists object_applicability_document_lookup
on public.object_applicability(object_id,dimension)
where object_type='document_version';
