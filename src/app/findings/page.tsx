import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";
export const instant = false;

export default async function FindingsPage({ searchParams }: { searchParams: Promise<{ status?: string; severity?: string }> }) {
  const { status = "all", severity = "all" } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  let query = supabase.from("findings").select("id,finding_code,title,description,severity,priority,status,due_at,created_at").order("created_at",{ascending:false});
  if(status !== "all") query=query.eq("status",status);
  if(severity !== "all") query=query.eq("severity",severity);
  const [{data,error},{data:summary}] = await Promise.all([query,supabase.from("finding_dashboard_view").select("*")]);
  const overdue=(summary||[]).reduce((sum,row)=>sum+Number(row.overdue_count||0),0);
  return <WorkspaceShell active="/findings" eyebrow="FINDINGS & ACTIONS" title="Findings" description="Theo dõi vấn đề, quyết định, SLA và bằng chứng xử lý." userName={profile.display_name} role={profile.role}>
    <div className="relationship-summary"><article><span>Tổng findings</span><strong>{data?.length||0}</strong></article><article><span>Quá hạn</span><strong>{overdue}</strong></article><article><span>Vai trò hiện tại</span><strong className="role-value">{profile.role}</strong></article></div>
    <form className="catalog-toolbar compact"><select name="status" defaultValue={status}><option value="all">Tất cả trạng thái</option>{["new","triage","in_progress","pending_decision","resolved","closed","reopened"].map(x=><option key={x}>{x}</option>)}</select><select name="severity" defaultValue={severity}><option value="all">Tất cả mức độ</option>{["critical","high","medium","low"].map(x=><option key={x}>{x}</option>)}</select><button type="submit">Áp dụng</button></form>
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">MANUAL FINDINGS</p><h2>{data?.length||0} kết quả</h2></div><span className="count-chip">SLA theo severity</span></div>
    {error?<div className="state-message error-state"><strong>Không thể tải findings</strong><span>{error.message}</span></div>:!data?.length?<div className="state-message"><strong>Chưa có finding</strong><span>Admin hoặc Editor có thể tạo finding mới.</span></div>:<div className="finding-list">{data.map(item=><article key={item.id}><div className={"severity-mark "+item.severity}/><div><span className="mono-code">{item.finding_code}</span><h3><Link href={`/findings/${item.id}`}>{item.title}</Link></h3><p>{item.description}</p></div><div className="finding-meta"><span className="status-badge">{item.status}</span><strong>{item.severity}</strong><small>Due {new Date(item.due_at).toLocaleDateString("vi-VN")}</small></div></article>)}</div>}
    </section>
  </WorkspaceShell>;
}
