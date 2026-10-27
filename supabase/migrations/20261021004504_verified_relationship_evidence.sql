-- A verified relationship must be explainable and traceable.

alter table public.object_relationships
  add constraint object_relationships_verified_evidence_check
  check (
    status <> 'verified'::public.relationship_status
    or (
      nullif(btrim(description), '') is not null
      and nullif(btrim(evidence_text), '') is not null
    )
  );
