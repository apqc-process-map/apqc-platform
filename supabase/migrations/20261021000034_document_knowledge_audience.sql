-- Document knowledge audience (role-level, not access control or reading acknowledgement).
-- Reuse governed relationship records. Admin saves all active business role selections atomically.
INSERT INTO public.relationship_types (
  code, group_code, label_vi, label_en, inverse_label_vi, inverse_label_en,
  is_directed, allowed_source_types, allowed_target_types, is_active
) VALUES (
  'role_not_applicable_document', 'knowledge', 'Không áp dụng / không cần biết',
  'Not applicable to role', 'Không áp dụng cho chức danh', 'Not applicable to role',
  true, ARRAY['business_role']::text[], ARRAY['document']::text[], true
) ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_document_knowledge_audience(
  p_document_id uuid, p_assignments jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  actor uuid := (SELECT auth.uid());
  entry record;
  type_id uuid;
  existing_id uuid;
  selected_count integer;
  level_name text;
  evidence_note text := 'Phân loại chức danh được quản trị viên xác nhận tại Tab 02 - Document.';
BEGIN
  IF actor IS NULL OR (SELECT public.current_profile_role()) IS DISTINCT FROM 'admin'::public.system_role THEN
    RAISE EXCEPTION 'Chỉ Admin được quản lý nhóm chức danh cần biết tài liệu';
  END IF;

  IF p_assignments IS NULL OR jsonb_typeof(p_assignments) <> 'object' THEN
    RAISE EXCEPTION 'Danh sách chức danh phải là một đối tượng hợp lệ';
  END IF;

  SELECT count(*) INTO selected_count FROM jsonb_each_text(p_assignments);
  IF selected_count > 500 THEN
    RAISE EXCEPTION 'Vượt quá giới hạn chức danh';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_each_text(p_assignments) e
    WHERE e.key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR e.value NOT IN ('must', 'should', 'none')
  ) THEN
    RAISE EXCEPTION 'Chức danh hoặc mức cần biết không hợp lệ';
  END IF;

  IF (
    SELECT count(*) FROM public.business_roles b
    JOIN jsonb_each_text(p_assignments) e ON b.id = e.key::uuid
    WHERE b.is_active
  ) <> selected_count THEN
    RAISE EXCEPTION 'Có chức danh không tồn tại hoặc đã ngừng sử dụng';
  END IF;

  -- This taxonomy applies to a governed document identity, not one individual version.
  IF NOT EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.document_versions v ON v.document_id = d.id
    WHERE d.id = p_document_id AND d.archived_at IS NULL
      AND v.status IN ('draft', 'rejected')
  ) THEN
    RAISE EXCEPTION 'Chỉ phân loại chức danh khi tài liệu còn bản nháp có thể chỉnh sửa';
  END IF;

  -- Serialize edits to the same document to avoid conflicting selections.
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_document_id::text, 0));

  -- A rejected relationship is the historical record of a removed/moved assignment.
  UPDATE public.object_relationships r
  SET status = 'rejected', updated_by = actor, verified_by = NULL
  FROM public.relationship_types t, public.business_roles b
  WHERE r.relationship_type_id = t.id
    AND r.source_type = 'business_role' AND r.target_type = 'document'
    AND r.target_id = p_document_id AND r.source_id = b.id AND b.is_active
    AND t.code IN (
      'role_must_know_document', 'role_should_know_document', 'role_not_applicable_document'
    )
    AND r.status <> 'rejected'
    AND COALESCE(p_assignments ->> r.source_id::text, '') <> CASE t.code
      WHEN 'role_must_know_document' THEN 'must'
      WHEN 'role_should_know_document' THEN 'should'
      ELSE 'none'
    END;

  FOR entry IN SELECT key::uuid AS role_id, value AS requirement FROM jsonb_each_text(p_assignments)
  LOOP
    level_name := CASE entry.requirement
      WHEN 'must' THEN 'role_must_know_document'
      WHEN 'should' THEN 'role_should_know_document'
      ELSE 'role_not_applicable_document'
    END;
    SELECT id INTO type_id
      FROM public.relationship_types
      WHERE code = level_name AND is_active;
    IF type_id IS NULL THEN
      RAISE EXCEPTION 'Thiếu danh mục quan hệ kiến thức: %', level_name;
    END IF;

    -- Existing rows are reactivated; no duplicate mapping is inserted.
    UPDATE public.object_relationships
    SET status = 'verified', updated_by = actor, verified_by = actor,
        description = 'Mức độ cần biết tài liệu của chức danh được xác nhận tại Tab 02.',
        evidence_text = evidence_note
    WHERE source_type = 'business_role' AND source_id = entry.role_id
      AND target_type = 'document' AND target_id = p_document_id
      AND relationship_type_id = type_id
      AND status <> 'verified'
    RETURNING id INTO existing_id;

    IF NOT FOUND THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.object_relationships r
        WHERE r.source_type = 'business_role' AND r.source_id = entry.role_id
          AND r.target_type = 'document' AND r.target_id = p_document_id
          AND r.relationship_type_id = type_id AND r.status = 'verified'
      ) THEN
        INSERT INTO public.object_relationships (
          source_type, source_id, target_type, target_id, relationship_type_id,
          status, description, evidence_text, created_by, updated_by, verified_by
        ) VALUES (
          'business_role', entry.role_id, 'document', p_document_id, type_id,
          'verified', 'Mức độ cần biết tài liệu của chức danh được xác nhận tại Tab 02.',
          evidence_note, actor, actor, actor
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.set_document_knowledge_audience(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_document_knowledge_audience(uuid, jsonb) TO authenticated;
