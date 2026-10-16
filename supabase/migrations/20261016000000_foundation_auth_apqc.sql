-- Process Map E1/E2 foundation. The licensed APQC workbook stays outside Git.
create extension if not exists pgcrypto;

create type public.system_role as enum ('viewer', 'editor', 'admin');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role public.system_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apqc_frameworks (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  version text not null,
  source_name text not null,
  source_license_note text not null,
  imported_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.apqc_elements (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.apqc_frameworks(id) on delete cascade,
  pcf_id text not null,
  hierarchy_id text not null,
  level_number smallint not null check (level_number between 1 and 5),
  parent_id uuid references public.apqc_elements(id) on delete restrict,
  name text not null,
  description text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (framework_id, pcf_id),
  unique (framework_id, hierarchy_id)
);

create table if not exists public.apqc_metrics (
  id uuid primary key default gen_random_uuid(),
  framework_id uuid not null references public.apqc_frameworks(id) on delete cascade,
  pcf_id text not null,
  metric_code text,
  name text not null,
  definition text,
  created_at timestamptz not null default now(),
  unique (framework_id, pcf_id, metric_code, name)
);

create index if not exists apqc_elements_framework_level_idx on public.apqc_elements(framework_id, level_number, display_order);
create index if not exists apqc_elements_search_idx on public.apqc_elements using gin (to_tsvector('simple', coalesce(pcf_id, '') || ' ' || coalesce(name, '') || ' ' || coalesce(description, '')));
create index if not exists apqc_metrics_framework_pcf_idx on public.apqc_metrics(framework_id, pcf_id);

alter table public.profiles enable row level security;
alter table public.apqc_frameworks enable row level security;
alter table public.apqc_elements enable row level security;
alter table public.apqc_metrics enable row level security;

create or replace function public.current_profile_role()
returns public.system_role
language sql stable security invoker
set search_path = public
as $$ select role from public.profiles where id = (select auth.uid()) and is_active $$;

create policy "profiles can read own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "active users can read APQC frameworks" on public.apqc_frameworks for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "active users can read APQC elements" on public.apqc_elements for select to authenticated using ((select public.current_profile_role()) is not null);
create policy "active users can read APQC metrics" on public.apqc_metrics for select to authenticated using ((select public.current_profile_role()) is not null);

revoke all on public.profiles, public.apqc_frameworks, public.apqc_elements, public.apqc_metrics from anon;
grant select on public.profiles, public.apqc_frameworks, public.apqc_elements, public.apqc_metrics to authenticated;
