import Link from "next/link";
import Form from "next/form";
import WorkspaceShell from "@/components/workspace-shell";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions";
import { requireActiveAccount } from "@/lib/auth";
import { getServerTimestamp } from "@/lib/server-time";

export const instant=false;
const statusLabels:Record<string,string>={todo:"Chưa bắt đầu",in_progress:"Đang thực hiện",blocked:"Vướng mắc",done:"Hoàn thành",cancelled:"Đã hủy"};

export default async function NotificationsPage({searchParams}:{searchParams:Promise<{status?:string;assigned?:string}>}){
  const {status="active",assigned="all"}=await searchParams;
  const {supabase,profile}=await requireActiveAccount();
  const requestNow=await getServerTimestamp();
  let actionQuery=supabase.from("finding_actions").select("id,finding_id,action_title,description,assignee_id,due_at,status,progress_percent,last_update,completion_evidence,updated_at,findings!inner(finding_code,title,primary_issue_code,status)").order("updated_at",{ascending:false}).limit(200);
  if(status==="active")actionQuery=actionQuery.in("status",["todo","in_progress","blocked"]);
  else if(status!=="all")actionQuery=actionQuery.eq("status",status);
  if(assigned==="me")actionQuery=actionQuery.eq("assignee_id",profile.id);
  if(assigned==="unassigned")actionQuery=actionQuery.is("assignee_id",null);
  const [actionsResult,peopleResult,notificationResult]=await Promise.all([
    actionQuery,
    supabase.from("profiles").select("id,display_name").eq("is_active",true),
    supabase.from("notifications").select("id,type,title,body,deep_link,read_at,created_at").order("created_at",{ascending:false}).limit(100)
  ]);
  const actions=actionsResult.data||[];
  const people=new Map((peopleResult.data||[]).map(x=>[x.id,x.display_name]));
  const notifications=notificationResult.data||[];
  const unread=notifications.filter(x=>!x.read_at).length;
  const overdue=actions.filter(x=>x.due_at&&!["done","cancelled"].includes(x.status)&&new Date(x.due_at).getTime()<requestNow).length;
  return <WorkspaceShell active="/notifications" eyebrow="09 · ACTION LOG" title="Action Log" description="Theo dõi đầu việc khắc phục từ Finding; lịch sử thông báo được giữ riêng bên dưới." userName={profile.display_name} role={profile.role}>
    <div className="relationship-summary action-log-summary"><div><span>Action hiển thị</span><strong>{actions.length}</strong></div><div><span>Đang vướng</span><strong>{actions.filter(x=>x.status==="blocked").length}</strong></div><div><span>Quá hạn</span><strong>{overdue}</strong></div><div><span>Thông báo chưa đọc</span><strong>{unread}</strong></div></div>
    <Form action="/notifications" scroll={false} className="catalog-toolbar action-log-filter">
      <select name="status" defaultValue={status} aria-label="Trạng thái action"><option value="active">Đang hoạt động</option><option value="all">Tất cả trạng thái</option>{Object.entries(statusLabels).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>
      <select name="assigned" defaultValue={assigned} aria-label="Người thực hiện"><option value="all">Mọi người thực hiện</option><option value="me">Action của tôi</option><option value="unassigned">Chưa giao</option></select><button type="submit">Lọc</button>
    </Form>
    <section className="data-panel action-register"><div className="data-panel-heading"><div><p className="section-kicker">ISSUE TASK / ACTION</p><h2>Sổ theo dõi hành động</h2><p>Metadata phân loại nhập tại Finding; owner, deadline, tiến độ và bằng chứng hoàn tất cập nhật tại từng action.</p></div><span className="count-chip">{actions.length} action</span></div>
      {actionsResult.error?<div className="state-message error-state"><strong>Không thể tải action</strong><span>{actionsResult.error.message}</span></div>:!actions.length?<div className="state-message"><strong>Không có action phù hợp bộ lọc</strong></div>:<div className="action-table-wrap"><table className="action-log-table"><thead><tr><th>Finding / phân loại</th><th>Issue task / action</th><th>Người thực hiện</th><th>Deadline</th><th>Trạng thái</th><th>Tiến độ</th><th>Cập nhật gần nhất</th></tr></thead><tbody>{actions.map(a=>{
        const finding=Array.isArray(a.findings)?a.findings[0]:a.findings; const late=!!a.due_at&&!["done","cancelled"].includes(a.status)&&new Date(a.due_at).getTime()<requestNow;
        return <tr key={a.id}><td><Link href={`/findings/${a.finding_id}`}><strong>{finding?.finding_code||"FND"}</strong><span>{finding?.title||"Finding bị giới hạn"}</span><small>{finding?.primary_issue_code||"Chưa phân loại"}</small></Link></td><td><strong>{a.action_title}</strong><span>{a.description||"Chưa mô tả kết quả cần đạt"}</span></td><td>{people.get(a.assignee_id||"")||"Chưa giao"}</td><td><span className={late?"finding-late":""}>{a.due_at?new Date(a.due_at).toLocaleDateString("vi-VN"):"Chưa có"}</span></td><td><span className="status-badge">{statusLabels[a.status]||a.status}</span></td><td><strong>{a.progress_percent}%</strong></td><td>{a.last_update||"Chưa có cập nhật"}<small>{a.updated_at?new Date(a.updated_at).toLocaleString("vi-VN"):""}</small></td></tr>})}</tbody></table></div>}
    </section>
    <details className="data-panel action-notification-log"><summary><strong>Lịch sử thông báo hệ thống</strong><span>{unread} chưa đọc · {notifications.length} bản ghi</span></summary>
      <div className="notification-actions">{unread>0?<form action={markAllNotificationsRead}><button className="text-button" type="submit">Đánh dấu đã đọc hết</button></form>:null}</div>
      {notificationResult.error?<div className="state-message error-state">{notificationResult.error.message}</div>:!notifications.length?<div className="state-message">Chưa có thông báo.</div>:<div className="notification-list">{notifications.map(item=><div className={`notification-row ${item.read_at?"":"unread"}`} key={item.id}><Link href={item.deep_link?.startsWith("/")&&!item.deep_link.startsWith("//")?item.deep_link:"#"} className="notification-link"><span className="notification-type">{item.type}</span><div><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("vi-VN")}</small></div></Link>{item.read_at?<span className="notification-read-state">Đã đọc</span>:<form action={markNotificationRead}><input type="hidden" name="notification_id" value={item.id}/><button className="notification-read" type="submit">Đã đọc</button></form>}</div>)}</div>}
    </details>
  </WorkspaceShell>;
}