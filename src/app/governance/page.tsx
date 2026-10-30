import { noteSlowPage } from "@/lib/page-perf";
import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

export default async function GovernancePage() {
  const { supabase, profile } = await requireActiveAccount();
  // Safe, post-response timing with no user or document identifiers.
  noteSlowPage("/governance");
  const [frameworks,elements,metrics,coverage,reviews,reading,findings,documentReviews] = await Promise.all([
    supabase.from("apqc_frameworks").select("id,code,name,version,imported_at,source_license_note").eq("is_active",true),
    supabase.from("apqc_elements").select("id,apqc_frameworks!inner(is_active)",{count:"exact",head:true}).eq("apqc_frameworks.is_active",true),
    supabase.from("apqc_metrics").select("id,apqc_frameworks!inner(is_active)",{count:"exact",head:true}).eq("apqc_frameworks.is_active",true),
    supabase.from("apqc_coverage_view").select("apqc_element_id,pcf_id,name,verified_process_mappings").gt("verified_process_mappings",0).limit(100),
    supabase.from("process_review_status_view").select("*").eq("is_review_overdue",true).limit(50),
    supabase.from("reading_completion_view").select("*"),
    supabase.from("finding_dashboard_view").select("*"),
    supabase.from("review_requests").select("id,object_id,submitted_by,assigned_admin_id,status,created_at").eq("object_type","document_version").eq("status","open").order("created_at",{ascending:true}).limit(100),
  ]);
  const reviewRows=(documentReviews.data||[]) as {id:string;object_id:string;submitted_by:string;assigned_admin_id:string|null;status:string;created_at:string}[];
  const reviewObjectIds=[...new Set(reviewRows.map(row=>row.object_id))];
  const reviewProfileIds=[...new Set(reviewRows.flatMap(row=>[row.submitted_by,row.assigned_admin_id]).filter((id):id is string=>Boolean(id)))];
  const [reviewVersionsResult,reviewProfilesResult]=await Promise.all([
    reviewObjectIds.length?supabase.from("document_versions").select("id,title_vi,status,documents(document_code)").in("id",reviewObjectIds):Promise.resolve({data:[],error:null}),
    reviewProfileIds.length?supabase.from("profiles").select("id,display_name").in("id",reviewProfileIds):Promise.resolve({data:[],error:null}),
  ]);
  const reviewVersionById=new Map(((reviewVersionsResult.data||[]) as unknown as {id:string;title_vi:string;status:string;documents:{document_code:string}|{document_code:string}[]|null}[]).map(row=>[row.id,row]));
  const reviewProfileById=new Map(((reviewProfilesResult.data||[]) as {id:string;display_name:string}[]).map(row=>[row.id,row.display_name]));
  const activeStatuses=["new","triage","in_progress","pending_decision","reopened"];
  const openFindings=(findings.data||[]).filter(row=>activeStatuses.includes(row.status)).reduce((sum,row)=>sum+Number(row.finding_count||0),0);
  const framework=frameworks.data?.[0];
  return <WorkspaceShell active="/governance" eyebrow="GOVERNANCE CONTROL" title="Governance" description="Chất lượng metadata, APQC coverage, review và acknowledgment." userName={profile.display_name} role={profile.role}>
    <div className="governance-grid governance-drilldowns">
      <Link href="/catalog?type=apqc"><span>APQC elements</span><strong>{elements.count?.toLocaleString("vi-VN")||0}</strong><small>L0–L2 · 13 categories</small></Link>
      <Link href="/catalog?type=apqc"><span>APQC metrics</span><strong>{metrics.count?.toLocaleString("vi-VN")||0}</strong><small>Reference definitions</small></Link>
      <a href="#coverage"><span>Mapped elements</span><strong>{coverage.data?.length||0}</strong><small>Verified mappings</small></a>
      <Link href="/findings?status=open"><span>Open findings</span><strong>{openFindings}</strong><small>{reviews.data?.length||0} overdue reviews</small></Link>
    </div>
    <div className="governance-layout"><section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">REFERENCE BASELINE</p><h2>{framework?.name||"APQC framework"}</h2></div><span className="count-chip">v{framework?.version||"—"}</span></div><div className="governance-copy"><dl><div><dt>Framework code</dt><dd>{framework?.code||"—"}</dd></div><div><dt>Imported</dt><dd>{framework?.imported_at?new Date(framework.imported_at).toLocaleString("vi-VN"):"—"}</dd></div><div><dt>Reading assignments</dt><dd>{reading.data?.length||0} objects</dd></div></dl><p>{framework?.source_license_note||"Chưa có attribution metadata."}</p></div></section>
    <aside className="legend-panel"><p className="section-kicker">QUALITY SIGNALS</p><h2>Trạng thái kiểm soát</h2><div className="legend-row"><span className="legend-dot"/><div><strong>APQC baseline hợp lệ</strong><small>{elements.count===449?"Đủ expected counts":"Cần kiểm tra count"}</small></div></div><div className="legend-row"><span className="legend-dot tone-impact"/><div><strong>Review overdue</strong><small>{reviews.data?.length||0} process versions</small></div></div><div className="legend-row"><span className="legend-dot tone-governance"/><div><strong>Findings đang mở</strong><small>{openFindings} items</small></div></div></aside></div>
    <div className="governance-detail-grid">
      <section className="data-panel" id="document-review-queue"><div className="data-panel-heading"><div><p className="section-kicker">DOCUMENT REVIEW TASKS</p><h2>Tài liệu đang chờ duyệt</h2></div><span className="count-chip">{reviewRows.length}</span></div>{!reviewRows.length?<div className="state-message compact-state"><strong>Không có tài liệu đang chờ duyệt</strong></div>:<div className="governance-drill-list">{reviewRows.map(row=>{const version=reviewVersionById.get(row.object_id);const document=version?.documents;const documentCode=Array.isArray(document)?document[0]?.document_code:document?.document_code;return <Link href={`/documents?detail=${row.object_id}#document-metadata-detail`} key={row.id}><div><strong>{documentCode||"Tài liệu"} · {version?.title_vi||"Chưa có tên"}</strong><span>Người gửi: {reviewProfileById.get(row.submitted_by)||"—"} · Người duyệt: {row.assigned_admin_id?reviewProfileById.get(row.assigned_admin_id)||"—":"Chưa phân công"}</span></div><small>{new Date(row.created_at).toLocaleDateString("vi-VN")}</small></Link>})}</div>}</section>
      <section className="data-panel" id="overdue-reviews"><div className="data-panel-heading"><div><p className="section-kicker">REVIEW QUEUE</p><h2>Quá hạn rà soát</h2></div><span className="count-chip">{reviews.data?.length||0}</span></div>{!reviews.data?.length?<div className="state-message compact-state"><strong>Không có process quá hạn</strong></div>:<div className="governance-drill-list">{reviews.data.map((row,index)=><article key={String(row.process_version_id||index)}><div><strong>{String(row.process_code||"Process")}</strong><span>{String(row.name_vi||"Chưa có tên")}</span></div><small>{row.review_due_at?new Date(String(row.review_due_at)).toLocaleDateString("vi-VN"):"—"}</small></article>)}</div>}</section>
      <section className="data-panel" id="coverage"><div className="data-panel-heading"><div><p className="section-kicker">APQC COVERAGE</p><h2>Elements đã mapping</h2></div><span className="count-chip">{coverage.data?.length||0}</span></div>{!coverage.data?.length?<div className="state-message compact-state"><strong>Chưa có verified mapping</strong></div>:<div className="governance-drill-list">{coverage.data.slice(0,20).map(row=><Link href={`/catalog/apqc/${row.apqc_element_id}`} key={row.apqc_element_id}><div><strong>{row.pcf_id}</strong><span>{row.name}</span></div><small>{row.verified_process_mappings} mappings</small></Link>)}</div>}</section>
    </div>
  </WorkspaceShell>;
}
