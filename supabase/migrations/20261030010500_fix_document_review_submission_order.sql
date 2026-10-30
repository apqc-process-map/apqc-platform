-- Correct the RLS-safe ordering for document review submission on already-migrated projects.

create or replace function public.transition_document_version_atomic(
  p_version_id uuid,
  p_status public.process_version_status,
  p_decision_reason text default null
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  actor_role public.system_role := (select public.current_profile_role());
  current_row public.document_versions%rowtype;
  open_review public.review_requests%rowtype;
  allowed boolean := false;
begin
  if actor is null or actor_role not in ('editor','admin') then
    raise exception 'Không có quyền cập nhật trạng thái tài liệu';
  end if;

  select * into current_row
  from public.document_versions
  where id = p_version_id
  for update;

  if not found then raise exception 'Không tìm thấy phiên bản tài liệu'; end if;
  if actor_role = 'editor'
     and current_row.created_by <> actor
     and current_row.owner_id is distinct from actor then
    raise exception 'Bạn không phụ trách tài liệu này';
  end if;
  if p_status = current_row.status then return p_version_id; end if;

  allowed := case current_row.status
    when 'draft' then p_status in ('in_review','cancelled')
    when 'rejected' then p_status in ('draft','in_review','cancelled')
    when 'in_review' then actor_role = 'admin' and p_status in ('approved','rejected','cancelled')
    when 'approved' then actor_role = 'admin' and p_status in ('scheduled','effective','cancelled')
    when 'scheduled' then actor_role = 'admin' and p_status in ('effective','cancelled')
    when 'effective' then actor_role = 'admin' and p_status in ('superseded','archived')
    else false
  end;
  if not allowed then
    raise exception 'Chuyển trạng thái từ % sang % không hợp lệ', current_row.status, p_status;
  end if;

  if p_status = 'in_review' then
    -- Insert while the version is still draft/rejected so the RLS submit policy can verify ownership.
    insert into public.review_requests(
      object_type, object_id, submitted_by, assigned_admin_id, status
    ) values (
      'document_version', p_version_id, actor,
      case when current_row.designated_approver_id = actor then null else current_row.designated_approver_id end,
      'open'
    )
    on conflict (object_type, object_id) where status = 'open'
    do update set
      submitted_by = excluded.submitted_by,
      assigned_admin_id = excluded.assigned_admin_id,
      decision_reason = null,
      decided_at = null;

    update public.document_versions
    set status = 'in_review', submitted_at = now(), submitted_by = actor, updated_at = now()
    where id = p_version_id;
    return p_version_id;
  end if;

  if current_row.status = 'in_review' then
    select * into open_review
    from public.review_requests
    where object_type = 'document_version'
      and object_id = p_version_id
      and status = 'open'
    for update;

    if not found then raise exception 'Không tìm thấy review task đang mở'; end if;
    if open_review.assigned_admin_id is not null and open_review.assigned_admin_id <> actor then
      raise exception 'Review task đã được giao cho Admin khác';
    end if;
    if open_review.submitted_by = actor or current_row.created_by = actor then
      raise exception 'Người gửi hoặc người tạo không được tự phê duyệt';
    end if;
    if p_status = 'rejected' and nullif(btrim(p_decision_reason),'') is null then
      raise exception 'Từ chối cần có lý do';
    end if;

    update public.review_requests
    set status = case when p_status = 'approved' then 'approved'::public.review_status
                      when p_status = 'rejected' then 'rejected'::public.review_status
                      else 'cancelled'::public.review_status end,
        decision_reason = nullif(btrim(p_decision_reason),''),
        decided_at = now(),
        assigned_admin_id = coalesce(assigned_admin_id, actor)
    where id = open_review.id;
  end if;

  update public.document_versions
  set status = p_status,
      approved_at = case when p_status = 'approved' then now() else approved_at end,
      approved_by = case when p_status = 'approved' then actor else approved_by end,
      published_at = case when p_status = 'effective' then now() else published_at end,
      published_by = case when p_status = 'effective' then actor else published_by end,
      updated_at = now()
  where id = p_version_id;

  return p_version_id;
end;
$$;

revoke all on function public.transition_document_version_atomic(uuid,public.process_version_status,text)
  from public,anon;
grant execute on function public.transition_document_version_atomic(uuid,public.process_version_status,text)
  to authenticated;
