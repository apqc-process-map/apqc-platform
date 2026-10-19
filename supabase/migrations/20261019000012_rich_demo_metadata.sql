-- Rich reversible demo fixtures for full process, document, relationship and finding coverage.
begin;

-- Controlled values used by applicability, documents and findings.
insert into public.vocabularies (code, name, is_system)
values
  ('legal_entity', 'Legal entity', true),
  ('department', 'Department', true),
  ('location', 'Location', true),
  ('channel', 'Channel', true),
  ('product_service', 'Product/service', true),
  ('employee_audience', 'Employee audience', true),
  ('finding_type', 'Finding type', true),
  ('resolution_type', 'Resolution type', true)
on conflict (code) do update set name = excluded.name, is_system = true;

insert into public.vocabulary_values (vocabulary_id, code, label_vi, label_en, display_order, is_active)
select v.id, x.code, x.label_vi, x.label_en, x.display_order, true
from public.vocabularies v
join (values
  ('legal_entity', 'pnj_retail', 'Công ty bán lẻ trang sức', 'Retail entity', 10),
  ('legal_entity', 'pnj_ecommerce', 'Kênh thương mại điện tử', 'E-commerce entity', 20),
  ('department', 'sales', 'Kinh doanh', 'Sales', 10),
  ('department', 'supply_chain', 'Chuỗi cung ứng', 'Supply Chain', 20),
  ('department', 'procurement', 'Mua hàng', 'Procurement', 30),
  ('department', 'customer_service', 'Chăm sóc khách hàng', 'Customer Service', 40),
  ('department', 'finance', 'Tài chính', 'Finance', 50),
  ('location', 'nationwide', 'Toàn quốc', 'Nationwide', 10),
  ('location', 'hcm', 'Thành phố Hồ Chí Minh', 'Ho Chi Minh City', 20),
  ('location', 'distribution_center', 'Trung tâm phân phối', 'Distribution Center', 30),
  ('channel', 'store', 'Cửa hàng', 'Store', 10),
  ('channel', 'ecommerce', 'Thương mại điện tử', 'E-commerce', 20),
  ('channel', 'marketplace', 'Sàn thương mại điện tử', 'Marketplace', 30),
  ('channel', 'omnichannel', 'Đa kênh', 'Omnichannel', 40),
  ('product_service', 'jewelry', 'Trang sức', 'Jewelry', 10),
  ('product_service', 'after_sales', 'Dịch vụ hậu mãi', 'After-sales service', 20),
  ('product_service', 'delivery', 'Dịch vụ giao hàng', 'Delivery service', 30),
  ('employee_audience', 'store_operations', 'Vận hành cửa hàng', 'Store operations', 10),
  ('employee_audience', 'procurement_team', 'Đội ngũ mua hàng', 'Procurement team', 20),
  ('employee_audience', 'finance_team', 'Đội ngũ tài chính', 'Finance team', 30),
  ('employee_audience', 'customer_care', 'Chăm sóc khách hàng', 'Customer care', 40),
  ('finding_type', 'control_gap', 'Thiếu kiểm soát', 'Control gap', 10),
  ('finding_type', 'mapping_gap', 'Thiếu ánh xạ', 'Mapping gap', 20),
  ('finding_type', 'documentation_gap', 'Thiếu tài liệu', 'Documentation gap', 30),
  ('finding_type', 'review_gap', 'Thiếu rà soát định kỳ', 'Review gap', 40),
  ('finding_type', 'data_quality', 'Chất lượng dữ liệu', 'Data quality', 50),
  ('resolution_type', 'corrective_action', 'Hành động khắc phục', 'Corrective action', 10),
  ('resolution_type', 'accepted_risk', 'Chấp nhận rủi ro', 'Accepted risk', 20),
  ('resolution_type', 'not_applicable', 'Không áp dụng', 'Not applicable', 30),
  ('resolution_type', 'duplicate', 'Trùng lặp', 'Duplicate', 40)
) as x(vocabulary_code, code, label_vi, label_en, display_order)
  on v.code = x.vocabulary_code
