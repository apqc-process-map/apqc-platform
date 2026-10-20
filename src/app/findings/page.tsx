import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;
const activeStatuses = ["new","triage","in_progress","pending_decision","reopened"];

export default async function FindingsPage({ searchParams }: { searchParams: Promise<{ status?: string; severity?: string; due?: string; assigned?: string }> }) {
  const { status = "all", severity = "all", due = "all", assigned = "all" } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  let query = supabase.from("findings").select("id,finding_code,title,description,severity,priority,status,due_at,assignee_id,created_at").order("created_at",{ascending:false});
  if(status === "open") query=query.in("status",activeStatuses);
  else if(status !== "all") query=query.eq("status",status);
  if(severity !== "all") query=query.eq("severity",severity);
  if(due === "overdue") query=query.lt("due_at",new Date().toISOString()).in("status",activeStatuses);
  if(assigned === "me") query=query.eq("assignee_id",profile.id);
  const [{data,error},{data:summary}] = await Promise.all([query,supabase.from("finding_dashboard_view").select("*")]);
  const overdue=(summary||[]).reduce((sum,row)=>sum+Number(row.overdue_count||0),0);
  const open=(summary||[]).filter(row=>activeStatuses.includes(row.status)).reduce((sum,row)=>sum+Number(row.finding_count||0),0);
  return <WorkspaceShell active="/findings" eyebrow="FINDINGS & ACTIONS" title="Findings" description="Theo dõi vấn đề, quyết định, SLA và bằng chứng xử lý." userName={profile.display_name} role={profile.role}>
    <div className="relationship-summary finding-dashboard-links">
      <Link href="/findings"><span>Kết quả hiện tại</span><strong>{data?.length||0}</strong></Link>
      <Link href="/findings?status=open"><span>Đang mở</span><strong>{open}</strong></Link>
      <Link href="/findings?due=overdue"><span>Quá hạn</span><strong>{overdue}</strong></Link>
    </div>
    <form className="catalog-toolbar finding-filter-toolbar">
      <select name="status" defaultValue={status} aria-label="Trạng thái finding"><option value="all">Tất cả trạng thái</option><option value="open">Tất cả đang mở</option>{["new","triage","in_progress","pending_decision","resolved","closed","reopened"].map(value=><option key={value}>{value}</option>)}</select>
      <select name="severity" defaultValue={severity} aria-label="Mức độ finding"><option value="all">Tất cả mức độ</option>{["critical","high","medium","low"].map(value=><option key={value}>{value}</option>)}</select>
      <select name="due" defaultValue={due} aria-label="Hạn xử lý"><option value="all">Tất cả hạn</option><option value="overdue">Đã quá hạn</option></select>
      <select name="assigned" defaultValue={assigned} aria-label="Người được giao"><option value="all">Tất cả người phụ trách</option><option value="me">Được giao cho tôi</option></select>
      <button type="submit">Áp dụng</button>
    </form>
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">MANUAL FINDINGS</p><h2>{data?.length||0} kết quả</h2></div><span className="count-chip">SLA theo severity</span></div>
    {error?<div className="state-message error-state"><strong>Không thể tải findings</strong><span>{error.message}</span></div>:!data?.length?<div className="state-message"><strong>Chưa có finding phù hợp</strong><span>Thử xóa bộ lọc hoặc chọn điều kiện khác.</span></div>:<div className="finding-list">{data.map(item=><article key={item.id}><div className={"severity-mark "+item.severity}/><div><span className="mono-code">{item.finding_code}</span><h3><Link href={`/findings/${item.id}`}>{item.title}</Link></h3><p>{item.description}</p></div><div className="finding-meta"><span className="status-badge">{item.status}</span><strong>{item.severity}</strong><small>Due {new Date(item.due_at).toLocaleDateString("vi-VN")}</small></div></article>)}</div>}
    </section>
  </WorkspaceShell>;
}
