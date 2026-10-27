-- E7/E8 findings, notifications, and governance reporting foundations.
create type public.finding_severity as enum ('low','medium','high','critical');
create type public.finding_priority as enum ('low','medium','high','urgent');
create type public.finding_status as enum ('new','triage','in_progress','pending_decision','resolved','closed','reopened');
create type public.finding_participant_role as enum ('participant','watcher');
create type public.finding_reaction_type as enum ('agree','disagree','need_more_information');
create type public.finding_link_role as enum ('subject','evidence','resolution');

create sequence public.finding_code_seq start 1;

create table public.findings (
  id uuid primary key default gen_random_uuid(),
  finding_code text not null unique default ('FND-' || lpad(nextval('public.finding_code_seq')::text,6,'0')),
  title text not null check(length(trim(title)) > 0),
  description text not null check(length(trim(description)) > 0),
  finding_type_value_id uuid references public.vocabulary_values(id),
  severity public.finding_severity not null default 'medium',
  priority public.finding_priority not null default 'medium',
  status public.finding_status not null default 'new',
  created_by uuid not null references public.profiles(id),
  assignee_id uuid references public.profiles(id),
  due_at timestamptz,
  resolution_type_value_id uuid references public.vocabulary_values(id),
  resolution_summary text,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.finding_links (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.findings(id) on delete cascade,
  object_type text not null check(object_type in ('process','process_version','document','document_version','relationship','apqc_element')),
  object_id uuid not null,
  link_role public.finding_link_role not null default 'subject',
  evidence_excerpt text,
  unique(finding_id,object_type,object_id,link_role)
);

create table public.finding_participants (
  finding_id uuid not null references public.findings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  participant_role public.finding_participant_role not null default 'participant',
  primary key(finding_id,profile_id)
);

create table public.finding_reactions (
  finding_id uuid not null references public.findings(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reaction public.finding_reaction_type not null,
  created_at timestamptz not null default now(),
  primary key(finding_id,profile_id)
);

create table public.finding_events (
  id uuid primary key default gen_random_uuid(),
  finding_id uuid not null references public.findings(id) on delete cascade,
  event_type text not null,
  actor_id uuid not null references public.profiles(id),
  from_value jsonb,
  to_value jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  object_type text,
  object_id uuid,
  deep_link text check(deep_link is null or deep_link like '/%'),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.validate_finding()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.due_at is null then
    new.due_at := now() + case new.severity
      when 'critical' then interval '2 days'
      when 'high' then interval '7 days'
      when 'medium' then interval '14 days'
      else interval '30 days' end;
  end if;
  if new.status='resolved' then
    if nullif(trim(new.resolution_summary),'') is null then raise exception 'Resolved findings require a resolution summary'; end if;
    new.resolved_at := coalesce(new.resolved_at,now());
  end if;
  if new.status='closed' then
    if nullif(trim(new.resolution_summary),'') is null then raise exception 'Closed findings require a resolution summary'; end if;
    new.closed_at := coalesce(new.closed_at,now());
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger findings_validate before insert or update on public.findings for each row execute function public.validate_finding();

create or replace function public.log_finding_event()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if tg_op='INSERT' then
    insert into public.finding_events(finding_id,event_type,actor_id,to_value)
    values(new.id,'created',new.created_by,jsonb_build_object('status',new.status,'assignee_id',new.assignee_id));
  elsif old.status is distinct from new.status or old.assignee_id is distinct from new.assignee_id then
    insert into public.finding_events(finding_id,event_type,actor_id,from_value,to_value)
    values(new.id,case when old.status is distinct from new.status then 'status_changed' else 'assignment_changed' end,
      (select auth.uid()),jsonb_build_object('status',old.status,'assignee_id',old.assignee_id),jsonb_build_object('status',new.status,'assignee_id',new.assignee_id));
  end if;
  return new;
end $$;
create trigger findings_log_event after insert or update on public.findings for each row execute function public.log_finding_event();

alter table public.findings enable row level security;
alter table public.finding_links enable row level security;
alter table public.finding_participants enable row level security;
alter table public.finding_reactions enable row level security;
alter table public.finding_events enable row level security;
alter table public.notifications enable row level security;

grant select on public.findings,public.finding_links,public.finding_participants,public.finding_reactions,public.finding_events,public.notifications to authenticated;
grant insert,update on public.findings to authenticated;
grant insert,update,delete on public.finding_links,public.finding_participants to authenticated;
grant insert,update,delete on public.finding_reactions to authenticated;
grant insert on public.finding_events to authenticated;
grant update on public.notifications to authenticated;
grant usage,select on sequence public.finding_code_seq to authenticated;

create policy "active users read findings" on public.findings for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "editors create findings" on public.findings for insert to authenticated with check ((select public.current_profile_role()) in ('editor','admin') and created_by=(select auth.uid()));
create policy "workers update findings" on public.findings for update to authenticated
using ((select public.current_profile_role())='admin' or ((select public.current_profile_role())='editor' and ((select auth.uid())=created_by or (select auth.uid())=assignee_id)))
with check ((select public.current_profile_role())='admin' or ((select public.current_profile_role())='editor' and ((select auth.uid())=created_by or (select auth.uid())=assignee_id)));

create policy "active users read finding links" on public.finding_links for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "workers manage finding links" on public.finding_links for all to authenticated
using ((select public.current_profile_role()) in ('editor','admin')) with check ((select public.current_profile_role()) in ('editor','admin'));
create policy "active users read finding participants" on public.finding_participants for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "workers manage finding participants" on public.finding_participants for all to authenticated
using ((select public.current_profile_role()) in ('editor','admin')) with check ((select public.current_profile_role()) in ('editor','admin'));
create policy "active users read reactions" on public.finding_reactions for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "users manage own reaction" on public.finding_reactions for all to authenticated
using(profile_id=(select auth.uid())) with check(profile_id=(select auth.uid()));
create policy "active users read finding events" on public.finding_events for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "workers create finding events" on public.finding_events for insert to authenticated
with check(actor_id=(select auth.uid()) and (select public.current_profile_role()) in ('editor','admin'));
create policy "users read own notifications" on public.notifications for select to authenticated using(recipient_id=(select auth.uid()));
create policy "users update own notifications" on public.notifications for update to authenticated
using(recipient_id=(select auth.uid())) with check(recipient_id=(select auth.uid()));

create index findings_status_due_idx on public.findings(status,due_at);
create index findings_assignee_idx on public.findings(assignee_id);
create index finding_links_finding_idx on public.finding_links(finding_id);
create index finding_events_finding_created_idx on public.finding_events(finding_id,created_at);
create index notifications_recipient_read_idx on public.notifications(recipient_id,read_at,created_at desc);

create view public.apqc_coverage_view with (security_invoker=true) as
select e.id as apqc_element_id,e.pcf_id,e.name,e.level_number,count(m.id) filter(where m.status='verified') as verified_process_mappings
from public.apqc_elements e left join public.process_apqc_mappings m on m.apqc_element_id=e.id group by e.id,e.pcf_id,e.name,e.level_number;

create view public.process_review_status_view with (security_invoker=true) as
select p.id as process_id,p.process_code,v.id as process_version_id,v.name_vi,v.status,v.review_due_at,
  case when v.review_due_at is not null and v.review_due_at<current_date then true else false end as is_review_overdue
from public.processes p join public.process_versions v on v.process_id=p.id;

create view public.reading_completion_view with (security_invoker=true) as
select a.object_type,a.object_id,count(*) as assigned_count,count(k.assignment_id) as acknowledged_count,
  round(100.0*count(k.assignment_id)/nullif(count(*),0),1) as completion_percent
from public.reading_assignments a left join public.reading_acknowledgments k on k.assignment_id=a.id group by a.object_type,a.object_id;

create view public.finding_dashboard_view with (security_invoker=true) as
select status,severity,priority,count(*) as finding_count,count(*) filter(where due_at<now() and status not in ('resolved','closed')) as overdue_count
from public.findings group by status,severity,priority;

create view public.finding_aging_view with (security_invoker=true) as
select id,finding_code,title,status,severity,assignee_id,due_at,
  greatest(0,extract(day from now()-created_at))::integer as age_days,
  case when due_at<now() and status not in ('resolved','closed') then true else false end as is_overdue
from public.findings;

grant select on public.apqc_coverage_view,public.process_review_status_view,public.reading_completion_view,public.finding_dashboard_view,public.finding_aging_view to authenticated;
revoke all on public.findings,public.finding_links,public.finding_participants,public.finding_reactions,public.finding_events,public.notifications from anon;
