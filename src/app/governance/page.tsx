import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";
export const instant = false;

export default async function GovernancePage() {
  const { supabase, profile } = await requireActiveAccount();
  const [frameworks,elements,metrics,coverage,reviews,reading,findings] = await Promise.all([
    supabase.from("apqc_frameworks").select("id,code,name,version,imported_at,source_license_note"),
    supabase.from("apqc_elements").select("*",{count:"exact",head:true}),
    supabase.from("apqc_metrics").select("*",{count:"exact",head:true}),
    supabase.from("apqc_coverage_view").select("apqc_element_id,verified_process_mappings").gt("verified_process_mappings",0),
    supabase.from("process_review_status_view").select("*").eq("is_review_overdue",true),
    supabase.from("reading_completion_view").select("*"),
    supabase.from("finding_dashboard_view").select("*"),
  ]);
  const openFindings=(findings.data||[]).filter(x=>!["resolved","closed"].includes(x.status)).reduce((s,x)=>s+Number(x.finding_count||0),0);
  const framework=frameworks.data?.[0];
  return <WorkspaceShell active="/governance" eyebrow="GOVERNANCE CONTROL" title="Governance" description="Chất lượng metadata, APQC coverage, review và acknowledgment." userName={profile.display_name} role={profile.role}>
    <div className="governance-grid"><article><span>APQC elements</span><strong>{elements.count?.toLocaleString("vi-VN")||0}</strong><small>5 levels · 13 categories</small></article><article><span>APQC metrics</span><strong>{metrics.count?.toLocaleString("vi-VN")||0}</strong><small>Reference definitions</small></article><article><span>Mapped elements</span><strong>{coverage.data?.length||0}</strong><small>Verified mappings</small></article><article><span>Open findings</span><strong>{openFindings}</strong><small>{reviews.data?.length||0} overdue reviews</small></article></div>
    <div className="governance-layout"><section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">REFERENCE BASELINE</p><h2>{framework?.name||"APQC framework"}</h2></div><span className="count-chip">v{framework?.version||"—"}</span></div><div className="governance-copy"><dl><div><dt>Framework code</dt><dd>{framework?.code||"—"}</dd></div><div><dt>Imported</dt><dd>{framework?.imported_at?new Date(framework.imported_at).toLocaleString("vi-VN"):"—"}</dd></div><div><dt>Reading assignments</dt><dd>{reading.data?.length||0} objects</dd></div></dl><p>{framework?.source_license_note||"Chưa có attribution metadata."}</p></div></section>
    <aside className="legend-panel"><p className="section-kicker">QUALITY SIGNALS</p><h2>Trạng thái kiểm soát</h2><div className="legend-row"><span className="legend-dot"/><div><strong>APQC baseline hợp lệ</strong><small>{elements.count===2017&&metrics.count===3284?"Đủ expected counts":"Cần kiểm tra count"}</small></div></div><div className="legend-row"><span className="legend-dot tone-impact"/><div><strong>Review overdue</strong><small>{reviews.data?.length||0} process versions</small></div></div><div className="legend-row"><span className="legend-dot tone-governance"/><div><strong>Findings đang mở</strong><small>{openFindings} items</small></div></div></aside></div>
  </WorkspaceShell>;
}
