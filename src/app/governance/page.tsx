import { noteSlowPage } from "@/lib/page-perf";
import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

export default async function GovernancePage() {
  const { supabase, profile } = await requireActiveAccount();
  // Safe, post-response timing with no user or document identifiers.
  noteSlowPage("/governance", performance.now());
  const [frameworks,elements,metrics,coverage,reviews,reading,findings] = await Promise.all([
    supabase.from("apqc_frameworks").select("id,code,name,version,imported_at,source_license_note"),
    supabase.from("apqc_elements").select("*",{count:"exact",head:true}),
    supabase.from("apqc_metrics").select("*",{count:"exact",head:true}),
    supabase.from("apqc_coverage_view").select("apqc_element_id,pcf_id,name,verified_process_mappings").gt("verified_process_mappings",0).limit(100),
    supabase.from("process_review_status_view").select("*").eq("is_review_overdue",true).limit(50),
    supabase.from("reading_completion_view").select("*"),
    supabase.from("finding_dashboard_view").select("*"),
  ]);
  const activeStatuses=["new","triage","in_progress","pending_decision","reopened"];
  const openFindings=(findings.data||[]).filter(row=>activeStatuses.includes(row.status)).reduce((sum,row)=>sum+Number(row.finding_count||0),0);
  const framework=frameworks.data?.[0];
  return <WorkspaceShell active="/governance" eyebrow="GOVERNANCE CONTROL" title="Governance" description="Chất lượng metadata, APQC coverage, review và acknowledgment." userName={profile.display_name} role={profile.role}>
    <div className="governance-grid governance-drilldowns">
      <Link href="/catalog?type=apqc"><span>APQC elements</span><strong>{elements.count?.toLocaleString("vi-VN")||0}</strong><small>5 levels · 13 categories</small></Link>
      <Link href="/catalog?type=apqc"><span>APQC metrics</span><strong>{metrics.count?.toLocaleString("vi-VN")||0}</strong><small>Reference definitions</small></Link>
      <a href="#coverage"><span>Mapped elements</span><strong>{coverage.data?.length||0}</strong><small>Verified mappings</small></a>
      <Link href="/findings?status=open"><span>Open findings</span><strong>{openFindings}</strong><small>{reviews.data?.length||0} overdue reviews</small></Link>
    </div>
    <div className="governance-layout"><section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">REFERENCE BASELINE</p><h2>{framework?.name||"APQC framework"}</h2></div><span className="count-chip">v{framework?.version||"—"}</span></div><div className="governance-copy"><dl><div><dt>Framework code</dt><dd>{framework?.code||"—"}</dd></div><div><dt>Imported</dt><dd>{framework?.imported_at?new Date(framework.imported_at).toLocaleString("vi-VN"):"—"}</dd></div><div><dt>Reading assignments</dt><dd>{reading.data?.length||0} objects</dd></div></dl><p>{framework?.source_license_note||"Chưa có attribution metadata."}</p></div></section>
    <aside className="legend-panel"><p className="section-kicker">QUALITY SIGNALS</p><h2>Trạng thái kiểm soát</h2><div className="legend-row"><span className="legend-dot"/><div><strong>APQC baseline hợp lệ</strong><small>{elements.count===2017&&metrics.count===3284?"Đủ expected counts":"Cần kiểm tra count"}</small></div></div><div className="legend-row"><span className="legend-dot tone-impact"/><div><strong>Review overdue</strong><small>{reviews.data?.length||0} process versions</small></div></div><div className="legend-row"><span className="legend-dot tone-governance"/><div><strong>Findings đang mở</strong><small>{openFindings} items</small></div></div></aside></div>
    <div className="governance-detail-grid">
      <section className="data-panel" id="overdue-reviews"><div className="data-panel-heading"><div><p className="section-kicker">REVIEW QUEUE</p><h2>Quá hạn rà soát</h2></div><span className="count-chip">{reviews.data?.length||0}</span></div>{!reviews.data?.length?<div className="state-message compact-state"><strong>Không có process quá hạn</strong></div>:<div className="governance-drill-list">{reviews.data.map((row,index)=><article key={String(row.process_version_id||index)}><div><strong>{String(row.process_code||"Process")}</strong><span>{String(row.name_vi||"Chưa có tên")}</span></div><small>{row.review_due_at?new Date(String(row.review_due_at)).toLocaleDateString("vi-VN"):"—"}</small></article>)}</div>}</section>
      <section className="data-panel" id="coverage"><div className="data-panel-heading"><div><p className="section-kicker">APQC COVERAGE</p><h2>Elements đã mapping</h2></div><span className="count-chip">{coverage.data?.length||0}</span></div>{!coverage.data?.length?<div className="state-message compact-state"><strong>Chưa có verified mapping</strong></div>:<div className="governance-drill-list">{coverage.data.slice(0,20).map(row=><Link href={`/catalog/apqc/${row.apqc_element_id}`} key={row.apqc_element_id}><div><strong>{row.pcf_id}</strong><span>{row.name}</span></div><small>{row.verified_process_mappings} mappings</small></Link>)}</div>}</section>
    </div>
  </WorkspaceShell>;
}
