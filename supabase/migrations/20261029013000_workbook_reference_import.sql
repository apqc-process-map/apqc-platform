-- Controlled schema for importing the private Process Map workbook without committing its business data.
alter table public.apqc_elements
  add column if not exists pnj_description text,
  add column if not exists trigger_text text,
  add column if not exists output_text text,
  add column if not exists select_when text,
  add column if not exists do_not_select_when text,
  add column if not exists pnj_example text,
  add column if not exists source_url text,
  add column if not exists verification_status text,
  add column if not exists pnj_status text,
  add column if not exists priority text,
  add column if not exists source_location text,
  add column if not exists metrics_available boolean;

alter table public.document_versions
  add column if not exists source_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.document_apqc_mappings (
  id uuid primary key default gen_random_uuid(),
  document_version_id uuid not null references public.document_versions(id) on delete cascade,
  apqc_element_id uuid not null references public.apqc_elements(id) on delete restrict,
  source_name text not null,
  source_row integer not null check (source_row > 0),
  created_at timestamptz not null default now(),
  unique (document_version_id, apqc_element_id)
);

create index if not exists document_apqc_mappings_element_idx
  on public.document_apqc_mappings(apqc_element_id, document_version_id);

alter table public.document_apqc_mappings enable row level security;
revoke all on public.document_apqc_mappings from anon;
grant select on public.document_apqc_mappings to authenticated;

drop policy if exists "active users read document APQC mappings" on public.document_apqc_mappings;
create policy "active users read document APQC mappings"
on public.document_apqc_mappings for select to authenticated
using (
  (select public.current_profile_role()) is not null
  and exists (
    select 1 from public.document_versions version
    where version.id = document_version_id
  )
);

create table if not exists public.workbook_imports (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_sha256 text not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  apqc_row_count integer not null check (apqc_row_count >= 0),
  document_row_count integer not null check (document_row_count >= 0),
  imported_at timestamptz not null default now(),
  imported_by uuid references public.profiles(id),
  notes text not null default '',
  unique (source_sha256)
);

alter table public.workbook_imports enable row level security;
revoke all on public.workbook_imports from anon;
grant select on public.workbook_imports to authenticated;
drop policy if exists "admins read workbook imports" on public.workbook_imports;
create policy "admins read workbook imports" on public.workbook_imports
for select to authenticated using ((select public.current_profile_role()) = 'admin');

comment on table public.document_apqc_mappings is
  'Source-backed classification from a private enterprise workbook; absence of a row means unclassified, not inferred.';
comment on column public.document_versions.source_metadata is
  'Source fields retained verbatim from controlled imports; never interpreted as approved governance metadata.';
