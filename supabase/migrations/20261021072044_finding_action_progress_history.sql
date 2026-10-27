-- Keep a durable audit-style action progress trail on the existing finding timeline.
alter table public.finding_actions
  add constraint finding_action_completion_evidence_check
  check (status <> 'done' or nullif(trim(coalesce(completion_evidence,'')),'') is not null);

create or replace function public.log_finding_action_change()
returns trigger language plpgsql security invoker set search_path=public as $$
declare v_actor uuid;
begin
  v_actor:=coalesce((select auth.uid()),new.created_by);
  if tg_op='INSERT' then
    insert into public.finding_events(finding_id,event_type,actor_id,to_value)
    values(new.finding_id,'action_created',v_actor,
      jsonb_build_object('action_id',new.id,'title',new.action_title,
        'status',new.status,'progress',new.progress_percent,'assignee_id',new.assignee_id,'due_at',new.due_at));
  elsif (old.status,old.progress_percent,old.assignee_id,old.due_at,old.last_update,old.completion_evidence)
    is distinct from
    (new.status,new.progress_percent,new.assignee_id,new.due_at,new.last_update,new.completion_evidence) then
    insert into public.finding_events(finding_id,event_type,actor_id,from_value,to_value)
    values(new.finding_id,'action_updated',v_actor,
      jsonb_build_object('action_id',old.id,'status',old.status,'progress',old.progress_percent,
        'assignee_id',old.assignee_id,'due_at',old.due_at),
      jsonb_build_object('action_id',new.id,'status',new.status,'progress',new.progress_percent,
        'assignee_id',new.assignee_id,'due_at',new.due_at,
        'last_update',new.last_update,'completion_evidence',new.completion_evidence));
  end if;
  return new;
end $$;

create trigger finding_action_event_write after insert or update on public.finding_actions
for each row execute function public.log_finding_action_change();
