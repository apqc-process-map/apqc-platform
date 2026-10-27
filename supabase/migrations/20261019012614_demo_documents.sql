-- Disposable document fixtures for E6-E9 UI and lifecycle testing.
-- Delete all fixtures with scripts/delete-demo-processes.sql.
insert into public.documents(document_code)
values ('DEMO-DOC-001'),('DEMO-DOC-002'),('DEMO-DOC-003')
on conflict (document_code) do nothing;

insert into public.document_versions(
  document_id,version_number,status,title_vi,title_en,document_group,language,
  document_abstract,change_summary,valid_from,review_due_at,created_by,approved_by,approved_at
)
select d.id,v.version_number,v.status::public.process_version_status,v.title_vi,v.title_en,v.document_group,'vi',
  v.abstract,v.change_summary,v.valid_from,v.review_due_at,creator.id,
  case when v.status='approved' then approver.id end,
  case when v.status='approved' then now() end
from public.documents d
cross join lateral (values
  ('DEMO-DOC-001',1,'approved',  'Quy trình xử lý đơn hàng','Order Fulfilment Procedure','procedure','Mô tả cách tiếp nhận, xác nhận và hoàn tất đơn hàng.','Phiên bản demo ban đầu.',current_date,current_date+30),
  ('DEMO-DOC-001',2,'draft',     'Quy trình xử lý đơn hàng','Order Fulfilment Procedure','procedure','Bổ sung điểm kiểm soát và trách nhiệm trong luồng xử lý đơn hàng.','[DEMO] Bổ sung SLA xác nhận và escalation.',null::date,null::date),
  ('DEMO-DOC-002',1,'in_review', 'Chính sách quản trị nhà cung cấp','Supplier Governance Policy','policy','Nguyên tắc lựa chọn, đánh giá và giám sát nhà cung cấp.','[DEMO] Gửi review lần đầu.',null::date,current_date+14),
  ('DEMO-DOC-003',1,'approved',  'Hướng dẫn kiểm kê kho','Inventory Count Work Instruction','work_instruction','Hướng dẫn chuẩn bị, thực hiện và đối soát kiểm kê kho.','Phiên bản demo ban đầu.',current_date,current_date+60)
) as v(document_code,version_number,status,title_vi,title_en,document_group,abstract,change_summary,valid_from,review_due_at)
join public.profiles creator on creator.display_name='hoangnguyen' and creator.is_active
join public.profiles approver on approver.display_name='mynguyen' and approver.is_active
where d.document_code=v.document_code
on conflict (document_id,version_number) do update set
  title_vi=excluded.title_vi,title_en=excluded.title_en,document_group=excluded.document_group,
  document_abstract=excluded.document_abstract,change_summary=excluded.change_summary,
  review_due_at=excluded.review_due_at;

insert into public.document_process_links(document_version_id,process_id,link_role)
select dv.id,p.id,'primary'::public.document_link_role
from public.document_versions dv
join public.documents d on d.id=dv.document_id
join lateral (
  select id from public.processes order by display_order,created_at
  offset case d.document_code when 'DEMO-DOC-001' then 2 when 'DEMO-DOC-002' then 5 else 7 end limit 1
) p on true
where d.document_code like 'DEMO-DOC-%'
on conflict (document_version_id,process_id,link_role) do nothing;

update public.document_versions dv
set status='effective',published_at=coalesce(published_at,now()),published_by=coalesce(published_by,approved_by)
from public.documents d
where d.id=dv.document_id
  and d.document_code in ('DEMO-DOC-001','DEMO-DOC-003')
  and dv.version_number=1
  and dv.status='approved';

insert into public.reading_assignments(object_type,object_id,profile_id,required,due_at)
select 'document_version'::public.review_object_type,dv.id,p.id,true,now()+interval '7 days'
from public.document_versions dv
join public.documents d on d.id=dv.document_id
cross join public.profiles p
where d.document_code='DEMO-DOC-003' and dv.version_number=1
  and p.display_name in ('linhdoan','tuanhpham') and p.is_active
on conflict (object_type,object_id,profile_id) do nothing;
