-- Preserve prior reference/document history while switching all active views to the controlled workbook import.
alter table public.apqc_frameworks add column if not exists is_active boolean not null default true;
create unique index if not exists apqc_frameworks_one_active_idx on public.apqc_frameworks(is_active) where is_active;

alter table public.document_versions add column if not exists replaced_at timestamptz;
create index if not exists document_versions_current_idx on public.document_versions(document_id, version_number desc) where replaced_at is null;

comment on column public.apqc_frameworks.is_active is 'Only one framework supplies the active Process Map and Catalog reference.';
comment on column public.document_versions.replaced_at is 'A non-null value preserves an audit version while excluding it from the current workbook-backed library.';
