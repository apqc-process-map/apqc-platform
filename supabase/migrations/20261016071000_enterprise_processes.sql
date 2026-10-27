-- Process Map E3: enterprise process identity, versioning, hierarchy and APQC mappings.
create type public.process_level_type as enum ('value_chain', 'e2e', 'process', 'subprocess', 'activity', 'task');
create type public.process_version_status as enum ('draft', 'in_review', 'rejected', 'approved', 'scheduled', 'effective', 'cancelled', 'superseded', 'archived');
create type public.access_level as enum ('internal', 'limited', 'confidential', 'highly_restricted');
create type public.mapping_role as enum ('primary', 'supporting', 'step');
create type public.mapping_match_type as enum ('exact', 'partial', 'broader', 'narrower', 'related');
create type public.mapping_status as enum ('proposed', 'verified', 'rejected');

create sequence if not exists public.process_code_seq start 1;

create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  process_code text not null unique default ('PROC-' || lpad(nextval('public.process_code_seq')::text, 6, '0')),
  source_code text,
  parent_process_id uuid references public.processes(id) on delete restrict,
  level_type public.process_level_type not null,
  display_order integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.process_versions (
  id uuid primary key default gen_random_uuid(),
  process_id uuid not null references public.processes(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status public.process_version_status not null default 'draft',
  name_vi text not null,
  name_en text,
  purpose text not null,
  description text not null,
  scope_in text not null,
  scope_out text not null,
  trigger text not null,
  outcome text not null,
  business_purpose text,
  scope_and_boundaries text,
  process_at_a_glance text,
  critical_decision_points text,
  accountability_and_impact text,
  access_level public.access_level not null default 'internal',
  allowed_roles public.system_role[] not null default array['viewer','editor','admin']::public.system_role[],
  change_summary text not null default '',
  valid_from date,
  valid_until date,
  review_due_at date,
  created_by uuid references public.profiles(id),
  submitted_at timestamptz,
  submitted_by uuid references public.profiles(id),
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  published_at timestamptz,
  published_by uuid references public.profiles(id),
  supersedes_version_id uuid references public.process_versions(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (process_id, version_number),
  check (valid_until is null or valid_from is null or valid_until >= valid_from),
  check (review_due_at is null or valid_from is null or review_due_at >= valid_from)
);

create table if not exists public.process_apqc_mappings (
  id uuid primary key default gen_random_uuid(),
  process_version_id uuid not null references public.process_versions(id) on delete cascade,
  apqc_element_id uuid not null references public.apqc_elements(id) on delete restrict,
  mapping_role public.mapping_role not null,
  match_type public.mapping_match_type not null,
  status public.mapping_status not null default 'proposed',
  rationale text not null,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (process_version_id, apqc_element_id, mapping_role)
);

create index if not exists processes_parent_order_idx on public.processes(parent_process_id, display_order);
create index if not exists process_versions_process_status_idx on public.process_versions(process_id, status);
create index if not exists process_versions_search_idx on public.process_versions using gin (to_tsvector('simple', coalesce(name_vi, '') || ' ' || coalesce(name_en, '') || ' ' || coalesce(description, '') || ' ' || coalesce(purpose, '')));

create or replace function public.prevent_process_cycle()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.parent_process_id is null then return new; end if;
  if new.parent_process_id = new.id then raise exception 'A process cannot be its own parent'; end if;
  if exists (
    with recursive ancestors(id) as (
      select p.parent_process_id from public.processes p where p.id = new.parent_process_id
      union all
      select p.parent_process_id from public.processes p join ancestors a on p.id = a.id where p.parent_process_id is not null
    ) select 1 from ancestors where id = new.id
  ) then raise exception 'Process hierarchy cycle detected'; end if;
  return new;
end;
$$;
drop trigger if exists processes_prevent_cycle on public.processes;
create trigger processes_prevent_cycle before insert or update of parent_process_id on public.processes for each row execute function public.prevent_process_cycle();

create or replace function public.validate_process_version_dates()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.status in ('scheduled', 'effective') and (new.valid_from is null or new.review_due_at is null) then
    raise exception 'Scheduled and effective versions require valid_from and review_due_at';
  end if;
  if new.status = 'effective' and exists (
    select 1 from public.process_versions other
    where other.process_id = new.process_id and other.id <> new.id and other.status = 'effective'
      and daterange(coalesce(other.valid_from, '-infinity'::date), coalesce(other.valid_until, 'infinity'::date), '[]') && daterange(coalesce(new.valid_from, '-infinity'::date), coalesce(new.valid_until, 'infinity'::date), '[]')
  ) then raise exception 'Overlapping effective process versions are not allowed'; end if;
  return new;
end;
$$;
drop trigger if exists process_versions_validate_dates on public.process_versions;
create trigger process_versions_validate_dates before insert or update on public.process_versions for each row execute function public.validate_process_version_dates();

alter table public.processes enable row level security;
alter table public.process_versions enable row level security;
alter table public.process_apqc_mappings enable row level security;
create policy "active users can read processes" on public.processes for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "active users can read allowed process versions" on public.process_versions for select to authenticated using ((select public.current_profile_role()) = any (allowed_roles));
create policy "active users can read process mappings" on public.process_apqc_mappings for select to authenticated using ((select public.current_profile_role()) is not null);
revoke all on public.processes, public.process_versions, public.process_apqc_mappings from anon;
grant select on public.processes, public.process_versions, public.process_apqc_mappings to authenticated;
