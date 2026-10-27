-- Keep document metadata, Finding evidence and corrective-action mutations atomic.

create or replace function public.create_document_draft_atomic(
  p_metadata jsonb,
  p_process_id uuid default null,
  p_scopes jsonb default '[]'::jsonb,
  p_tag_ids uuid[] default '{}'::uuid[],
  p_knowledge jsonb default '{}'::jsonb
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_role public.system_role := (select public.current_profile_role());
  created_document_id uuid;
  created_version_id uuid;
  scope_row jsonb;
begin
  if actor is null or actor_role not in ('editor','admin') then
    raise exception 'Không có quyền tạo tài liệu';
  end if;
  if jsonb_typeof(p_metadata) <> 'object' or jsonb_typeof(p_scopes) <> 'array'
     or jsonb_typeof(p_knowledge) <> 'object' or nullif(btrim(p_metadata->>'title_vi'),'') is null then
    raise exception 'Payload tài liệu không hợp lệ';
  end if;
  if actor_role <> 'admin' and p_knowledge <> '{}'::jsonb then
    raise exception 'Chỉ Admin được quản lý nhóm chức danh cần biết';
  end if;

  insert into public.documents(created_by) values (actor) returning id into created_document_id;
  insert into public.document_versions(
    document_id,version_number,status,created_by,title_vi,title_en,document_group,
    document_type_value_id,language,document_abstract,change_summary,valid_from,valid_until,
    review_due_at,issuing_department,applicability_note,keywords,owner_id,designated_approver_id,
    legal_reference,retention_note,risk_rating,access_level,allowed_roles
  ) values (
    created_document_id,1,'draft',actor,p_metadata->>'title_vi',nullif(p_metadata->>'title_en',''),
    p_metadata->>'document_group',nullif(p_metadata->>'document_type_value_id','')::uuid,
    p_metadata->>'language',nullif(p_metadata->>'document_abstract',''),coalesce(p_metadata->>'change_summary',''),
    nullif(p_metadata->>'valid_from','')::date,nullif(p_metadata->>'valid_until','')::date,
    nullif(p_metadata->>'review_due_at','')::date,nullif(p_metadata->>'issuing_department',''),
    nullif(p_metadata->>'applicability_note',''),nullif(p_metadata->>'keywords',''),
    nullif(p_metadata->>'owner_id','')::uuid,nullif(p_metadata->>'designated_approver_id','')::uuid,
    nullif(p_metadata->>'legal_reference',''),nullif(p_metadata->>'retention_note',''),
    nullif(p_metadata->>'risk_rating',''),(p_metadata->>'access_level')::public.access_level,
    array(select value::public.system_role from jsonb_array_elements_text(p_metadata->'allowed_roles') value)
  ) returning id into created_version_id;

  if p_process_id is not null then
    insert into public.document_process_links(document_version_id,process_id,link_role)
    values (created_version_id,p_process_id,'primary');
  end if;
  for scope_row in select value from jsonb_array_elements(p_scopes)
  loop
    insert into public.object_applicability(object_type,object_id,dimension,vocabulary_value_id)
    values ('document_version',created_version_id,
      (scope_row->>'dimension')::public.applicability_dimension,
      (scope_row->>'vocabulary_value_id')::uuid);
  end loop;
  insert into public.object_tags(object_type,object_id,tag_id,assigned_by)
  select 'document_version',created_version_id,tag_id,actor from unnest(p_tag_ids) tag_id;
  if actor_role = 'admin' then
    perform public.set_document_knowledge_audience(created_document_id,p_knowledge);
  end if;
  return created_version_id;
end;
$$;
revoke all on function public.create_document_draft_atomic(jsonb,uuid,jsonb,uuid[],jsonb) from public,anon;
grant execute on function public.create_document_draft_atomic(jsonb,uuid,jsonb,uuid[],jsonb) to authenticated;
create or replace function public.update_document_metadata_atomic(
  p_version_id uuid,
  p_metadata jsonb,
  p_process_id uuid default null,
  p_scopes jsonb default '[]'::jsonb,
  p_tag_ids uuid[] default '{}'::uuid[],
  p_knowledge jsonb default '{}'::jsonb
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_role public.system_role := (select public.current_profile_role());
  current_row public.document_versions%rowtype;
  scope_row jsonb;
begin
  if actor is null or actor_role not in ('editor','admin') then
    raise exception 'Không có quyền chỉnh sửa tài liệu';
  end if;
  if jsonb_typeof(p_metadata) <> 'object' or jsonb_typeof(p_scopes) <> 'array'
     or jsonb_typeof(p_knowledge) <> 'object' then
    raise exception 'Payload metadata không hợp lệ';
  end if;

  select * into current_row from public.document_versions
  where id = p_version_id for update;
  if not found then raise exception 'Không tìm thấy phiên bản tài liệu'; end if;
  if current_row.status not in ('draft','rejected') then
    raise exception 'Chỉ chỉnh sửa bản nháp hoặc bị từ chối';
  end if;
  if actor_role = 'editor' and current_row.created_by <> actor
     and current_row.owner_id is distinct from actor then
    raise exception 'Bạn không phụ trách tài liệu này';
  end if;
  if actor_role <> 'admin' and p_knowledge <> '{}'::jsonb then
    raise exception 'Chỉ Admin được quản lý nhóm chức danh cần biết';
  end if;

  update public.document_versions set
    title_vi = p_metadata->>'title_vi',
    title_en = nullif(p_metadata->>'title_en',''),
    document_group = p_metadata->>'document_group',
    document_type_value_id = nullif(p_metadata->>'document_type_value_id','')::uuid,
    language = p_metadata->>'language',
    document_abstract = nullif(p_metadata->>'document_abstract',''),
    change_summary = coalesce(p_metadata->>'change_summary',''),
    valid_from = nullif(p_metadata->>'valid_from','')::date,
    valid_until = nullif(p_metadata->>'valid_until','')::date,
    review_due_at = nullif(p_metadata->>'review_due_at','')::date,
    issuing_department = nullif(p_metadata->>'issuing_department',''),
    applicability_note = nullif(p_metadata->>'applicability_note',''),
    keywords = nullif(p_metadata->>'keywords',''),
    owner_id = nullif(p_metadata->>'owner_id','')::uuid,
    designated_approver_id = nullif(p_metadata->>'designated_approver_id','')::uuid,
    legal_reference = nullif(p_metadata->>'legal_reference',''),
    retention_note = nullif(p_metadata->>'retention_note',''),
    risk_rating = nullif(p_metadata->>'risk_rating',''),
    access_level = (p_metadata->>'access_level')::public.access_level,
    allowed_roles = array(
      select value::public.system_role from jsonb_array_elements_text(p_metadata->'allowed_roles') value
    ),
    updated_at = now()
  where id = p_version_id;

  delete from public.document_process_links
  where document_version_id = p_version_id and link_role = 'primary';
  delete from public.object_applicability
  where object_type = 'document_version' and object_id = p_version_id
    and dimension in ('legal_entity','department','location','channel','product_service','employee_audience');
  delete from public.object_tags
  where object_type = 'document_version' and object_id = p_version_id;

  if p_process_id is not null then
    insert into public.document_process_links(document_version_id,process_id,link_role)
    values (p_version_id,p_process_id,'primary');
  end if;
  for scope_row in select value from jsonb_array_elements(p_scopes)
  loop
    insert into public.object_applicability(object_type,object_id,dimension,vocabulary_value_id)
    values ('document_version',p_version_id,
      (scope_row->>'dimension')::public.applicability_dimension,
      (scope_row->>'vocabulary_value_id')::uuid);
  end loop;
  insert into public.object_tags(object_type,object_id,tag_id,assigned_by)
  select 'document_version',p_version_id,tag_id,actor from unnest(p_tag_ids) tag_id;

  if actor_role = 'admin' then
    perform public.set_document_knowledge_audience(current_row.document_id,p_knowledge);
  end if;
  return p_version_id;
end;
$$;
revoke all on function public.update_document_metadata_atomic(uuid,jsonb,uuid,jsonb,uuid[],jsonb) from public,anon;
grant execute on function public.update_document_metadata_atomic(uuid,jsonb,uuid,jsonb,uuid[],jsonb) to authenticated;

create or replace function public.create_document_finding_atomic(
  p_payload jsonb,
  p_document_version_ids uuid[],
  p_process_version_id uuid default null
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_role public.system_role := (select public.current_profile_role());
  created_id uuid;
  visible_count integer;
  identity_count integer;
begin
  if actor is null or actor_role not in ('editor','admin') then
    raise exception 'Không có quyền tạo finding';
  end if;
  if jsonb_typeof(p_payload) <> 'object' or cardinality(p_document_version_ids) not between 2 and 20 then
    raise exception 'Finding cần từ 2 đến 20 phiên bản tài liệu';
  end if;
  select count(*),count(distinct document_id) into visible_count,identity_count
  from public.document_versions where id = any(p_document_version_ids);
  if visible_count <> cardinality(p_document_version_ids) or identity_count < 2 then
    raise exception 'Tài liệu không tồn tại, không được phép truy cập hoặc không đủ hai tài liệu khác nhau';
  end if;
  if p_process_version_id is not null and not exists (
    select 1 from public.process_versions where id = p_process_version_id
  ) then raise exception 'Quy trình không tồn tại hoặc không được phép truy cập'; end if;

  insert into public.findings(
    title,description,impact_summary,finding_domain,primary_issue_code,
    classification_rationale,decision_point,evidence_status,owner_question,proposed_action,
    severity,priority,status,created_by,assignee_id,due_at
  ) values (
    p_payload->>'title',p_payload->>'description',nullif(p_payload->>'impact_summary',''),'document',
    p_payload->>'primary_issue_code',p_payload->>'classification_rationale',nullif(p_payload->>'decision_point',''),
    p_payload->>'evidence_status',nullif(p_payload->>'owner_question',''),nullif(p_payload->>'proposed_action',''),
    (p_payload->>'severity')::public.finding_severity,(p_payload->>'priority')::public.finding_priority,
    'new',actor,nullif(p_payload->>'assignee_id','')::uuid,nullif(p_payload->>'due_at','')::timestamptz
  ) returning id into created_id;

  insert into public.finding_links(finding_id,object_type,object_id,link_role,evidence_excerpt)
  select created_id,'document_version',version_id,'subject',nullif(p_payload->>'evidence_excerpt','')
  from unnest(p_document_version_ids) version_id;
  if p_process_version_id is not null then
    insert into public.finding_links(finding_id,object_type,object_id,link_role)
    values (created_id,'process_version',p_process_version_id,'subject');
  end if;
  return created_id;
end;
$$;
revoke all on function public.create_document_finding_atomic(jsonb,uuid[],uuid) from public,anon;
grant execute on function public.create_document_finding_atomic(jsonb,uuid[],uuid) to authenticated;

create or replace function public.create_finding_action_atomic(
  p_finding_id uuid,
  p_title text,
  p_description text default null,
  p_assignee_id uuid default null,
  p_due_at date default null
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_role public.system_role := (select public.current_profile_role());
  finding_row public.findings%rowtype;
  created_id uuid;
begin
  select * into finding_row from public.findings where id=p_finding_id for update;
  if not found or finding_row.finding_domain <> 'document' then raise exception 'Finding không hợp lệ'; end if;
  if actor is null or actor_role not in ('editor','admin') or not (
    actor_role='admin' or finding_row.created_by=actor or finding_row.assignee_id=actor
  ) then raise exception 'Không có quyền tạo action cho finding này'; end if;

  if finding_row.action_decision <> 'required' then
    update public.findings set action_decision='required',action_decision_reason=null where id=p_finding_id;
  end if;
  insert into public.finding_actions(
    finding_id,action_title,description,assignee_id,due_at,status,progress_percent,created_by
  ) values (p_finding_id,p_title,p_description,p_assignee_id,p_due_at,'todo',0,actor)
  returning id into created_id;
  return created_id;
end;
$$;
revoke all on function public.create_finding_action_atomic(uuid,text,text,uuid,date) from public,anon;
grant execute on function public.create_finding_action_atomic(uuid,text,text,uuid,date) to authenticated;
