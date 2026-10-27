-- Document-centric findings and independent corrective actions.
alter table public.findings
  add column if not exists finding_domain text not null default 'general'
    check (finding_domain in ('general','document')),
  add column if not exists action_decision text not null default 'pending'
    check (action_decision in ('pending','required','not_required')),
  add column if not exists action_decision_reason text,
  add column if not exists impact_summary text;

alter table public.findings
  add constraint document_finding_no_action_reason_check
    check (finding_domain <> 'document' or action_decision <> 'not_required'
      or length(trim(coalesce(action_decision_reason,''))) > 0);

insert into public.vocabulary_values(vocabulary_id,code,label_vi,label_en,display_order)
select v.id,x.code,x.vi,x.en,x.seq
from public.vocabularies v
cross join (values
  ('exact_duplicate','Trùng lặp hoàn toàn','Exact duplicate',1),
  ('semantic_duplicate','Trùng nội dung / quy định','Semantic duplicate',2),
  ('scope_overlap','Chồng chéo phạm vi áp dụng','Scope overlap',3),
  ('potential_conflict','Mâu thuẫn nội dung / điều kiện','Potential conflict',4),
  ('version_conflict','Xung đột phiên bản','Version conflict',5),
  ('effective_date_conflict','Xung đột thời điểm hiệu lực','Effective date conflict',6),
  ('relationship_conflict','Mâu thuẫn quan hệ giữa tài liệu','Relationship conflict',7),
  ('supersession_candidate','Có khả năng bị thay thế','Supersession candidate',8),
  ('other','Vấn đề tài liệu khác','Other document issue',9)
) x(code,vi,en,seq)
where v.code='finding_type'
on conflict (vocabulary_id,code) do update
set label_vi=excluded.label_vi,label_en=excluded.label_en,display_order=excluded.display_order,is_active=true;

grant usage,select on sequence public.finding_code_seq to authenticated;

create table public.finding_actions (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.findings(id) on delete cascade,
  action_title text not null check(length(trim(action_title)) between 1 and 300),
  description text,
  assignee_id uuid references public.profiles(id),
  due_at date,
  status text not null default 'todo'
    check(status in ('todo','in_progress','blocked','done','cancelled')),
  progress_percent integer not null default 0 check(progress_percent between 0 and 100),
  last_update text,
  completion_evidence text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  check (status <> 'done' or progress_percent=100),
  check (status <> 'blocked' or nullif(trim(coalesce(last_update,'')),'') is not null)
);
create index finding_actions_finding_idx on public.finding_actions(finding_id,status,due_at);
create index finding_actions_assignee_idx on public.finding_actions(assignee_id,status,due_at);

create or replace function public.touch_finding_action()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  new.updated_at=now();
  if new.status='done' then
    new.progress_percent=100;
    new.completed_at=coalesce(old.completed_at,now());
  else
    new.completed_at=null;
  end if;
  return new;
end $$;
create trigger finding_actions_touch before update on public.finding_actions
for each row execute function public.touch_finding_action();

alter table public.finding_actions enable row level security;
grant select,insert,update on public.finding_actions to authenticated;
revoke all on public.finding_actions from anon;
create policy "active users read authorized finding actions"
on public.finding_actions for select to authenticated
using (
  (select public.current_profile_role()) is not null
  and exists (select 1 from public.findings f where f.id=finding_id)
);
create policy "finding handlers create corrective actions"
on public.finding_actions for insert to authenticated
with check (
  created_by=(select auth.uid())
  and (select public.current_profile_role()) in ('editor','admin')
  and exists (
    select 1 from public.findings f
    where f.id=finding_id and f.finding_domain='document'
      and ((select public.current_profile_role())='admin'
        or f.created_by=(select auth.uid()) or f.assignee_id=(select auth.uid()))
  )
);
create policy "finding handlers update corrective actions"
on public.finding_actions for update to authenticated
using (
  (select public.current_profile_role())='admin'
  or ((select public.current_profile_role())='editor'
    and (assignee_id=(select auth.uid()) or created_by=(select auth.uid())
      or exists (select 1 from public.findings f
        where f.id=finding_id and
          (f.created_by=(select auth.uid()) or f.assignee_id=(select auth.uid())))))
)
with check (
  (select public.current_profile_role())='admin'
  or ((select public.current_profile_role())='editor'
    and (assignee_id=(select auth.uid()) or created_by=(select auth.uid())
      or exists (select 1 from public.findings f
        where f.id=finding_id and
          (f.created_by=(select auth.uid()) or f.assignee_id=(select auth.uid())))))
);

-- Only document findings are required to have a resolved decision and completed actions.
create or replace function public.validate_document_finding_closure()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.finding_domain='document' and new.status in ('resolved','closed') then
    if new.action_decision='pending' then
      raise exception 'Choose whether this document finding requires action before resolving';
    end if;
    if new.action_decision='required' then
      if not exists (select 1 from public.finding_actions a
        where a.finding_id=new.id and a.status<>'cancelled') then
        raise exception 'Required actions must be created before resolving a finding';
      end if;
      if exists (select 1 from public.finding_actions a
        where a.finding_id=new.id and a.status not in ('done','cancelled')) then
        raise exception 'All active corrective actions must be completed before resolving a finding';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger document_finding_closure_guard
before insert or update on public.findings
for each row execute function public.validate_document_finding_closure();

create index if not exists findings_domain_status_idx on public.findings(finding_domain,status,due_at);
create index if not exists finding_links_document_ref_idx on public.finding_links(object_type,object_id)
where object_type='document_version';
