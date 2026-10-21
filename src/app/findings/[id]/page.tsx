import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { addFindingComment, removeFindingParticipant, setFindingParticipant, setFindingReaction, updateFindingWorkflow } from "@/app/actions";
import { requireActiveAccount } from "@/lib/auth";
import { addFindingDocumentEvidence, createFindingAction, saveDocumentFindingDecision, updateFindingAction } from "@/app/finding-actions";

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
    supabase.from("findings").select("id,finding_code,title,description,severity,priority,status,created_by,assignee_id,due_at,resolution_summary,created_at,updated_at,finding_domain,action_decision,action_decision_reason,impact_summary,finding_type_value_id").eq("id", id).maybeSingle(),
    supabase.from("profiles").select("id,display_name,role").eq("is_active", true).order("display_name"),
    supabase.from("finding_events").select("id,event_type,from_value,to_value,created_at,actor_id").eq("finding_id", id).order("created_at", { ascending: false }),
    supabase.from("finding_reactions").select("profile_id,reaction").eq("finding_id", id),
    supabase.from("comment_threads").select("id,is_resolved,comments(id,body,author_id,created_at,is_decision)").eq("context_type", "finding").eq("context_id", id),
    supabase.from("finding_participants").select("profile_id,participant_role").eq("finding_id", id),
  ]);

  if (error || !finding) return <WorkspaceShell active="/findings" eyebrow="FINDINGS & ACTIONS" title="Không tìm thấy finding" description="Bản ghi không tồn tại hoặc bạn không có quyền xem." userName={profile.display_name} role={profile.role}><Link className="text-button" href="/findings">← Quay lại Findings</Link></WorkspaceShell>;

  const isDocumentFinding=finding.finding_domain==="document";
  const [actionResponse,linkResponse,versionsResponse,issueTypeResponse]=await Promise.all([
    isDocumentFinding?supabase.from("finding_actions")
      .select("id,action_title,description,assignee_id,due_at,status,progress_percent,last_update,completion_evidence,updated_at")
      .eq("finding_id",id).order("created_at",{ascending:true}):Promise.resolve({data:[],error:null}),
    isDocumentFinding?supabase.from("finding_links")
      .select("id,object_id,object_type,link_role,evidence_excerpt").eq("finding_id",id)
      .eq("object_type","document_version").order("created_at",{ascending:true}):Promise.resolve({data:[],error:null}),
    isDocumentFinding?supabase.from("document_versions").select("id,version_number,title_vi,valid_from,valid_until,status,documents(document_code)")
      .order("updated_at",{ascending:false}).limit(200):Promise.resolve({data:[],error:null}),
    finding.finding_type_value_id?supabase.from("vocabulary_values").select("label_vi")
      .eq("id",finding.finding_type_value_id).maybeSingle():Promise.resolve({data:null,error:null})
  ]);
  type DocumentMeta={id:string;title_vi:string;version_number:number;status:string;valid_from:string|null;valid_until:string|null;documents:{document_code:string}|null};
  const documentVersions=(versionsResponse.data||[]) as unknown as DocumentMeta[];
  const documentMap=new Map(documentVersions.map(d=>[d.id,d]));
  const linkedDocuments=(linkResponse.data||[]);
  const correctiveActions=actionResponse.data||[];
  const finishedActions=correctiveActions.filter(a=>a.status==="done").length;
  const activeActions=correctiveActions.filter(a=>a.status!=="cancelled");
  const overallProgress=activeActions.length?Math.round(activeActions.reduce((t,a)=>t+a.progress_percent,0)/activeActions.length):0;
  const actionStatusLabels:Record<string,string>={todo:"Chưa bắt đầu",in_progress:"Đang làm",blocked:"Vướng mắc",done:"Hoàn thành",cancelled:"Đã hủy"};
  const findType=issueTypeResponse.data?.label_vi||"Chưa phân loại";
  const formatDate=(date:string|null)=>date?new Date(date).toLocaleDateString("vi-VN"):"Chưa có";

  const profileMap = new Map((profiles || []).map((item) => [item.id, item.display_name]));
  const assignee = profileMap.get(finding.assignee_id || "") || "Chưa giao";
  const canEdit = profile.role === "admin" || (profile.role === "editor" && (finding.created_by === profile.id || finding.assignee_id === profile.id));
  const canManageParticipants = profile.role === "admin" || profile.role === "editor";
  const allStatuses = ["new", "triage", "in_progress", "pending_decision", "resolved", "closed", "reopened"];
  const editorTransitions: Record<string, string[]> = { new: ["triage", "in_progress"], triage: ["in_progress"], in_progress: ["pending_decision", "resolved"], pending_decision: ["in_progress", "resolved"], resolved: [], closed: [], reopened: ["in_progress", "resolved"] };
  const availableStatuses = profile.role === "admin" ? allStatuses : [...new Set([finding.status, ...(editorTransitions[finding.status] || [])])];

  return <WorkspaceShell active="/findings" eyebrow="FINDING DETAIL" title={finding.title} description={finding.description} userName={profile.display_name} role={profile.role}>
    <Link className="text-button" href="/findings">← Quay lại Findings</Link>
    {isDocumentFinding&&<>
      <section className="data-panel finding-document-evidence">
        <div className="data-panel-heading"><div><p className="section-kicker">DOCUMENT EVIDENCE</p>
          <h2>Tài liệu liên quan & nội dung xung đột</h2>
          <p>Phân loại: {findType} · Đối chiếu chính xác từng phiên bản, ngày hiệu lực và điều khoản liên quan.</p>
        </div><span className="count-chip">{linkedDocuments.length} liên kết</span></div>
        {finding.impact_summary&&<p className="finding-impact"><strong>Hệ quả vận hành:</strong> {finding.impact_summary}</p>}
        {linkedDocuments.length?<div className="finding-evidence-list">{linkedDocuments.map((link)=>{
          const doc=documentMap.get(link.object_id);
          return <article key={link.id}>
            <div><strong>{doc?.documents?.document_code||"Tài liệu bị giới hạn quyền xem"}</strong>
              <span>{doc?.title_vi||"Không thể truy cập phiên bản tài liệu này"}{doc?" · v"+doc.version_number:""}</span>
              {doc&&<small>Trạng thái: {doc.status} · Hiệu lực: {formatDate(doc.valid_from)} – {formatDate(doc.valid_until)}</small>}
              {doc&&<Link href={"/documents?compare="+doc.id}>Mở thông tin tài liệu →</Link>}
            </div>
            <div><strong>Điều khoản / bằng chứng</strong>
              <p>{link.evidence_excerpt||"Chưa bổ sung trích dẫn hoặc điểm mâu thuẫn cụ thể."}</p>
              {canEdit&&doc&&<form action={addFindingDocumentEvidence} className="finding-evidence-edit">
                <input type="hidden" name="finding_id" value={finding.id}/>
                <input type="hidden" name="document_version_id" value={doc.id}/>
                <textarea name="evidence_excerpt" rows={2} maxLength={2000} defaultValue={link.evidence_excerpt||""} placeholder="Điều, mục, nội dung khác biệt so với tài liệu còn lại"/>
                <button type="submit" className="text-button">Lưu dẫn chứng</button>
              </form>}
            </div>
          </article>;
        })}</div>:<p className="state-message">Finding chưa có tài liệu nào được liên kết.</p>}
        {canEdit&&<details className="finding-add-link"><summary>+ Liên kết thêm tài liệu / phiên bản</summary>
          <form action={addFindingDocumentEvidence}>
            <input type="hidden" name="finding_id" value={finding.id}/>
            <label>Phiên bản<select required name="document_version_id" defaultValue="">
              <option value="" disabled>Chọn tài liệu</option>
              {documentVersions.map(doc=><option key={doc.id} value={doc.id}>{doc.documents?.document_code||"DOC"} · {doc.title_vi} · v{doc.version_number}</option>)}
            </select></label>
            <label>Dẫn chứng<textarea name="evidence_excerpt" rows={2} maxLength={2000} placeholder="Điều khoản hoặc nội dung cần đối chiếu"/></label>
            <button className="primary-button" type="submit">Lưu liên kết</button>
          </form>
        </details>}
      </section>
      <section className="data-panel finding-action-dashboard">
        <div className="data-panel-heading"><div><p className="section-kicker">ISSUE → ACTION DECISION</p><h2>Quyết định xử lý & trách nhiệm</h2>
          <p>Mỗi finding cần xác định: phải hành động, không cần hành động (có lý do), hoặc còn chờ đánh giá.</p>
        </div><span className="count-chip">{finding.action_decision==="required"?"Cần thực hiện":finding.action_decision==="not_required"?"Không cần action":"Chờ quyết định"}</span></div>
        {canEdit?<form action={saveDocumentFindingDecision} className="finding-decision-form">
          <input type="hidden" name="finding_id" value={finding.id}/>
          <label>Kết luận action<select name="action_decision" defaultValue={finding.action_decision}>
            <option value="pending">Chưa quyết định</option>
            <option value="required">Cần action khắc phục</option>
            <option value="not_required">Không cần action</option>
          </select></label>
          <label className="finding-full">Lý do quyết định / cơ sở không cần action
            <textarea name="action_decision_reason" rows={2} maxLength={2000} defaultValue={finding.action_decision_reason||""} placeholder="Bắt buộc giải thích nếu không cần action"/>
          </label>
          <label className="finding-full">Tác động vận hành
            <textarea name="impact_summary" rows={2} maxLength={2000} defaultValue={finding.impact_summary||""} placeholder="Rủi ro thực hiện sai, xung đột thông tin, khó xác định hiệu lực…"/>
          </label>
          <button className="primary-button" type="submit">Lưu kết luận</button>
        </form>:<p>{finding.action_decision_reason||"Chưa có lý do quyết định."}</p>}
      </section>
      <section className="data-panel finding-action-dashboard">
        <div className="data-panel-heading"><div><p className="section-kicker">CORRECTIVE ACTION TRACKER</p>
          <h2>Tiến độ khắc phục</h2><p>Mỗi action có owner, hạn, trạng thái, % hoàn thành và bằng chứng đóng.</p>
        </div><span className="count-chip">{finishedActions}/{correctiveActions.length} hoàn thành</span></div>
        <div className="finding-progress-header"><strong>{overallProgress}%</strong><span>Tiến độ trung bình của action đang có hiệu lực</span></div>
        <div className="finding-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overallProgress}><span style={{width:overallProgress+"%"}}/></div>
        {!correctiveActions.length?<div className="state-message"><strong>Chưa có action</strong>
          <span>{finding.action_decision==="not_required"?"Finding đã được kết luận không cần action.":finding.action_decision==="pending"?"Hãy xác định có cần action hay không.":"Finding cần action nhưng chưa có đầu việc được giao."}</span>
        </div>:<div className="finding-action-list">{correctiveActions.map(action=>{
          const due=action.due_at;
          const isLate=!!due&&action.status!=="done"&&action.status!=="cancelled"&&new Date(due).getTime()<Date.now();
          return <article key={action.id} className="finding-action-item">
            <div className="finding-action-title"><h3>{action.action_title}</h3><span className="status-badge">{actionStatusLabels[action.status]||action.status}</span>{isLate&&<span className="finding-late">Quá hạn</span>}</div>
            {action.description&&<p>{action.description}</p>}
            <dl><div><dt>Người thực hiện</dt><dd>{profileMap.get(action.assignee_id||"")||"Chưa giao"}</dd></div>
              <div><dt>Hạn hoàn tất</dt><dd>{formatDate(action.due_at)}</dd></div>
              <div><dt>Tiến độ</dt><dd>{action.progress_percent}%</dd></div>
              <div><dt>Cập nhật lần cuối</dt><dd>{formatDate(action.updated_at)}</dd></div></dl>
            <div className="finding-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={action.progress_percent}><span style={{width:action.progress_percent+"%"}}/></div>
            {action.last_update&&<p><strong>Cập nhật:</strong> {action.last_update}</p>}
            {action.completion_evidence&&<p><strong>Kết quả / bằng chứng:</strong> {action.completion_evidence}</p>}
            {canEdit&&<details className="finding-action-edit"><summary>Cập nhật action</summary>
              <form action={updateFindingAction} className="finding-action-fields">
                <input name="finding_id" type="hidden" value={finding.id}/><input name="action_id" type="hidden" value={action.id}/>
                <label>Trạng thái<select name="status" defaultValue={action.status}>{Object.entries(actionStatusLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
                <label>Tiến độ (%)<input type="number" name="progress_percent" min="0" max="100" defaultValue={action.progress_percent}/></label>
                <label>Người thực hiện<select name="assignee_id" defaultValue={action.assignee_id||""}><option value="">Chưa giao</option>{(profiles||[]).filter(x=>x.role==="editor"||x.role==="admin").map(p=><option value={p.id} key={p.id}>{p.display_name}</option>)}</select></label>
                <label>Hạn hoàn tất<input type="date" name="due_at" defaultValue={action.due_at||""}/></label>
                <label className="finding-full">Cập nhật tiến độ / lý do vướng mắc<textarea name="last_update" rows={2} maxLength={3000} defaultValue={action.last_update||""}/></label>
                <label className="finding-full">Kết quả / dẫn chứng đóng action<textarea name="completion_evidence" rows={2} maxLength={3000} defaultValue={action.completion_evidence||""} placeholder="Bắt buộc khi hoàn thành action"/></label>
                <button className="primary-button" type="submit">Lưu tiến độ</button>
              </form>
            </details>}
          </article>;
        })}</div>}
        {canEdit&&<details className="finding-add-link"><summary>+ Tạo action khắc phục</summary>
          <form action={createFindingAction} className="finding-action-fields">
            <input name="finding_id" type="hidden" value={finding.id}/>
            <label className="finding-full">Nội dung công việc<input name="action_title" required maxLength={300} placeholder="Ví dụ: Hợp nhất quy định tính phí trong hai tài liệu"/></label>
            <label className="finding-full">Kết quả cần đạt<textarea name="description" rows={2} maxLength={3000} placeholder="Mô tả đầu ra và tiêu chí nghiệm thu"/></label>
            <label>Người thực hiện<select name="assignee_id" defaultValue=""><option value="">Chưa giao</option>{(profiles||[]).filter(x=>x.role==="editor"||x.role==="admin").map(p=><option value={p.id} key={p.id}>{p.display_name}</option>)}</select></label>
            <label>Deadline<input type="date" name="due_at"/></label>
            <button className="primary-button" type="submit">Thêm action</button>
          </form>
        </details>}
        <p className="form-note">Finding tài liệu chỉ được đánh dấu Đã xử lý/Đã đóng sau khi đã có quyết định action và tất cả action bắt buộc hoàn tất.</p>
      </section>
    </>}

    <div className="finding-detail-grid"><section className="data-panel"><div className="data-panel-heading"><div><span className="mono-code">{finding.finding_code}</span><h2>Workflow</h2></div><span className="status-badge">{statusLabels[finding.status] || finding.status}</span></div><dl className="finding-detail-meta"><div><dt>Mức độ</dt><dd>{finding.severity}</dd></div><div><dt>Ưu tiên</dt><dd>{finding.priority}</dd></div><div><dt>Người phụ trách</dt><dd>{assignee}</dd></div><div><dt>Hạn xử lý</dt><dd>{finding.due_at ? new Date(finding.due_at).toLocaleDateString("vi-VN") : "—"}</dd></div></dl>{canEdit ? <form className="finding-workflow-form" action={updateFindingWorkflow}><input type="hidden" name="finding_id" value={finding.id}/><label>Trạng thái<select name="status" defaultValue={finding.status}>{availableStatuses.map((value) => <option key={value} value={value}>{statusLabels[value] || value}</option>)}</select></label><label>Người phụ trách<select name="assignee_id" defaultValue={finding.assignee_id || ""}><option value="">Chưa giao</option>{(profiles || []).map((item) => <option key={item.id} value={item.id}>{item.display_name} · {item.role}</option>)}</select></label><label>Hạn xử lý finding<input type="date" name="due_at" defaultValue={finding.due_at?.slice(0,10)||""}/></label><label>Tóm tắt xử lý<textarea name="resolution_summary" defaultValue={finding.resolution_summary || ""} placeholder="Bắt buộc khi đánh dấu đã xử lý hoặc đã đóng" maxLength={5000} /></label><button className="primary-button" type="submit">Lưu workflow</button></form> : <div className="state-message compact-state"><span>Bạn có quyền xem nhưng không phải người tạo hoặc người được giao finding này.</span></div>}</section>
      <aside className="legend-panel"><p className="section-kicker">COLLABORATION</p><h2>Phản hồi</h2>{Object.keys(reactionLabels).map((value) => <form className="reaction-row" action={setFindingReaction} key={value}><input type="hidden" name="finding_id" value={finding.id}/><input type="hidden" name="reaction" value={value}/><button type="submit" className="text-button">{reactionLabels[value]}</button><span>{(reactions || []).filter((item) => item.reaction === value).length}</span></form>)}</aside></div>

    <section className="data-panel participant-panel"><div className="data-panel-heading"><div><p className="section-kicker">PARTICIPANTS</p><h2>Người tham gia và theo dõi</h2></div><span className="count-chip">{participants?.length || 0} người</span></div>
      <div className="participant-list">{participants?.length ? participants.map((item) => <article key={item.profile_id}><div><strong>{profileMap.get(item.profile_id) || "Người dùng"}</strong><small>{item.participant_role === "watcher" ? "Theo dõi" : "Tham gia"}</small></div>{canManageParticipants ? <form action={removeFindingParticipant}><input type="hidden" name="finding_id" value={finding.id}/><input type="hidden" name="profile_id" value={item.profile_id}/><button className="text-button" type="submit">Xóa</button></form> : null}</article>) : <div className="state-message compact-state"><span>Chưa có participant hoặc watcher.</span></div>}</div>
      {canManageParticipants ? <form className="participant-form" action={setFindingParticipant}><input type="hidden" name="finding_id" value={finding.id}/><label>Người dùng<select name="profile_id" required defaultValue=""><option value="" disabled>Chọn người dùng</option>{(profiles || []).map((item) => <option key={item.id} value={item.id}>{item.display_name} · {item.role}</option>)}</select></label><label>Vai trò<select name="participant_role"><option value="participant">Participant</option><option value="watcher">Watcher</option></select></label><button className="primary-button" type="submit">Thêm / cập nhật</button></form> : null}
    </section>

    <section className="data-panel timeline-panel"><div className="data-panel-heading"><div><p className="section-kicker">ACTIVITY</p><h2>Dòng thời gian</h2></div><span className="count-chip">{events?.length || 0} sự kiện</span></div>{events?.length ? <div className="timeline-list">{events.map((event) => <article key={event.id}><span className="mono-code">{event.event_type.replaceAll("_", " ")}</span><p>{eventDescription(event)}</p><small>{profileMap.get(event.actor_id) || "Hệ thống"} · {event.created_at ? new Date(event.created_at).toLocaleString("vi-VN") : ""}</small></article>)}</div> : <div className="state-message"><strong>Chưa có hoạt động</strong></div>}</section>
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">COMMENTS</p><h2>{comments?.length || 0} luồng trao đổi</h2></div></div>{comments?.length ? <div className="comment-list">{comments.map((thread) => <article key={thread.id}><span className="status-badge">{thread.is_resolved ? "đã xử lý" : "đang mở"}</span>{((thread.comments as unknown as { id: string; body: string; author_id: string; created_at: string }[]) || []).map((comment) => <div key={comment.id}><p>{comment.body}</p><small>{profileMap.get(comment.author_id) || "Người dùng"} · {new Date(comment.created_at).toLocaleString("vi-VN")}</small></div>)}</article>)}</div> : <div className="state-message"><strong>Chưa có bình luận</strong><span>Người tạo, assignee hoặc participant có thể bắt đầu trao đổi.</span></div>}<form className="comment-form" action={addFindingComment}><input type="hidden" name="finding_id" value={finding.id}/><label>Thêm bình luận<textarea name="body" required maxLength={5000} placeholder="Nêu bối cảnh, câu hỏi hoặc quyết định…" /></label><button className="primary-button" type="submit">Gửi bình luận</button></form></section>
  </WorkspaceShell>;
}
