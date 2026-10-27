-- A document finding is actionable only if it compares two distinct document identities.
-- Creation still happens in two existing server steps (finding, then evidence links).
-- Enforce this invariant before the finding can be marked resolved or closed.
create or replace function public.require_cross_document_evidence_for_closure()
returns trigger
language plpgsql security invoker set search_path = public as $$
declare distinct_document_count integer;
begin
  if new.finding_domain = 'document' and new.status in ('resolved','closed') then
    select count(distinct v.document_id)
      into distinct_document_count
    from public.finding_links l
    join public.document_versions v on v.id=l.object_id
    where l.finding_id=new.id
      and l.object_type='document_version'
      and l.link_role='subject';

    if distinct_document_count < 2 then
      raise exception 'Document finding closure requires evidence from at least two separate documents';
    end if;
  end if;
  return new;
end $$;

create trigger cross_document_finding_closure_check
before insert or update on public.findings
for each row execute function public.require_cross_document_evidence_for_closure();
