insert into public.relationship_types(code,group_code,label_vi,label_en,inverse_label_vi,inverse_label_en,is_directed,allowed_source_types,allowed_target_types,is_active)
values
('role_must_know_document','knowledge','Bắt buộc phải biết','Must know','Bắt buộc đối với vai trò','Required by role',true,array['business_role'],array['document'],true),
('role_should_know_document','knowledge','Nên biết / tham chiếu','Should know / reference','Nên biết đối với vai trò','Recommended for role',true,array['business_role'],array['document'],true)
on conflict(code) do update set group_code=excluded.group_code,label_vi=excluded.label_vi,label_en=excluded.label_en,inverse_label_vi=excluded.inverse_label_vi,inverse_label_en=excluded.inverse_label_en,is_directed=excluded.is_directed,allowed_source_types=excluded.allowed_source_types,allowed_target_types=excluded.allowed_target_types,is_active=true;

with mappings(role_code,document_code,type_code,description) as (values
('DEMO-20261016-RL01','DEMO-DOC-001','role_must_know_document','[DEMO] Quản lý cửa hàng phải nắm quy trình xử lý đơn hàng.'),
('DEMO-20261016-RL01','DEMO-DOC-003','role_must_know_document','[DEMO] Quản lý cửa hàng phải kiểm soát hướng dẫn kiểm kê kho.'),
('DEMO-20261016-RL01','DEMO-DOC-002','role_should_know_document','[DEMO] Tham chiếu chính sách nhà cung cấp khi phát sinh nghiệp vụ.'),
('DEMO-20261016-RL02','DEMO-DOC-002','role_must_know_document','[DEMO] Chuyên viên mua hàng phải nắm chính sách quản trị nhà cung cấp.'),
('DEMO-20261016-RL02','DEMO-DOC-003','role_should_know_document','[DEMO] Tham chiếu khi phối hợp nhận hàng và kiểm kê.'),
('DEMO-20261016-RL03','DEMO-DOC-001','role_should_know_document','[DEMO] Tham chiếu quy trình đơn hàng khi xử lý yêu cầu khách hàng.')
)
insert into public.object_relationships(source_type,source_id,target_type,target_id,relationship_type_id,label,description,status,evidence_text)
select 'business_role'::public.relationship_object_type,br.id,'document'::public.relationship_object_type,d.id,rt.id,rt.label_vi,m.description,'verified'::public.relationship_status,'[DEMO] Role knowledge profile seed.'
from mappings m join public.business_roles br on br.code=m.role_code join public.documents d on d.document_code=m.document_code join public.relationship_types rt on rt.code=m.type_code
where not exists(select 1 from public.object_relationships r where r.source_type='business_role' and r.source_id=br.id and r.target_type='document' and r.target_id=d.id and r.relationship_type_id=rt.id);
