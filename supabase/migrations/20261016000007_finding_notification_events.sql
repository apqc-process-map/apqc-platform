-- E8 notification event service for finding lifecycle changes.
create or replace function public.notify_finding_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare recipient uuid;
begin
  if tg_op = 'INSERT' then
    for recipient in select distinct p.id from public.profiles p where p.is_active and p.system_role in ('admin','editor') and p.id <> new.created_by loop
      insert into public.notifications(recipient_id,type,title,body,object_type,object_id,deep_link)
      values(recipient,'finding_created','Finding mới ' || new.finding_code,new.title,'finding',new.id,'/findings');
    end loop;
  else
    if old.assignee_id is distinct from new.assignee_id and new.assignee_id is not null then
      insert into public.notifications(recipient_id,type,title,body,object_type,object_id,deep_link)
      values(new.assignee_id,'finding_assigned','Finding được giao ' || new.finding_code,new.title,'finding',new.id,'/findings');
    end if;
    if old.status is distinct from new.status then
      for recipient in select distinct p.id from public.profiles p where p.is_active and p.id in (new.created_by,new.assignee_id) loop
        insert into public.notifications(recipient_id,type,title,body,object_type,object_id,deep_link)
        values(recipient,'finding_status_changed','Finding cập nhật ' || new.finding_code,
          'Trạng thái: ' || old.status::text || ' → ' || new.status::text,'finding',new.id,'/findings');
      end loop;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists findings_notify_change on public.findings;
create trigger findings_notify_change after insert or update on public.findings for each row execute function public.notify_finding_change();

create or replace function public.create_due_finding_notifications()
returns integer language plpgsql security definer set search_path=public as $$
declare inserted_count integer;
begin
  insert into public.notifications(recipient_id,type,title,body,object_type,object_id,deep_link)
  select distinct p.id,'finding_due_soon','Finding sắp đến hạn ' || f.finding_code,
    'Hạn xử lý: ' || to_char(f.due_at at time zone 'Asia/Ho_Chi_Minh','DD/MM/YYYY'),
    'finding',f.id,'/findings'
  from public.findings f
  join public.profiles p on p.id in (f.created_by,f.assignee_id) and p.is_active
  where f.status not in ('resolved','closed')
    and f.due_at between now() and now() + interval '2 days'
    and not exists (select 1 from public.notifications n where n.recipient_id=p.id and n.object_id=f.id and n.type='finding_due_soon' and n.created_at::date=current_date);
  get diagnostics inserted_count = row_count;
  return inserted_count;
end $$;
grant execute on function public.create_due_finding_notifications() to authenticated;
