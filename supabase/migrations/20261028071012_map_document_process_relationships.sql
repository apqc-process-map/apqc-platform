-- Expose confirmed document-process links in the Relationship workspace without
-- inferring document-to-document dependencies from titles alone.

insert into public.relationship_types (
  code, group_code, label_vi, label_en, inverse_label_vi, inverse_label_en,
  is_directed, allowed_source_types, allowed_target_types, is_active
)
values (
  'documented_by', 'evidence', 'Được mô tả bởi tài liệu', 'Documented by',
  'Mô tả quy trình', 'Documents', true, array['process'], array['document'], true
)
on conflict (code) do update
set group_code = excluded.group_code,
    label_vi = excluded.label_vi,
    label_en = excluded.label_en,
    inverse_label_vi = excluded.inverse_label_vi,
    inverse_label_en = excluded.inverse_label_en,
    is_directed = excluded.is_directed,
    allowed_source_types = excluded.allowed_source_types,
    allowed_target_types = excluded.allowed_target_types,
    is_active = true;

insert into public.object_relationships (
  source_type, source_id, target_type, target_id, relationship_type_id,
  description, status, evidence_text
)
select
  'process'::public.relationship_object_type,
  link.process_id,
  'document'::public.relationship_object_type,
  version.document_id,
  relationship_type.id,
  format(
    'Tài liệu %s được liên kết trực tiếp với quy trình %s với vai trò %s.',
    document.document_code, process.process_code, link.link_role::text
  ),
  'proposed'::public.relationship_status,
  format(
    'Nguồn dữ liệu: document_process_links.id=%s; document_version_id=%s.',
    link.id, link.document_version_id
  )
from public.document_process_links link
join public.document_versions version on version.id = link.document_version_id
join public.documents document on document.id = version.document_id
join public.processes process on process.id = link.process_id
join public.relationship_types relationship_type on relationship_type.code = 'documented_by'
where document.archived_at is null
  and process.archived_at is null
  and not exists (
    select 1
    from public.object_relationships existing
    where existing.source_type = 'process'
      and existing.source_id = link.process_id
      and existing.target_type = 'document'
      and existing.target_id = version.document_id
      and existing.relationship_type_id = relationship_type.id
  );