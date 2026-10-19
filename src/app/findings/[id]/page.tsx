import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { addFindingComment, removeFindingParticipant, setFindingParticipant, setFindingReaction, updateFindingWorkflow } from "@/app/actions";
import { requireActiveAccount } from "@/lib/auth";

const statusLabels: Record<string, string> = {
  new: "Mới", triage: "Đang phân loại", in_progress: "Đang xử lý", pending_decision: "Chờ quyết định",
  resolved: "Đã xử lý", closed: "Đã đóng", reopened: "Mở lại",
};
const reactionLabels: Record<string, string> = {
  agree: "Đồng ý", disagree: "Không đồng ý", need_more_information: "Cần thêm thông tin",
};

function eventDescription(event: { event_type: string; from_value: unknown; to_value: unknown }) {
  const from = event.from_value as { status?: string; assignee_id?: string } | null;
  const to = event.to_value as { status?: string; assignee_id?: string } | null;
  if (event.event_type === "created") return `Tạo finding với trạng thái ${statusLabels[to?.status || ""] || to?.status || "mới"}.`;
  if (event.event_type === "status_changed") return `Chuyển từ ${statusLabels[from?.status || ""] || from?.status || "—"} sang ${statusLabels[to?.status || ""] || to?.status || "—"}.`;
  if (event.event_type === "assignment_changed") return "Thay đổi người phụ trách.";
  return event.event_type.replaceAll("_", " ");
}