on conflict (vocabulary_id, code) do update set
  label_vi = excluded.label_vi,
  label_en = excluded.label_en,
  display_order = excluded.display_order,
  is_active = true;

-- Controlled tags are separate from authorization and applicability.
create table if not exists public.governance_tags (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label_vi text not null,
  label_en text,
  color text not null default '#5aa99f',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.object_tags (
  object_type public.review_object_type not null,
  object_id uuid not null,
  tag_id uuid not null references public.governance_tags(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (object_type, object_id, tag_id)
);

create index if not exists object_tags_object_idx on public.object_tags(object_type, object_id);
create index if not exists object_tags_tag_idx on public.object_tags(tag_id);

alter table public.governance_tags enable row level security;
alter table public.object_tags enable row level security;
drop policy if exists "active users can read governance tags" on public.governance_tags;
drop policy if exists "admins can write governance tags" on public.governance_tags;
drop policy if exists "active users can read object tags" on public.object_tags;
drop policy if exists "editors can write object tags" on public.object_tags;
create policy "active users can read governance tags" on public.governance_tags
  for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "admins can write governance tags" on public.governance_tags
  for all to authenticated
  using ((select public.current_profile_role()) = any (array['admin']::public.system_role[]))
  with check ((select public.current_profile_role()) = any (array['admin']::public.system_role[]));
create policy "active users can read object tags" on public.object_tags
  for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "editors can write object tags" on public.object_tags
  for all to authenticated
  using ((select public.current_profile_role()) = any (array['admin','editor']::public.system_role[]))
  with check ((select public.current_profile_role()) = any (array['admin','editor']::public.system_role[]));
revoke all on public.governance_tags, public.object_tags from anon;
grant select on public.governance_tags, public.object_tags to authenticated;
grant insert, update, delete on public.governance_tags, public.object_tags to authenticated;

insert into public.governance_tags (code, label_vi, label_en, color)
values
  ('DEMO-TAG-01', '[DEMO] Trọng yếu khách hàng', '[DEMO] Customer critical', '#d87557'),
  ('DEMO-TAG-02', '[DEMO] Đa kênh', '[DEMO] Omnichannel', '#5aa99f'),
  ('DEMO-TAG-03', '[DEMO] Chuỗi cung ứng', '[DEMO] Supply chain', '#d5ad4f'),
  ('DEMO-TAG-04', '[DEMO] Kiểm soát cao', '[DEMO] High control', '#7c6fc4'),
  ('DEMO-TAG-05', '[DEMO] Tài chính', '[DEMO] Finance', '#4f87b5'),
  ('DEMO-TAG-06', '[DEMO] Cần rà soát', '[DEMO] Review required', '#bf6b83')
on conflict (code) do update set
  label_vi = excluded.label_vi,
  label_en = excluded.label_en,
  color = excluded.color,
  is_active = true;

-- Complete the five Executive Summary fields and lifecycle metadata for all ten demo processes.
with demo(source_code, business_purpose, scope_and_boundaries, process_at_a_glance, critical_decision_points, accountability_and_impact, access_level, allowed_roles) as (
  values
    ('DEMO-20261016-01', 'Định hướng chuỗi giá trị và ưu tiên vận hành theo chiến lược kinh doanh.', 'Bao gồm các năng lực và quy trình cấp doanh nghiệp; không bao gồm thiết kế BPMN chi tiết.', 'Chiến lược → danh mục ưu tiên → mục tiêu vận hành → rà soát kết quả.', 'Phê duyệt định hướng năm; quyết định ưu tiên đầu tư; xử lý ngoại lệ trọng yếu.', 'Chủ sở hữu: Ban điều hành. Tác động: thống nhất định hướng và phân bổ nguồn lực.', 'confidential', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-02', 'Chuyển hóa chiến lược thành mục tiêu, sáng kiến và kế hoạch thực thi có thể đo lường.', 'Bao gồm lập kế hoạch và theo dõi mục tiêu; không bao gồm phê duyệt ngân sách chi tiết.', 'Thu thập định hướng → phân tích hiện trạng → lập mục tiêu → phê duyệt → theo dõi.', 'Chọn mục tiêu ưu tiên; cân đối nguồn lực; điều chỉnh khi KPI lệch ngưỡng.', 'Chủ sở hữu: Khối chiến lược. Tác động: tăng khả năng phối hợp liên phòng ban.', 'internal', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-03', 'Quản trị vòng đời danh mục để sản phẩm phù hợp nhu cầu khách hàng và năng lực cung ứng.', 'Bao gồm đề xuất, đánh giá và phê duyệt danh mục; không bao gồm thiết kế sản phẩm kỹ thuật.', 'Phân tích nhu cầu → đánh giá danh mục → quyết định → theo dõi hiệu quả.', 'Ra mắt, duy trì hoặc dừng sản phẩm; xử lý xung đột giữa doanh số và năng lực cung ứng.', 'Chủ sở hữu: Khối kinh doanh. Tác động: giảm danh mục kém hiệu quả.', 'internal', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-04', 'Đảm bảo mua đúng hàng, đúng thời điểm, đúng điều kiện và có đầy đủ hồ sơ kiểm soát.', 'Bao gồm kế hoạch mua, lựa chọn nhà cung cấp và đơn mua; không bao gồm thanh toán cuối kỳ.', 'Nhu cầu → yêu cầu mua → báo giá → phê duyệt → đặt hàng → nghiệm thu.', 'Chọn nhà cung cấp; phê duyệt vượt hạn mức; xử lý thiếu hàng hoặc giao trễ.', 'Chủ sở hữu: Mua hàng. Tác động: kiểm soát chi phí và tính liên tục nguồn cung.', 'confidential', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-05', 'Duy trì tồn kho chính xác, sẵn sàng bán và giảm rủi ro thiếu hoặc dư hàng.', 'Bao gồm theo dõi, điều chuyển, kiểm kê và xử lý chênh lệch; không bao gồm định giá kế toán.', 'Nhập kho → lưu trữ → theo dõi mức tồn → kiểm kê → điều chỉnh.', 'Đặt ngưỡng bổ sung; phê duyệt điều chuyển; xử lý chênh lệch kiểm kê.', 'Chủ sở hữu: Vận hành chuỗi cung ứng. Tác động: bảo đảm khả năng đáp ứng đơn hàng.', 'internal', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-06', 'Tạo trải nghiệm mua sắm nhất quán trên cửa hàng, website và các kênh đối tác.', 'Bao gồm tiếp nhận và điều phối đơn đa kênh; không bao gồm chiến dịch truyền thông.', 'Tiếp nhận đơn → kiểm tra tồn → giữ hàng → xác nhận → bàn giao xử lý.', 'Chọn nguồn đáp ứng; xử lý trùng đơn; quyết định chuyển kênh khi thiếu tồn.', 'Chủ sở hữu: Kinh doanh đa kênh. Tác động: tăng tỷ lệ chuyển đổi và trải nghiệm khách hàng.', 'internal', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-07', 'Xử lý đơn chính xác, nhanh và có thể truy vết từ xác nhận đến hoàn tất.', 'Bao gồm kiểm tra, chuẩn bị và xác nhận đơn; không bao gồm giao hàng chặng cuối.', 'Đơn hợp lệ → phân bổ tồn → chuẩn bị → đóng gói → bàn giao giao hàng.', 'Xác nhận ngoại lệ giá/tồn; chọn phương án thay thế; phê duyệt hủy hoặc tách đơn.', 'Chủ sở hữu: Vận hành đơn hàng. Tác động: giảm hủy đơn và sai sót giao hàng.', 'internal', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-08', 'Đưa hàng đến khách đúng hẹn, đúng địa chỉ và có bằng chứng giao nhận.', 'Bao gồm điều phối và theo dõi giao hàng; không bao gồm quản lý hợp đồng nhà vận chuyển.', 'Bàn giao → điều phối → theo dõi → giao nhận → đối soát trạng thái.', 'Chọn nhà vận chuyển; xử lý giao thất bại; quyết định giao lại hoặc hoàn hàng.', 'Chủ sở hữu: Logistics. Tác động: cải thiện tỷ lệ giao đúng hẹn và chi phí giao.', 'internal', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-09', 'Tiếp nhận, phân loại và giải quyết yêu cầu khách hàng nhất quán, có lịch sử đầy đủ.', 'Bao gồm chăm sóc trước và sau bán; không bao gồm quyết định chính sách bồi thường cấp cao.', 'Tiếp nhận → xác thực → phân loại → xử lý → phản hồi → đóng yêu cầu.', 'Ưu tiên khiếu nại; chuyển cấp; phê duyệt ngoại lệ dịch vụ.', 'Chủ sở hữu: Chăm sóc khách hàng. Tác động: tăng mức hài lòng và khả năng giữ khách.', 'limited', ARRAY['viewer','editor','admin']::public.system_role[]),
    ('DEMO-20261016-10', 'Đối chiếu doanh thu, đơn hàng và dòng tiền để số liệu quản trị đáng tin cậy.', 'Bao gồm đối soát giao dịch và lập báo cáo sai lệch; không bao gồm lập báo cáo tài chính theo chuẩn mực.', 'Thu thập dữ liệu → đối chiếu → phân tích sai lệch → xử lý → xác nhận.', 'Chọn ngưỡng sai lệch; phê duyệt bút toán điều chỉnh; đóng kỳ đối soát.', 'Chủ sở hữu: Tài chính. Tác động: giảm sai lệch và tăng tính minh bạch số liệu.', 'confidential', ARRAY['viewer','editor','admin']::public.system_role[])
)
update public.process_versions pv
set business_purpose = demo.business_purpose,
    scope_and_boundaries = demo.scope_and_boundaries,
    process_at_a_glance = demo.process_at_a_glance,
    critical_decision_points = demo.critical_decision_points,
    accountability_and_impact = demo.accountability_and_impact,
    access_level = demo.access_level::public.access_level,
    allowed_roles = demo.allowed_roles,
    valid_from = coalesce(pv.valid_from, date '2026-01-01'),
    review_due_at = coalesce(pv.review_due_at, date '2027-04-14'),
    change_summary = '[DEMO] Bổ sung metadata đầy đủ để kiểm thử giao diện và governance.',
    updated_at = now()
from public.processes p
join demo on demo.source_code = p.source_code
where pv.process_id = p.id;

-- Make applicability testable across all supported dimensions.
with rows(source_code, dimension, value_code) as (
  values
    ('DEMO-20261016-01','department','sales'),
    ('DEMO-20261016-01','location','nationwide'),
    ('DEMO-20261016-02','department','sales'),
    ('DEMO-20261016-02','employee_audience','finance_team'),
    ('DEMO-20261016-03','department','sales'),
    ('DEMO-20261016-03','product_service','jewelry'),
    ('DEMO-20261016-04','department','procurement'),
    ('DEMO-20261016-04','location','distribution_center'),
    ('DEMO-20261016-05','department','supply_chain'),
    ('DEMO-20261016-05','product_service','jewelry'),
    ('DEMO-20261016-06','channel','omnichannel'),
    ('DEMO-20261016-06','employee_audience','store_operations'),
    ('DEMO-20261016-07','channel','ecommerce'),
    ('DEMO-20261016-07','product_service','jewelry'),
    ('DEMO-20261016-08','channel','ecommerce'),
    ('DEMO-20261016-08','product_service','delivery'),
    ('DEMO-20261016-09','department','customer_service'),
    ('DEMO-20261016-09','employee_audience','customer_care'),
    ('DEMO-20261016-10','department','finance'),
    ('DEMO-20261016-10','employee_audience','finance_team')
)
insert into public.object_applicability(object_type, object_id, dimension, vocabulary_value_id, is_inherited)
select 'process_version'::public.review_object_type, pv.id, rows.dimension::public.applicability_dimension, vv.id, false
from rows
join public.processes p on p.source_code = rows.source_code
join public.process_versions pv on pv.process_id = p.id
join public.vocabularies v on v.code = rows.dimension
join public.vocabulary_values vv on vv.vocabulary_id = v.id and vv.code = rows.value_code
where not exists (
  select 1 from public.object_applicability oa
  where oa.object_type = 'process_version'::public.review_object_type
    and oa.object_id = pv.id
    and oa.dimension = rows.dimension::public.applicability_dimension
    and oa.vocabulary_value_id = vv.id
);

with rows(source_code, system_code) as (
  values
    ('DEMO-20261016-01','DEMO-20261016-ERP'),
    ('DEMO-20261016-02','DEMO-20261016-ERP'),
    ('DEMO-20261016-03','DEMO-20261016-ERP'),
    ('DEMO-20261016-04','DEMO-20261016-ERP'),
    ('DEMO-20261016-05','DEMO-20261016-ERP'),
    ('DEMO-20261016-06','DEMO-20261016-OMS'),
    ('DEMO-20261016-07','DEMO-20261016-OMS'),
    ('DEMO-20261016-08','DEMO-20261016-OMS'),
    ('DEMO-20261016-09','DEMO-20261016-CRM'),
    ('DEMO-20261016-10','DEMO-20261016-ERP')
)
insert into public.object_applicability(object_type, object_id, dimension, system_id, is_inherited)
select 'process_version'::public.review_object_type, pv.id, 'system'::public.applicability_dimension, s.id, false
from rows
join public.processes p on p.source_code = rows.source_code
join public.process_versions pv on pv.process_id = p.id
join public.systems s on s.code = rows.system_code
where not exists (
  select 1 from public.object_applicability oa
  where oa.object_type = 'process_version'::public.review_object_type
    and oa.object_id = pv.id
    and oa.dimension = 'system'::public.applicability_dimension
    and oa.system_id = s.id
);

insert into public.object_applicability(object_type, object_id, dimension, free_text, is_inherited)
select 'process_version'::public.review_object_type, pv.id, 'exception'::public.applicability_dimension,
       case p.source_code
         when 'DEMO-20261016-05' then '[DEMO] Áp dụng ngoại lệ khi kiểm kê chênh lệch vượt ngưỡng.'
         when 'DEMO-20261016-08' then '[DEMO] Áp dụng ngoại lệ khi giao hàng thất bại lần đầu.'
         else '[DEMO] Áp dụng ngoại lệ theo phê duyệt của chủ sở hữu.'
       end,
       false
from public.processes p
join public.process_versions pv on pv.process_id = p.id
where p.source_code like 'DEMO-20261016-%'
  and not exists (
    select 1 from public.object_applicability oa
    where oa.object_type = 'process_version'::public.review_object_type
      and oa.object_id = pv.id
      and oa.dimension = 'exception'::public.applicability_dimension
  );

-- Add governance relationships with evidence so Relationship and Legend views have real coverage.
with rows(source_code, target_code) as (
  values
    ('DEMO-20261016-01','DEMO-20261016-ERP'),
    ('DEMO-20261016-02','DEMO-20261016-ERP'),
    ('DEMO-20261016-03','DEMO-20261016-ERP'),
    ('DEMO-20261016-04','DEMO-20261016-ERP'),
    ('DEMO-20261016-05','DEMO-20261016-ERP'),
    ('DEMO-20261016-06','DEMO-20261016-OMS'),
    ('DEMO-20261016-07','DEMO-20261016-OMS'),
    ('DEMO-20261016-08','DEMO-20261016-OMS'),
    ('DEMO-20261016-09','DEMO-20261016-CRM'),
    ('DEMO-20261016-10','DEMO-20261016-ERP')
)
insert into public.object_relationships(source_type, source_id, target_type, target_id, relationship_type_id, label, description, status, evidence_text)
select 'process'::public.relationship_object_type, p.id, 'system'::public.relationship_object_type, s.id, rt.id,
       'Sử dụng hệ thống', '[DEMO] Hệ thống là nguồn dữ liệu hoặc điểm kiểm soát của quy trình.', 'verified'::public.relationship_status,
       '[DEMO] Cấu hình synthetic để kiểm thử relationship graph.'
from rows
join public.processes p on p.source_code = rows.source_code
join public.systems s on s.code = rows.target_code
join public.relationship_types rt on rt.code = 'uses_system'
where not exists (
  select 1 from public.object_relationships r
  where r.source_id = p.id and r.target_id = s.id and r.relationship_type_id = rt.id
);

with rows(source_code, target_code) as (
  values
    ('DEMO-20261016-05','DEMO-20261016-R01'),
    ('DEMO-20261016-10','DEMO-20261016-R02'),
    ('DEMO-20261016-08','DEMO-20261016-R03'),
    ('DEMO-20261016-07','DEMO-20261016-R01'),
    ('DEMO-20261016-09','DEMO-20261016-R02')
)
insert into public.object_relationships(source_type, source_id, target_type, target_id, relationship_type_id, label, description, status, evidence_text)
select 'process'::public.relationship_object_type, p.id, 'risk'::public.relationship_object_type, r.id, rt.id,
       'Xử lý rủi ro', '[DEMO] Rủi ro liên quan dùng để kiểm thử severity, owner và evidence.', 'verified'::public.relationship_status,
       '[DEMO] Risk relationship evidence.'
from rows
join public.processes p on p.source_code = rows.source_code
join public.risks r on r.code = rows.target_code
join public.relationship_types rt on rt.code = 'addresses_risk'
where not exists (
  select 1 from public.object_relationships rel
  where rel.source_id = p.id and rel.target_id = r.id and rel.relationship_type_id = rt.id
);

with rows(source_code, target_code) as (
  values
    ('DEMO-20261016-06','DEMO-20261016-K01'),
    ('DEMO-20261016-05','DEMO-20261016-K02'),
    ('DEMO-20261016-08','DEMO-20261016-K03'),
    ('DEMO-20261016-09','DEMO-20261016-K01'),
    ('DEMO-20261016-10','DEMO-20261016-K02')
)
insert into public.object_relationships(source_type, source_id, target_type, target_id, relationship_type_id, label, description, status, evidence_text)
select 'process'::public.relationship_object_type, p.id, 'kpi'::public.relationship_object_type, k.id, rt.id,
       'Ảnh hưởng KPI', '[DEMO] KPI dùng để kiểm thử coverage và health signals.', 'verified'::public.relationship_status,
       '[DEMO] KPI relationship evidence.'
from rows
join public.processes p on p.source_code = rows.source_code
join public.kpis k on k.code = rows.target_code
join public.relationship_types rt on rt.code = 'influences_kpi'
where not exists (
  select 1 from public.object_relationships rel
  where rel.source_id = p.id and rel.target_id = k.id and rel.relationship_type_id = rt.id
);

with rows(source_code, target_code) as (
  values
    ('DEMO-20261016-04','DEMO-20261016-RL02'),
    ('DEMO-20261016-05','DEMO-20261016-RL01'),
    ('DEMO-20261016-09','DEMO-20261016-RL03'),
    ('DEMO-20261016-10','DEMO-20261016-RL02')
)
insert into public.object_relationships(source_type, source_id, target_type, target_id, relationship_type_id, label, description, status, evidence_text)
select 'process'::public.relationship_object_type, p.id, 'business_role'::public.relationship_object_type, br.id, rt.id,
       'Được quản trị bởi', '[DEMO] Vai trò dùng để kiểm thử ownership và accountability.', 'verified'::public.relationship_status,
       '[DEMO] Governance role evidence.'
from rows
join public.processes p on p.source_code = rows.source_code
join public.business_roles br on br.code = rows.target_code
join public.relationship_types rt on rt.code = 'governed_by'
where not exists (
  select 1 from public.object_relationships rel
  where rel.source_id = p.id and rel.target_id = br.id and rel.relationship_type_id = rt.id
);

-- Make the document cards exercise type, group, language, access and validity metadata.
update public.document_versions dv
set document_group = case d.document_code
  when 'DEMO-DOC-001' then 'Execution'
  when 'DEMO-DOC-002' then 'Governance'
  when 'DEMO-DOC-003' then 'Evidence'
  else dv.document_group
end,
document_type_value_id = (
  select vv.id
  from public.vocabularies v
  join public.vocabulary_values vv on vv.vocabulary_id = v.id
  where v.code = 'document_type'
    and vv.code = case d.document_code
      when 'DEMO-DOC-001' then 'procedure'
      when 'DEMO-DOC-002' then 'policy'
      when 'DEMO-DOC-003' then 'audit_report'
      else 'procedure'
    end
),
language = case d.document_code when 'DEMO-DOC-002' then 'vi' else 'vi-VN' end,
access_level = (case d.document_code when 'DEMO-DOC-002' then 'confidential' else 'internal' end)::public.access_level,
allowed_roles = case d.document_code
  when 'DEMO-DOC-002' then ARRAY['editor','admin']::public.system_role[]
  else ARRAY['viewer','editor','admin']::public.system_role[]
end,
valid_from = coalesce(dv.valid_from, date '2026-01-01'),
review_due_at = coalesce(dv.review_due_at, date '2027-01-15'),
change_summary = '[DEMO] Bổ sung metadata tài liệu để kiểm thử filter, detail và compare.',
updated_at = now()
from public.documents d
where dv.document_id = d.id and d.document_code like 'DEMO-DOC-%';

with rows(document_code, dimension, value_code) as (
  values
    ('DEMO-DOC-001','department','supply_chain'),
    ('DEMO-DOC-001','employee_audience','store_operations'),
    ('DEMO-DOC-002','department','finance'),
    ('DEMO-DOC-003','department','customer_service')
)
insert into public.object_applicability(object_type, object_id, dimension, vocabulary_value_id, is_inherited)
select 'document_version'::public.review_object_type, dv.id, rows.dimension::public.applicability_dimension, vv.id, false
from rows
join public.documents d on d.document_code = rows.document_code
join public.document_versions dv on dv.document_id = d.id
join public.vocabularies v on v.code = rows.dimension
join public.vocabulary_values vv on vv.vocabulary_id = v.id and vv.code = rows.value_code
where not exists (
  select 1 from public.object_applicability oa
  where oa.object_type = 'document_version'::public.review_object_type
    and oa.object_id = dv.id
    and oa.dimension = rows.dimension::public.applicability_dimension
    and oa.vocabulary_value_id = vv.id
);

-- Give the finding page examples of type, due date, resolution and linked evidence.
update public.findings f
set finding_type_value_id = (
      select vv.id from public.vocabularies v
      join public.vocabulary_values vv on vv.vocabulary_id = v.id
      where v.code = 'finding_type'
        and vv.code = case f.finding_code
          when 'FND-000010' then 'control_gap'
          when 'FND-000011' then 'data_quality'
          when 'FND-000012' then 'documentation_gap'
          when 'FND-000013' then 'mapping_gap'
          else 'review_gap'
        end
    ),
    resolution_type_value_id = case f.finding_code
      when 'FND-000011' then (
        select vv.id from public.vocabularies v
        join public.vocabulary_values vv on vv.vocabulary_id = v.id
        where v.code = 'resolution_type' and vv.code = 'corrective_action'
      )
      else f.resolution_type_value_id
    end,
    due_at = coalesce(f.due_at, now() + interval '21 days'),
    resolution_summary = case f.finding_code
      when 'FND-000011' then '[DEMO] Đã đối soát lại dữ liệu và bổ sung bước kiểm tra tự động.'
      when 'FND-000013' then '[DEMO] Chờ chủ sở hữu xác nhận mapping chính thức.'
      else coalesce(f.resolution_summary, '[DEMO] Đang theo dõi theo workflow mẫu.')
    end,
    updated_at = now()
where f.finding_code between 'FND-000010' and 'FND-000014';

with rows(finding_code, source_code, link_role, evidence_excerpt) as (
  values
    ('FND-000010','DEMO-20261016-05','subject','Tồn kho thấp hơn ngưỡng bổ sung trong tuần cao điểm.'),
    ('FND-000011','DEMO-20261016-10','subject','Sai lệch đối soát giữa OMS và ERP đã được ghi nhận.'),
    ('FND-000012','DEMO-20261016-04','subject','Thiếu trường owner trong bản quy trình mua hàng.'),
    ('FND-000013','DEMO-20261016-06','subject','Mapping APQC cần được chủ sở hữu xác nhận.'),
    ('FND-000014','DEMO-20261016-08','subject','Tỷ lệ giao đúng hẹn giảm trong nhóm đơn nội thành.')
)
insert into public.finding_links(finding_id, object_type, object_id, link_role, evidence_excerpt)
select f.id, 'process_version', pv.id, rows.link_role::public.finding_link_role, rows.evidence_excerpt
from rows
join public.findings f on f.finding_code = rows.finding_code
join public.processes p on p.source_code = rows.source_code
join public.process_versions pv on pv.process_id = p.id
where not exists (
  select 1 from public.finding_links fl
  where fl.finding_id = f.id and fl.object_type = 'process_version' and fl.object_id = pv.id
);

-- Tag process and document versions for list/detail/filter testing.
with rows(source_code, tag_code) as (
  values
    ('DEMO-20261016-01','DEMO-TAG-04'),
    ('DEMO-20261016-02','DEMO-TAG-04'),
    ('DEMO-20261016-03','DEMO-TAG-02'),
    ('DEMO-20261016-04','DEMO-TAG-03'),
    ('DEMO-20261016-04','DEMO-TAG-04'),
    ('DEMO-20261016-05','DEMO-TAG-03'),
    ('DEMO-20261016-05','DEMO-TAG-06'),
    ('DEMO-20261016-06','DEMO-TAG-01'),
    ('DEMO-20261016-06','DEMO-TAG-02'),
    ('DEMO-20261016-07','DEMO-TAG-01'),
    ('DEMO-20261016-08','DEMO-TAG-02'),
    ('DEMO-20261016-08','DEMO-TAG-06'),
    ('DEMO-20261016-09','DEMO-TAG-01'),
    ('DEMO-20261016-10','DEMO-TAG-04'),
    ('DEMO-20261016-10','DEMO-TAG-05')
)
insert into public.object_tags(object_type, object_id, tag_id)
select 'process_version'::public.review_object_type, pv.id, gt.id
from rows
join public.processes p on p.source_code = rows.source_code
join public.process_versions pv on pv.process_id = p.id
join public.governance_tags gt on gt.code = rows.tag_code
on conflict (object_type, object_id, tag_id) do nothing;

with rows(document_code, tag_code) as (
  values
    ('DEMO-DOC-001','DEMO-TAG-03'),
    ('DEMO-DOC-001','DEMO-TAG-04'),
    ('DEMO-DOC-002','DEMO-TAG-04'),
    ('DEMO-DOC-002','DEMO-TAG-05'),
    ('DEMO-DOC-003','DEMO-TAG-06')
)
insert into public.object_tags(object_type, object_id, tag_id)
select 'document_version'::public.review_object_type, dv.id, gt.id
from rows
join public.documents d on d.document_code = rows.document_code
join public.document_versions dv on dv.document_id = d.id
join public.governance_tags gt on gt.code = rows.tag_code
on conflict (object_type, object_id, tag_id) do nothing;

-- Keep existing APQC rows visibly useful in coverage and review screens.
update public.process_apqc_mappings pam
set status = 'verified'::public.mapping_status,
    rationale = case
      when coalesce(pam.rationale, '') = '' then '[DEMO] Mapping được chọn để minh họa coverage APQC và cần review.'
      else pam.rationale
    end,
    verified_at = coalesce(pam.verified_at, now())
where pam.process_version_id in (
  select pv.id
  from public.process_versions pv
  join public.processes p on p.id = pv.process_id
  where p.source_code like 'DEMO-20261016-%'
);

commit;
