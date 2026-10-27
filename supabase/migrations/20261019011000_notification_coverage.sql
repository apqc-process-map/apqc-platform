-- E8 notification coverage for assignments, reviews, required reading, and due dates.

create or replace function public.notification_deep_link(p_object_type public.review_object_type)
returns text
language sql
immutable
as $$
  select case p_object_type
    when 'process_version' then '/process-map'
    when 'document_version' then '/documents'
  end
$$;

create or replace function public.notify_process_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  process_code text;
begin
  select p.process_code into process_code
  from public.process_versions v
  join public.processes p on p.id = v.process_id
  where v.id = new.process_version_id;

  insert into public.notifications(recipient_id, type, title, body, object_type, object_id, deep_link)
  values (
    new.profile_id,
    'process_role_assigned',
    'Bạn được giao vai trò cho process',
    coalesce(process_code, 'Process') || ': ' || new.assignment_role::text,
    'process_version',
    new.process_version_id,
    '/process-map'
  );
  return new;
end
$$;

drop trigger if exists process_assignments_notify on public.process_assignments;
create trigger process_assignments_notify
after insert on public.process_assignments
for each row execute function public.notify_process_assignment();

create or replace function public.notify_reading_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications(recipient_id, type, title, body, object_type, object_id, deep_link)
  values (
    new.profile_id,
    'reading_assigned',
    'Bạn được giao tài liệu cần đọc',
    case when new.required then 'Vui lòng hoàn tất xác nhận đọc trước hạn.' else 'Tài liệu được gửi để tham khảo.' end,
    new.object_type::text,
    new.object_id,
    public.notification_deep_link(new.object_type)
  );
  return new;
end
$$;

drop trigger if exists reading_assignments_notify on public.reading_assignments;
create trigger reading_assignments_notify
after insert on public.reading_assignments
for each row execute function public.notify_reading_assignment();

create or replace function public.notify_review_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient uuid;
begin
  if new.assigned_admin_id is not null then
    insert into public.notifications(recipient_id, type, title, body, object_type, object_id, deep_link)
    values (
      new.assigned_admin_id,
      'review_assigned',
      'Bạn được giao một review request',
      'Yêu cầu review đang chờ xử lý.',
      new.object_type::text,
      new.object_id,
      public.notification_deep_link(new.object_type)
    );
  else
    for recipient in
      select id from public.profiles where is_active and role = 'admin'
    loop
      insert into public.notifications(recipient_id, type, title, body, object_type, object_id, deep_link)
      values (
        recipient,
        'review_opened',
        'Có review request mới',
        'Yêu cầu review đang chờ được phân công.',
        new.object_type::text,
        new.object_id,
        public.notification_deep_link(new.object_type)
      );
    end loop;
  end if;
  return new;
end
$$;

drop trigger if exists review_requests_notify on public.review_requests;
create trigger review_requests_notify
after insert on public.review_requests
for each row execute function public.notify_review_request();

create or replace function public.create_due_review_notifications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  insert into public.notifications(recipient_id, type, title, body, object_type, object_id, deep_link)
  select distinct a.profile_id,
    'review_due_soon',
    'Review sắp đến hạn',
    'Một phiên bản process hoặc tài liệu sắp đến hạn review.',
    a.object_type::text,
    a.object_id,
    public.notification_deep_link(a.object_type)
  from public.reading_assignments a
  join public.process_versions pv on a.object_type = 'process_version' and pv.id = a.object_id
  where pv.review_due_at between current_date and current_date + 2
    and not exists (
      select 1 from public.notifications n
      where n.recipient_id = a.profile_id
        and n.object_type = a.object_type::text
        and n.object_id = a.object_id
        and n.type = 'review_due_soon'
        and n.created_at::date = current_date
    )
  union
  select distinct a.profile_id,
    'review_due_soon',
    'Review sắp đến hạn',
    'Một phiên bản process hoặc tài liệu sắp đến hạn review.',
    a.object_type::text,
    a.object_id,
    public.notification_deep_link(a.object_type)
  from public.reading_assignments a
  join public.document_versions dv on a.object_type = 'document_version' and dv.id = a.object_id
  where dv.review_due_at between current_date and current_date + 2
    and not exists (
      select 1 from public.notifications n
      where n.recipient_id = a.profile_id
        and n.object_type = a.object_type::text
        and n.object_id = a.object_id
        and n.type = 'review_due_soon'
        and n.created_at::date = current_date
    );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end
$$;

revoke all on function public.notification_deep_link(public.review_object_type) from public, anon, authenticated;
revoke all on function public.notify_process_assignment() from public, anon, authenticated;
revoke all on function public.notify_reading_assignment() from public, anon, authenticated;
revoke all on function public.notify_review_request() from public, anon, authenticated;
revoke all on function public.create_due_review_notifications() from public, anon, authenticated;
