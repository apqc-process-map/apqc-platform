begin;

do $$
declare
  actor uuid;
  process_version_id uuid;
  test_finding public.findings%rowtype;
  test_document_id uuid;
  gate_raised boolean := false;
  four_eyes_raised boolean := false;
  completeness jsonb;
begin
  select id into actor from public.profiles where role='admin' and is_active order by display_name limit 1;
  if actor is null then raise exception 'QA prerequisite: active admin profile'; end if;

  insert into public.findings(title,description,severity,priority,created_by)
  values ('[QA] rollback SLA','Temporary row for database behavior verification','critical','urgent',actor)
  returning * into test_finding;
  if test_finding.due_at < now()+interval '47 hours' or test_finding.due_at > now()+interval '49 hours' then
    raise exception 'Critical finding SLA was not set to approximately two days';
  end if;

  select id into process_version_id from public.process_versions order by created_at limit 1;
  select public.process_completeness(process_version_id) into completeness;
  if completeness ? 'score' is false or completeness ? 'filled' is false or completeness ? 'total' is false then
    raise exception 'Process completeness result is missing required keys';
  end if;

  if exists(select 1 from public.relationship_types where nullif(trim(label_vi),'') is null or nullif(trim(inverse_label_vi),'') is null) then
    raise exception 'Relationship labels or inverse labels are incomplete';
  end if;

  insert into public.documents(document_code) values ('QA-ROLLBACK-DOC') returning id into test_document_id;
  begin
    insert into public.document_versions(
      document_id,version_number,status,title_vi,document_group,language,
      valid_from,review_due_at,created_by,approved_by
    ) values (
      test_document_id,1,'scheduled','[QA] publication gate','procedure','vi',
      current_date,current_date+30,actor,null
    );
  exception when others then
    gate_raised := true;
  end;
  if not gate_raised then raise exception 'Document publication gate did not reject a version without process link'; end if;

  begin
    insert into public.document_versions(
      document_id,version_number,status,title_vi,document_group,language,
      created_by,approved_by
    ) values (
      test_document_id,2,'approved','[QA] four eyes','procedure','vi',actor,actor
    );
  exception when others then
    four_eyes_raised := true;
  end;
  if not four_eyes_raised then raise exception 'Four-eyes gate did not reject self approval'; end if;
end
$$;

rollback;
