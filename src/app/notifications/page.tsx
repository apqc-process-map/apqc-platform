import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";
export const instant = false;

export default async function NotificationsPage() {
  const { supabase, profile } = await requireActiveAccount();
  const {data,error}=await supabase.from("notifications").select("id,type,title,body,deep_link,read_at,created_at").order("created_at",{ascending:false}).limit(100);
  return <WorkspaceShell active="/notifications" eyebrow="PERSONAL INBOX" title="Notifications" description="Thông báo review, reading, finding và due date dành riêng cho bạn." userName={profile.display_name} role={profile.role}>
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">INBOX</p><h2>{data?.filter(x=>!x.read_at).length||0} chưa đọc</h2></div><span className="count-chip">{data?.length||0} thông báo</span></div>{error?<div className="state-message error-state"><strong>Không thể tải notifications</strong><span>{error.message}</span></div>:!data?.length?<div className="state-message"><strong>Chưa có thông báo</strong><span>Review, reading assignment và findings liên quan sẽ xuất hiện tại đây.</span></div>:<div className="notification-list">{data.map(item=><a key={item.id} href={item.deep_link||"#"} className={item.read_at?"":"unread"}><span className="notification-type">{item.type}</span><div><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("vi-VN")}</small></div></a>)}</div>}</section>
  </WorkspaceShell>;
}