export default async function FindingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireActiveAccount();
  const [{ data: finding, error }, { data: profiles }, { data: events }, { data: reactions }, { data: comments }, { data: participants }] = await Promise.all([
    supabase.from("findings").select("id,finding_code,title,description,severity,priority,status,created_by,assignee_id,due_at,resolution_summary,created_at,updated_at").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("id,display_name,role").eq("is_active", true).order("display_name"),
    supabase.from("finding_events").select("id,event_type,from_value,to_value,created_at,actor_id").eq("finding_id", id).order("created_at", { ascending: false }),
    supabase.from("finding_reactions").select("profile_id,reaction").eq("finding_id", id),
    supabase.from("comment_threads").select("id,is_resolved,comments(id,body,author_id,created_at,is_decision)").eq("context_type", "finding").eq("context_id", id),
    supabase.from("finding_participants").select("profile_id,participant_role").eq("finding_id", id),
  ]);

  if (error || !finding) return <WorkspaceShell active="/findings" eyebrow="FINDINGS & ACTIONS" title="Không tìm thấy finding" description="Bản ghi không tồn tại hoặc bạn không có quyền xem." userName={profile.display_name} role={profile.role}><Link className="text-button" href="/findings">← Quay lại Findings</Link></WorkspaceShell>;

  const profileMap = new Map((profiles || []).map((item) => [item.id, item.display_name]));
  const assignee = profileMap.get(finding.assignee_id || "") || "Chưa giao";
  const canEdit = profile.role === "admin" || (profile.role === "editor" && (finding.created_by === profile.id || finding.assignee_id === profile.id));
  const canManageParticipants = profile.role === "admin" || profile.role === "editor";
  const allStatuses = ["new", "triage", "in_progress", "pending_decision", "resolved", "closed", "reopened"];
  const editorTransitions: Record<string, string[]> = { new: ["triage", "in_progress"], triage: ["in_progress"], in_progress: ["pending_decision", "resolved"], pending_decision: ["in_progress", "resolved"], resolved: [], closed: [], reopened: ["in_progress", "resolved"] };
  const availableStatuses = profile.role === "admin" ? allStatuses : [...new Set([finding.status, ...(editorTransitions[finding.status] || [])])];

  return <WorkspaceShell active="/findings" eyebrow="FINDING DETAIL" title={finding.title} description={finding.description} userName={profile.display_name} role={profile.role}>
    <Link className="text-button" href="/findings">← Quay lại Findings</Link>
    <div className="finding-detail-grid"><section className="data-panel"><div className="data-panel-heading"><div><span className="mono-code">{finding.finding_code}</span><h2>Workflow</h2></div><span className="status-badge">{statusLabels[finding.status] || finding.status}</span></div><dl className="finding-detail-meta"><div><dt>Mức độ</dt><dd>{finding.severity}</dd></div><div><dt>Ưu tiên</dt><dd>{finding.priority}</dd></div><div><dt>Người phụ trách</dt><dd>{assignee}</dd></div><div><dt>Hạn xử lý</dt><dd>{finding.due_at ? new Date(finding.due_at).toLocaleDateString("vi-VN") : "—"}</dd></div></dl>{canEdit ? <form className="finding-workflow-form" action={updateFindingWorkflow}><input type="hidden" name="finding_id" value={finding.id}/><label>Trạng thái<select name="status" defaultValue={finding.status}>{availableStatuses.map((value) => <option key={value} value={value}>{statusLabels[value] || value}</option>)}</select></label><label>Người phụ trách<select name="assignee_id" defaultValue={finding.assignee_id || ""}><option value="">Chưa giao</option>{(profiles || []).map((item) => <option key={item.id} value={item.id}>{item.display_name} · {item.role}</option>)}</select></label><label>Tóm tắt xử lý<textarea name="resolution_summary" defaultValue={finding.resolution_summary || ""} placeholder="Bắt buộc khi đánh dấu đã xử lý hoặc đã đóng" maxLength={5000} /></label><button className="primary-button" type="submit">Lưu workflow</button></form> : <div className="state-message compact-state"><span>Bạn có quyền xem nhưng không phải người tạo hoặc người được giao finding này.</span></div>}</section>
      <aside className="legend-panel"><p className="section-kicker">COLLABORATION</p><h2>Phản hồi</h2>{Object.keys(reactionLabels).map((value) => <form className="reaction-row" action={setFindingReaction} key={value}><input type="hidden" name="finding_id" value={finding.id}/><input type="hidden" name="reaction" value={value}/><button type="submit" className="text-button">{reactionLabels[value]}</button><span>{(reactions || []).filter((item) => item.reaction === value).length}</span></form>)}</aside></div>

    <section className="data-panel participant-panel"><div className="data-panel-heading"><div><p className="section-kicker">PARTICIPANTS</p><h2>Người tham gia và theo dõi</h2></div><span className="count-chip">{participants?.length || 0} người</span></div>
      <div className="participant-list">{participants?.length ? participants.map((item) => <article key={item.profile_id}><div><strong>{profileMap.get(item.profile_id) || "Người dùng"}</strong><small>{item.participant_role === "watcher" ? "Theo dõi" : "Tham gia"}</small></div>{canManageParticipants ? <form action={removeFindingParticipant}><input type="hidden" name="finding_id" value={finding.id}/><input type="hidden" name="profile_id" value={item.profile_id}/><button className="text-button" type="submit">Xóa</button></form> : null}</article>) : <div className="state-message compact-state"><span>Chưa có participant hoặc watcher.</span></div>}</div>
      {canManageParticipants ? <form className="participant-form" action={setFindingParticipant}><input type="hidden" name="finding_id" value={finding.id}/><label>Người dùng<select name="profile_id" required defaultValue=""><option value="" disabled>Chọn người dùng</option>{(profiles || []).map((item) => <option key={item.id} value={item.id}>{item.display_name} · {item.role}</option>)}</select></label><label>Vai trò<select name="participant_role"><option value="participant">Participant</option><option value="watcher">Watcher</option></select></label><button className="primary-button" type="submit">Thêm / cập nhật</button></form> : null}
    </section>

    <section className="data-panel timeline-panel"><div className="data-panel-heading"><div><p className="section-kicker">ACTIVITY</p><h2>Dòng thời gian</h2></div><span className="count-chip">{events?.length || 0} sự kiện</span></div>{events?.length ? <div className="timeline-list">{events.map((event) => <article key={event.id}><span className="mono-code">{event.event_type.replaceAll("_", " ")}</span><p>{eventDescription(event)}</p><small>{profileMap.get(event.actor_id) || "Hệ thống"} · {event.created_at ? new Date(event.created_at).toLocaleString("vi-VN") : ""}</small></article>)}</div> : <div className="state-message"><strong>Chưa có hoạt động</strong></div>}</section>
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">COMMENTS</p><h2>{comments?.length || 0} luồng trao đổi</h2></div></div>{comments?.length ? <div className="comment-list">{comments.map((thread) => <article key={thread.id}><span className="status-badge">{thread.is_resolved ? "đã xử lý" : "đang mở"}</span>{((thread.comments as unknown as { id: string; body: string; author_id: string; created_at: string }[]) || []).map((comment) => <div key={comment.id}><p>{comment.body}</p><small>{profileMap.get(comment.author_id) || "Người dùng"} · {new Date(comment.created_at).toLocaleString("vi-VN")}</small></div>)}</article>)}</div> : <div className="state-message"><strong>Chưa có bình luận</strong><span>Người tạo, assignee hoặc participant có thể bắt đầu trao đổi.</span></div>}<form className="comment-form" action={addFindingComment}><input type="hidden" name="finding_id" value={finding.id}/><label>Thêm bình luận<textarea name="body" required maxLength={5000} placeholder="Nêu bối cảnh, câu hỏi hoặc quyết định…" /></label><button className="primary-button" type="submit">Gửi bình luận</button></form></section>
  </WorkspaceShell>;
}
