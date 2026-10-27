-- Keep relationship form invariants enforceable for every database client.

alter table public.object_relationships
  add constraint object_relationships_distinct_endpoints_check
  check (source_type <> target_type or source_id <> target_id);

alter table public.object_relationships
  add constraint object_relationships_validity_check
  check (valid_from is null or valid_until is null or valid_until >= valid_from);

alter table public.object_relationships
  add constraint object_relationships_metadata_length_check
  check (
    length(coalesce(label, '')) <= 255
    and length(coalesce(description, '')) <= 3000
    and length(coalesce(evidence_text, '')) <= 3000
  );
