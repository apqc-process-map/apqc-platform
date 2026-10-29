-- Home analytics are RLS-scoped and aggregated in PostgreSQL.
-- The reporting window is inclusive calendar dates in Asia/Ho_Chi_Minh.
CREATE OR REPLACE FUNCTION public.home_document_finding_summary(
  p_from_date date, p_to_date date
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  result jsonb;
  today_vn date := (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR (SELECT public.current_profile_role()) IS NULL THEN
    RAISE EXCEPTION 'Cần đăng nhập để xem dashboard';
  END IF;
  IF p_from_date IS NULL OR p_to_date IS NULL
     OR p_from_date > p_to_date
     OR p_to_date > today_vn
     OR (p_to_date - p_from_date) > 365 THEN
    RAISE EXCEPTION 'Khoảng báo cáo không hợp lệ (tối đa 366 ngày, không vượt hôm nay)';
  END IF;

  WITH bounds AS (
    SELECT
      (p_from_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') AS from_at,
      ((p_to_date + 1)::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh') AS until_at
  ),
  -- Join a visible version so counts never reveal restricted document details.
  new_documents AS (
    SELECT d.id, (d.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
           COALESCE(NULLIF(btrim(dv.issuing_department), ''), 'Chưa xác định') AS department
    FROM public.documents d
    JOIN LATERAL (
      SELECT v.issuing_department FROM public.document_versions v
      WHERE v.document_id=d.id ORDER BY v.version_number LIMIT 1
    ) dv ON TRUE
    CROSS JOIN bounds b
    WHERE d.created_at >= b.from_at AND d.created_at < b.until_at
  ),
  uploads AS (
    SELECT df.id, v.document_id, (df.uploaded_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day
    FROM public.document_files df
    JOIN public.document_versions v ON v.id=df.document_version_id
    CROSS JOIN bounds b
    WHERE df.uploaded_at >= b.from_at AND df.uploaded_at < b.until_at
  ),
  found AS (
    SELECT f.id, f.status::text AS status, f.primary_issue_code,
           (f.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day
    FROM public.findings f CROSS JOIN bounds b
    WHERE f.finding_domain='document'
      AND f.created_at >= b.from_at AND f.created_at < b.until_at
  ),
  remedied AS (
    SELECT f.id, (COALESCE(f.resolved_at,f.closed_at) AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day
    FROM public.findings f CROSS JOIN bounds b
    WHERE f.finding_domain='document'
      AND f.status IN ('resolved','closed')
      AND f.action_decision='required'
      AND COALESCE(f.resolved_at,f.closed_at) >= b.from_at
      AND COALESCE(f.resolved_at,f.closed_at) < b.until_at
  ),
  departments AS (
    SELECT lower(department) AS normalized, min(department) AS label, count(*)::integer AS total
    FROM new_documents GROUP BY lower(department)
  ),
  statuses AS (
    SELECT status, count(*)::integer AS total FROM found GROUP BY status
  ),
  days AS (
    SELECT gs::date AS day
    FROM generate_series(p_from_date::timestamp,p_to_date::timestamp,interval '1 day') gs
  ),
  days_documents AS (SELECT day,count(*)::integer AS total FROM new_documents GROUP BY day),
  days_uploads AS (SELECT day,count(*)::integer AS total FROM uploads GROUP BY day),
  days_found AS (SELECT day,count(*)::integer AS total FROM found GROUP BY day),
  days_remedied AS (SELECT day,count(*)::integer AS total FROM remedied GROUP BY day),
  series AS (
    SELECT days.day,
      COALESCE(dd.total,0) AS new_documents,
      COALESCE(du.total,0) AS file_uploads,
      COALESCE(df.total,0) AS findings_found,
      COALESCE(dr.total,0) AS findings_remedied
    FROM days
    LEFT JOIN days_documents dd ON dd.day=days.day
    LEFT JOIN days_uploads du ON du.day=days.day
    LEFT JOIN days_found df ON df.day=days.day
    LEFT JOIN days_remedied dr ON dr.day=days.day
  )
  SELECT jsonb_build_object(
    'from_date',p_from_date, 'to_date',p_to_date,
    'new_documents',(SELECT count(*) FROM new_documents),
    'files_uploaded',(SELECT count(*) FROM uploads),
    'documents_with_files',(SELECT count(DISTINCT document_id) FROM uploads),
    'findings_found',(SELECT count(*) FROM found),
    'findings_remedied',(SELECT count(*) FROM remedied),
    'without_department',(SELECT count(*) FROM new_documents WHERE department='Chưa xác định'),
    'open_findings_now',(SELECT count(*) FROM public.findings f
      WHERE f.finding_domain='document' AND f.status NOT IN ('resolved','closed')),
    'overdue_actions_now',(SELECT count(*) FROM public.finding_actions fa
      JOIN public.findings f ON f.id=fa.finding_id
      WHERE f.finding_domain='document' AND fa.status NOT IN ('done','cancelled')
        AND fa.due_at < today_vn),
    'departments',COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'name',label,'count',total) ORDER BY total DESC,label)
      FROM departments), '[]'::jsonb),
    'finding_statuses',COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'status',status,'count',total) ORDER BY total DESC,status)
      FROM statuses), '[]'::jsonb),
    'timeline',COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'date',day,'documents',new_documents,'files',file_uploads,
        'found',findings_found,'remedied',findings_remedied) ORDER BY day)
      FROM series),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.home_document_finding_summary(date,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.home_document_finding_summary(date,date) TO authenticated;
COMMENT ON FUNCTION public.home_document_finding_summary(date,date) IS
  'RLS-scoped Home report: calendar-inclusive VN dates, distinct document identities vs file objects, document findings and verified remediation. No service-role bypass.';
