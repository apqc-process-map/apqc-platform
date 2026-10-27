-- Remove the six tagged relationship fixtures left behind after the real-data cleanup.
-- Every source business role and target document referenced by these rows was already deleted.

delete from public.object_relationships
where id in (
  '831d91f9-6e80-4155-9607-176cf94e0c99',
  '9323593e-6eba-42eb-9490-c659331be086',
  'ba03e48d-c3e2-4ef6-a015-4c4c99d857b4',
  'ecdd41f4-88e0-474a-afd0-22e244c5efe4',
  'ec0e3a47-73e9-4635-9aa6-4d99320da58d',
  'd9b6be9d-2279-4923-80ee-031b6293f736'
)
and description ilike '[DEMO]%'
and source_type = 'business_role'
and target_type = 'document'
and not exists (
  select 1 from public.business_roles role_record
  where role_record.id = object_relationships.source_id
)
and not exists (
  select 1 from public.documents document_record
  where document_record.id = object_relationships.target_id
);
