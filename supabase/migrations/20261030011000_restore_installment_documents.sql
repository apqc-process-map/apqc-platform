-- Restore the twelve user-confirmed installment documents to the active library.
-- Identities, versions, files, process links, relationships and audit history stay in place.
do $$
declare
  expected_codes constant text[] := array[
    'TG-DOC-001', 'TG-DOC-002', 'TG-DOC-003', 'TG-DOC-004',
    'TG-DOC-005', 'TG-DOC-006', 'TG-DOC-007', 'TG-DOC-008',
    'TG-DOC-009', 'TG-DOC-010', 'TG-DOC-011', 'TG-DOC-012'
  ];
begin
  if (select count(*) from public.documents where document_code = any(expected_codes)) <> cardinality(expected_codes) then
    raise exception 'The expected twelve installment document identities are not present';
  end if;
  if (
    select count(*)
    from public.document_versions dv
    join public.documents d on d.id = dv.document_id
    where d.document_code = any(expected_codes)
  ) <> cardinality(expected_codes) then
    raise exception 'Each installment document must have exactly one retained version';
  end if;
  update public.documents
  set archived_at = null, updated_at = now()
  where document_code = any(expected_codes) and archived_at is not null;
  update public.document_versions dv
  set replaced_at = null, updated_at = now()
  from public.documents d
  where d.id = dv.document_id
    and d.document_code = any(expected_codes)
    and dv.replaced_at is not null;
end
$$;