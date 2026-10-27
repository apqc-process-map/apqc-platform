-- Complete process publication gates and approval separation.
alter table public.process_versions add column if not exists updated_by uuid references public.profiles(id);
create or replace function public.validate_process_version_dates()
returns trigger language plpgsql security invoker set search_path = public as $$
declare
  process_level public.process_level_type;
begin
  select level_type into process_level from public.processes where id = new.process_id;

  if new.status in ('scheduled', 'effective') then
    if new.valid_from is null or new.review_due_at is null then
      raise exception 'Publication requires valid_from and review_due_at';
    end if;
    if process_level in ('value_chain', 'e2e', 'process', 'subprocess') and
      (nullif(trim(new.business_purpose), '') is null or nullif(trim(new.scope_and_boundaries), '') is null or
       nullif(trim(new.process_at_a_glance), '') is null or nullif(trim(new.critical_decision_points), '') is null or
       nullif(trim(new.accountability_and_impact), '') is null) then
      raise exception 'Publication requires the complete Executive Summary';
    end if;
    if not exists (select 1 from public.process_assignments a where a.process_version_id = new.id and a.assignment_role = 'owner') then
      raise exception 'Publication requires an Owner';
    end if;
    if not exists (select 1 from public.process_assignments a where a.process_version_id = new.id and a.assignment_role = 'steward') then
      raise exception 'Publication requires a Steward';
    end if;
    if not exists (select 1 from public.process_apqc_mappings m where m.process_version_id = new.id and m.status = 'verified') then
      raise exception 'Publication requires a verified APQC mapping';
    end if;
  end if;

  if new.approved_by is not null and new.approved_by = coalesce(new.updated_by, new.created_by) then
    raise exception 'Last author cannot approve own process version';
  end if;

  if new.status = 'effective' and exists (
    select 1 from public.process_versions other
    where other.process_id = new.process_id and other.id <> new.id and other.status = 'effective'
      and daterange(coalesce(other.valid_from, '-infinity'::date), coalesce(other.valid_until, 'infinity'::date), '[]')
        && daterange(coalesce(new.valid_from, '-infinity'::date), coalesce(new.valid_until, 'infinity'::date), '[]')
  ) then
    raise exception 'Overlapping effective process versions are not allowed';
  end if;
  return new;
end;
$$;

create index if not exists process_assignments_version_role_idx on public.process_assignments(process_version_id, assignment_role);
create index if not exists process_apqc_mappings_version_status_idx on public.process_apqc_mappings(process_version_id, status);
create index if not exists object_relationships_type_status_idx on public.object_relationships(relationship_type_id, status);
create index if not exists document_versions_document_status_idx on public.document_versions(document_id, status);
create index if not exists document_process_links_version_idx on public.document_process_links(document_version_id);
create index if not exists document_files_version_idx on public.document_files(document_version_id);

