import WorkspaceShell from "@/components/workspace-shell";
import { markAllNotificationsRead, markNotificationRead } from "@/app/actions";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

export default async function NotificationsPage() {
  const { supabase, profile } = await requireActiveAccount();
  const { data, error } = await supabase
    .from("notifications")
    .select("id,type,title,body,deep_link,read_at,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const unreadCount = data?.filter((item) => !item.read_at).length || 0;

  return <WorkspaceShell active="/notifications" eyebrow="PERSONAL INBOX" title="Notifications" description="Thông báo review, reading, finding và due date dành riêng cho bạn." userName={profile.display_name} role={profile.role}>
    <section className="data-panel">
      <div className="data-panel-heading">
        <div><p className="section-kicker">INBOX</p><h2>{unreadCount} chưa đọc</h2></div>
        <div className="notification-actions"><span className="count-chip">{data?.length || 0} thông báo</span>{unreadCount > 0 ? <form action={markAllNotificationsRead}><button className="text-button" type="submit">Đánh dấu đã đọc hết</button></form> : null}</div>
      </div>
      {error ? <div className="state-message error-state"><strong>Không thể tải notifications</strong><span>{error.message}</span></div> : !data?.length ? <div className="state-message"><strong>Chưa có thông báo</strong><span>Review, reading assignment và findings liên quan sẽ xuất hiện tại đây.</span></div> : <div className="notification-list">{data.map((item) => <div className={`notification-row ${item.read_at ? "" : "unread"}`} key={item.id}>
        <a href={item.deep_link || "#"} className="notification-link"><span className="notification-type">{item.type}</span><div><strong>{item.title}</strong><p>{item.body}</p><small>{new Date(item.created_at).toLocaleString("vi-VN")}</small></div></a>
        {item.read_at ? <span className="notification-read-state">Đã đọc</span> : <form action={markNotificationRead}><input type="hidden" name="notification_id" value={item.id} /><button className="notification-read" type="submit">Đã đọc</button></form>}
      </div>)}</div>}
    </section>
  </WorkspaceShell>;
}