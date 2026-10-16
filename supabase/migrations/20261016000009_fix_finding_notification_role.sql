-- Fix E8 finding notifications to use the actual profiles.role column.
create or replace function public.notify_finding_change()
returns trigger language plpgsql security definer set search_path=public as $$
declare recipient uuid;
begin
  if tg_op = 'INSERT' then
    for recipient in
      select distinct p.id from public.profiles p
      where p.is_active and p.role in ('admin','editor') and p.id <> new.created_by
    loop
      insert into public.notifications(recipient_id,type,title,body,object_type,object_id,deep_link)
      values(recipient,'finding_created','Finding mới ' || new.finding_code,new.title,'finding',new.id,'/findings');
    end loop;
  else
    if old.assignee_id is distinct from new.assignee_id and new.assignee_id is not null then
      insert into public.notifications(recipient_id,type,title,body,object_type,object_id,deep_link)
      values(new.assignee_id,'finding_assigned','Finding được giao ' || new.finding_code,new.title,'finding',new.id,'/findings');
    end if;
    if old.status is distinct from new.status then
      for recipient in
        select distinct p.id from public.profiles p
        where p.is_active and p.id in (new.created_by,new.assignee_id)
      loop
        insert into public.notifications(recipient_id,type,title,body,object_type,object_id,deep_link)
        values(recipient,'finding_status_changed','Finding cập nhật ' || new.finding_code,
          'Trạng thái: ' || old.status::text || ' → ' || new.status::text,'finding',new.id,'/findings');
      end loop;
    end if;
  end if;
  return new;
end $$;
