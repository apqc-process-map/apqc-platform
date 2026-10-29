-- Executive APQC L1/L2/L3 reporting (PNJ-controlled reference framework only).
-- Mapping coverage is not review, process maturity or compliance.
-- Reads are SECURITY INVOKER and remain constrained by document-version RLS.
CREATE OR REPLACE FUNCTION public.home_apqc_hierarchy_summary()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  WITH reference AS (
    SELECT f.id
    FROM public.apqc_frameworks f
    WHERE f.name = 'APQC catalogue with controlled PNJ interpretation'
      AND f.version = 'Process Map workbook 2026-10-29'
    ORDER BY f.id LIMIT 1
  ),
  l1 AS (
    SELECT a.id,a.pcf_id,a.hierarchy_id,a.name,a.display_order
    FROM public.apqc_elements a JOIN reference r ON r.id=a.framework_id
    WHERE a.level_number=1
  ),
  l2 AS (
    SELECT a.id,a.parent_id,a.pcf_id,a.hierarchy_id,a.name,a.display_order
    FROM public.apqc_elements a JOIN reference r ON r.id=a.framework_id
    JOIN l1 parent ON parent.id=a.parent_id
    WHERE a.level_number=2
  ),
  l3 AS (
    SELECT a.id,a.parent_id,a.pcf_id,a.hierarchy_id,a.name,a.display_order,
      l2.parent_id AS l1_id
    FROM public.apqc_elements a JOIN reference r ON r.id=a.framework_id
    JOIN l2 ON l2.id=a.parent_id
    WHERE a.level_number=3
  ),
  doc_links AS (
    SELECT DISTINCT
      a.id AS l3_id, a.parent_id AS l2_id, a.l1_id,
      v.document_id
    FROM l3 a
    JOIN public.document_apqc_mappings dam ON dam.apqc_element_id=a.id
    JOIN public.document_versions v ON v.id=dam.document_version_id
  ),
  level3 AS (
    SELECT leaf.id,leaf.parent_id,leaf.pcf_id,leaf.hierarchy_id,leaf.name,leaf.display_order,
      COUNT(DISTINCT dl.document_id)::integer AS documents
    FROM l3 leaf LEFT JOIN doc_links dl ON dl.l3_id=leaf.id
    GROUP BY leaf.id,leaf.parent_id,leaf.pcf_id,leaf.hierarchy_id,leaf.name,leaf.display_order
  ),
  level2 AS (
    SELECT mid.id,mid.parent_id,mid.pcf_id,mid.hierarchy_id,mid.name,mid.display_order,
      COUNT(DISTINCT leaf.id)::integer AS total_l3,
      COUNT(DISTINCT leaf.id) FILTER (WHERE leaf.documents>0)::integer AS mapped_l3,
      (SELECT COUNT(DISTINCT document_id)::integer FROM doc_links dl WHERE dl.l2_id=mid.id) AS documents
    FROM l2 mid LEFT JOIN level3 leaf ON leaf.parent_id=mid.id
    GROUP BY mid.id,mid.parent_id,mid.pcf_id,mid.hierarchy_id,mid.name,mid.display_order
  ),
  level1 AS (
    SELECT top.id,top.pcf_id,top.hierarchy_id,top.name,top.display_order,
      COUNT(DISTINCT mid.id)::integer AS total_l2,
      COALESCE(SUM(mid.total_l3),0)::integer AS total_l3,
      COALESCE(SUM(mid.mapped_l3),0)::integer AS mapped_l3,
      (SELECT COUNT(DISTINCT document_id)::integer FROM doc_links dl WHERE dl.l1_id=top.id) AS documents
    FROM l1 top LEFT JOIN level2 mid ON mid.parent_id=top.id
    GROUP BY top.id,top.pcf_id,top.hierarchy_id,top.name,top.display_order
  )
  SELECT CASE WHEN (SELECT public.current_profile_role()) IS NULL
    OR (SELECT auth.uid()) IS NULL THEN NULL::jsonb
    ELSE jsonb_build_object(
      'framework','APQC catalogue with controlled PNJ interpretation',
      'framework_version','Process Map workbook 2026-10-29',
      'total_l1',(SELECT COUNT(*) FROM level1),
      'total_l2',(SELECT COUNT(*) FROM level2),
      'total_l3',(SELECT COUNT(*) FROM level3),
      'mapped_l3',(SELECT COUNT(*) FROM level3 WHERE documents>0),
      'mapped_documents',(SELECT COUNT(DISTINCT document_id) FROM doc_links),
      'level1',COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id',id,'code',hierarchy_id,'name',name,
        'total_l2',total_l2,'total_l3',total_l3,'mapped_l3',mapped_l3,
        'documents',documents) ORDER BY display_order,code) FROM (
          SELECT *,hierarchy_id AS code FROM level1
        ) q),'[]'::jsonb),
      'level2',COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id',id,'parent_id',parent_id,'code',hierarchy_id,'name',name,
        'total_l3',total_l3,'mapped_l3',mapped_l3,
        'documents',documents) ORDER BY display_order,hierarchy_id) FROM level2),'[]'::jsonb),
      'level3',COALESCE((SELECT jsonb_agg(jsonb_build_object(
        'id',id,'parent_id',parent_id,'code',hierarchy_id,'name',name,
        'documents',documents) ORDER BY display_order,hierarchy_id) FROM level3),'[]'::jsonb)
    ) END
$$;

REVOKE ALL ON FUNCTION public.home_apqc_hierarchy_summary() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.home_apqc_hierarchy_summary() TO authenticated;
COMMENT ON FUNCTION public.home_apqc_hierarchy_summary() IS
 'Executive L1/L2/L3 APQC catalogue summary for PNJ interpretation. Counts distinct RLS-visible document identities; mapping is not compliance.';
