-- Keep document lifecycle tasks and document-process relationship visuals synchronized.

create unique index if not exists review_requests_one_open_per_object_idx
  on public.review_requests(object_type, object_id)
  where status = 'open';

grant insert, update on public.review_requests to authenticated;

drop policy if exists "active users read review_requests" on public.review_requests;
drop policy if exists "users read relevant review requests" on public.review_requests;
create policy "users read relevant review requests"
on public.review_requests for select to authenticated
using (
  (select public.current_profile_role()) = 'admin'
  or submitted_by = (select auth.uid())
  or assigned_admin_id = (select auth.uid())
);

drop policy if exists "workers submit owned document reviews" on public.review_requests;
create policy "workers submit owned document reviews"
on public.review_requests for insert to authenticated
with check (
  submitted_by = (select auth.uid())
  and object_type = 'document_version'
  and (select public.current_profile_role()) in ('editor','admin')
  and exists (
    select 1 from public.document_versions version
    where version.id = object_id
      and version.status in ('draft','rejected')
      and (
        (select public.current_profile_role()) = 'admin'
        or version.created_by = (select auth.uid())
        or version.owner_id = (select auth.uid())
      )
  )
);

drop policy if exists "admins decide document reviews" on public.review_requests;
create policy "admins decide document reviews"
on public.review_requests for update to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');

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

create or replace function public.notify_document_review_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status = 'open' and new.status <> 'open' then
    insert into public.notifications(recipient_id,type,title,body,object_type,object_id,deep_link)
    values (
      new.submitted_by,
      'review_decided',
      case new.status
        when 'approved' then 'Tài liệu đã được phê duyệt'
        when 'rejected' then 'Tài liệu cần chỉnh sửa'
        else 'Review tài liệu đã đóng'
      end,
      coalesce(nullif(new.decision_reason,''),'Xem trạng thái và thông tin review mới nhất.'),
      new.object_type::text,
      new.object_id,
      '/documents?detail=' || new.object_id::text || '#document-metadata-detail'
    );
  end if;
  return new;
end;
$$;

revoke all on function public.notify_document_review_decision() from public,anon,authenticated;
drop trigger if exists document_review_decision_notify on public.review_requests;
create trigger document_review_decision_notify
after update of status on public.review_requests
for each row execute function public.notify_document_review_decision();
create or replace function public.sync_document_process_relationship()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  link_row public.document_process_links%rowtype;
  document_id uuid;
  document_code text;
  process_code text;
  type_id uuid;
begin
  if tg_op = 'DELETE' then
    link_row := old;
  else
    link_row := new;
  end if;

  select version.document_id, document.document_code
  into document_id, document_code
  from public.document_versions version
  join public.documents document on document.id = version.document_id
  where version.id = link_row.document_version_id
    and document.archived_at is null;

  select process.process_code into process_code
  from public.processes process
  where process.id = link_row.process_id
    and process.archived_at is null;

  select id into type_id
  from public.relationship_types
  where code = 'documented_by' and is_active;

  if document_id is null or type_id is null then
    return link_row;
  end if;

  if tg_op = 'DELETE' then
    if not exists (
      select 1
      from public.document_process_links remaining
      join public.document_versions version on version.id = remaining.document_version_id
      where remaining.process_id = link_row.process_id
        and version.document_id = document_id
    ) then
      update public.object_relationships
      set status = 'rejected',
          description = coalesce(description,'') || ' Liên kết tài liệu–quy trình nguồn đã được gỡ.',
          updated_at = now()
      where source_type = 'process'
        and source_id = link_row.process_id
        and target_type = 'document'
        and target_id = document_id
        and relationship_type_id = type_id
        and status = 'proposed'
        and evidence_text like '%document_process_links%';
    end if;
    return old;
  end if;

  insert into public.object_relationships(
    source_type,source_id,target_type,target_id,relationship_type_id,
    description,status,evidence_text
  ) values (
    'process',link_row.process_id,'document',document_id,type_id,
    format('Tài liệu %s được liên kết trực tiếp với quy trình %s với vai trò %s.',
      coalesce(document_code,'—'),coalesce(process_code,'—'),link_row.link_role::text),
    'proposed',
    format('Nguồn dữ liệu: document_process_links.id=%s; document_version_id=%s.',
      link_row.id,link_row.document_version_id)
  )
  on conflict (source_type,source_id,target_type,target_id,relationship_type_id)
  do update set
    description = excluded.description,
    evidence_text = excluded.evidence_text,
    status = case
      when public.object_relationships.status = 'rejected' then 'proposed'::public.relationship_status
      else public.object_relationships.status
    end,
    updated_at = now()
  where public.object_relationships.status in ('proposed','rejected');

  return new;
end;
$$;

revoke all on function public.sync_document_process_relationship() from public,anon,authenticated;

drop trigger if exists document_process_relationship_sync on public.document_process_links;
create trigger document_process_relationship_sync
after insert or delete on public.document_process_links
for each row execute function public.sync_document_process_relationship();
-- Reconcile existing direct links so Process Map and Relationship start from the same data.
insert into public.object_relationships(
  source_type,source_id,target_type,target_id,relationship_type_id,
  description,status,evidence_text,created_by
)
select
  'process',link.process_id,'document',version.document_id,type.id,
  format('Tài liệu %s được liên kết trực tiếp với quy trình %s với vai trò %s.',
    coalesce(document.document_code,'—'),coalesce(process.process_code,'—'),link.link_role::text),
  'proposed',
  format('Nguồn dữ liệu: document_process_links.id=%s; document_version_id=%s.',
    link.id,link.document_version_id),
  version.created_by
from public.document_process_links link
join public.document_versions version on version.id = link.document_version_id
join public.documents document on document.id = version.document_id
join public.processes process on process.id = link.process_id
join public.relationship_types type on type.code = 'documented_by' and type.is_active
where document.archived_at is null and process.archived_at is null
on conflict (source_type,source_id,target_type,target_id,relationship_type_id)
do nothing;