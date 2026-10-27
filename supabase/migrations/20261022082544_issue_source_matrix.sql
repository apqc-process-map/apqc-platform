-- Preserve the workbook-style evidence matrix, including sources not yet uploaded.
create table if not exists public.finding_source_evidence (
  finding_id uuid not null references public.findings(id) on delete cascade,
  source_ref smallint not null check (source_ref between 1 and 14),
  evidence_excerpt text not null check (length(evidence_excerpt) between 1 and 12000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (finding_id, source_ref)
);

create index if not exists finding_source_evidence_ref_idx
  on public.finding_source_evidence(source_ref, finding_id);

alter table public.finding_source_evidence enable row level security;
grant select on public.finding_source_evidence to authenticated;
revoke all on public.finding_source_evidence from anon;

create policy "read source evidence for visible findings"
on public.finding_source_evidence for select to authenticated
using (exists (select 1 from public.findings f where f.id=finding_id));

comment on table public.finding_source_evidence is
  'Source-backed issue-by-document evidence cells from a controlled review matrix; source_ref may point to a source whose binary has not yet been supplied.';
