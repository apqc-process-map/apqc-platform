import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { createDocumentFinding } from "@/app/finding-actions";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

const activeStatuses = ["new","triage","in_progress","pending_decision","reopened"];
const severityLabels:Record<string,string>={critical:"Trọng yếu",high:"Cao",medium:"Trung bình",low:"Thấp"};
const issueStatuses:Record<string,string>={
  new:"Mới phát hiện",triage:"Đang xác minh",in_progress:"Đang xử lý",
  pending_decision:"Chờ quyết định",resolved:"Đã xử lý",closed:"Đã đóng",reopened:"Mở lại"
};
const topicCodes=[
  "exact_duplicate","semantic_duplicate","scope_overlap","potential_conflict",
  "version_conflict","effective_date_conflict","relationship_conflict","supersession_candidate","other"
];
type DocumentRow={id:string;document_id:string;title_vi:string;version_number:number;documents:{document_code:string}|null};
type ActionRow={id:string;finding_id:string;status:string;progress_percent:number;due_at:string|null;assignee_id:string|null};
type FindingLink={id:string;finding_id:string;object_type:string;object_id:string;link_role:string};
const displayDate=(date:string|null|undefined)=>date?new Date(date).toLocaleDateString("vi-VN"):"Chưa có";
const overdue=(date:string|null|undefined)=>!!date&&new Date(date).getTime()<Date.now();

export default async function FindingsPage({searchParams}:{
  searchParams:Promise<{status?:string;severity?:string;assigned?:string;type?:string}>
}) {
  const {status="all",severity="all",assigned="all",type="all"}=await searchParams;
  const {supabase,profile}=await requireActiveAccount();
  const canWrite=profile.role==="admin"||profile.role==="editor";
  let query=supabase.from("findings").select(
    "id,finding_code,title,description,impact_summary,finding_domain,action_decision,action_decision_reason,finding_type_value_id,severity,priority,status,due_at,assignee_id,created_at"
  ).eq("finding_domain","document").order("created_at",{ascending:false}).limit(200);
  if(status==="open")query=query.in("status",activeStatuses);
  else if(status!=="all")query=query.eq("status",status);
  if(severity!=="all")query=query.eq("severity",severity);
  if(assigned==="me")query=query.eq("assignee_id",profile.id);
  if(assigned==="unassigned")query=query.is("assignee_id",null);
  const [findingsResult,allDocuments,typesResult,peopleResult] = await Promise.all([
    query,
    canWrite ? supabase.from("document_versions").select("id,title_vi,version_number,documents(document_code)")
      .order("updated_at",{ascending:false}).limit(200) : Promise.resolve({data:[],error:null}),
    supabase.from("vocabulary_values").select("id,code,label_vi,vocabularies!inner(code)")
      .eq("vocabularies.code","finding_type").eq("is_active",true).order("display_order"),
    supabase.from("profiles").select("id,display_name,role").eq("is_active",true).order("display_name")
  ]);
  const findings=(findingsResult.data||[]);
  const findingIds=findings.map(x=>x.id);
  const [linksResult,actionsResult]=await Promise.all([
    findingIds.length?supabase.from("finding_links").select("id,finding_id,object_type,object_id,link_role")
      .in("finding_id",findingIds).eq("object_type","document_version").eq("link_role","subject"):
      Promise.resolve({data:[],error:null}),
    findingIds.length?supabase.from("finding_actions").select("id,finding_id,status,progress_percent,due_at,assignee_id")
      .in("finding_id",findingIds):Promise.resolve({data:[],error:null})
  ]);
  const links=(linksResult.data||[]) as FindingLink[];
  const actions=(actionsResult.data||[]) as ActionRow[];
  const relevantDocs=[...new Set(links.map(l=>l.object_id))];
  const linkedDocuments=relevantDocs.length?await supabase.from("document_versions")
    .select("id,document_id,title_vi,version_number,documents(document_code)").in("id",relevantDocs):{data:[]};
  const docMap=new Map(((linkedDocuments.data||[]) as unknown as DocumentRow[]).map(doc=>[doc.id,doc]));
  const types=(typesResult.data||[]) as {id:string;code:string;label_vi:string}[];
  const typeMap=new Map(types.map(t=>[t.id,t]));
  const people=(peopleResult.data||[]) as {id:string;display_name:string;role:string}[];
  const peopleMap=new Map(people.map(p=>[p.id,p.display_name]));
  // A valid issue must compare at least two DISTINCT documents, not merely two versions of one document.
  // Count only linked document versions visible under the caller's existing Supabase RLS.
  const crossDocumentFindings=findings.filter(f=>{
    const distinct=new Set(links.filter(l=>l.finding_id===f.id)
      .map(l=>docMap.get(l.object_id)?.document_id).filter((id):id is string=>!!id));
    return distinct.size>=2;
  });
  const filtered=type==="all"?crossDocumentFindings:crossDocumentFindings.filter(f=>typeMap.get(f.finding_type_value_id||"")?.code===type);
  const active=filtered.filter(f=>activeStatuses.includes(f.status));
  const activeActionIds=new Set(active.map(f=>f.id));
  const currentActions=actions.filter(a=>activeActionIds.has(a.finding_id)&&a.status!=="cancelled");
  const delayed=currentActions.filter(a=>a.status!=="done"&&overdue(a.due_at)).length;
  const decisionPending=active.filter(f=>f.action_decision==="pending").length;
  const allowedTypes=types.filter(t=>topicCodes.includes(t.code));
  const createDocs=(allDocuments.data||[]) as unknown as DocumentRow[];

  return <WorkspaceShell active="/findings" eyebrow="06 · DOCUMENT FINDINGS & ACTIONS"
    title="Finding & Action" description="Phát hiện trùng lặp, chồng chéo và xung đột giữa các tài liệu; gắn bằng chứng, giao việc và theo dõi kết quả."
    userName={profile.display_name} role={profile.role}>
    <div className="relationship-summary finding-dashboard-links">
      <div><span>Vấn đề đang mở</span><strong>{active.length}</strong></div>
      <div><span>Chưa quyết định action</span><strong>{decisionPending}</strong></div>
      <div><span>Action đang thực hiện</span><strong>{currentActions.filter(a=>!["done","cancelled"].includes(a.status)).length}</strong></div>
      <div><span>Action quá hạn</span><strong>{delayed}</strong></div>
    </div>
    <p className="finding-disclaimer">Finding được ghi nhận và đánh giá thủ công; chưa có chức năng tự động phát hiện xung đột nội dung bằng AI. Số liệu phản ánh các bản ghi người dùng có quyền xem.</p>
    {canWrite&&<details className="data-panel document-finding-intake">
      <summary><strong>+ Ghi nhận finding về tài liệu</strong><span>Tạo issue có dẫn chứng và liên kết 2 hoặc nhiều tài liệu</span></summary>
      <form action={createDocumentFinding} className="finding-create-grid">
        <label className="finding-full">Tên vấn đề<input name="title" required maxLength={220} placeholder="Ví dụ: Hai chính sách áp dụng mức phí khác nhau cho cùng dịch vụ"/></label>
        <label>Loại vấn đề<select name="type_code" required defaultValue="potential_conflict">
          {allowedTypes.map(t=><option key={t.id} value={t.code}>{t.label_vi}</option>)}
        </select></label>
        <label>Mức độ ảnh hưởng<select name="severity" defaultValue="medium">{Object.entries(severityLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label>Ưu tiên<select name="priority" defaultValue="medium"><option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="urgent">Khẩn cấp</option></select></label>
        <label>Giao người phụ trách<select name="assignee_id" defaultValue=""><option value="">Chưa giao</option>{people.filter(p=>p.role==="admin"||p.role==="editor").map(p=><option value={p.id} key={p.id}>{p.display_name}</option>)}</select></label>
        <label className="finding-full">Mô tả vấn đề / nội dung khác nhau<textarea name="description" rows={3} maxLength={5000} required placeholder="Văn bản A quy định…, trong khi văn bản B quy định…; phạm vi trùng tại…"/></label>
        <label className="finding-full">Ảnh hưởng vận hành (nếu có)<textarea name="impact_summary" rows={2} maxLength={2000} placeholder="Ví dụ: cửa hàng có thể áp dụng mức phí không thống nhất"/></label>
        <fieldset className="finding-full finding-doc-picker"><legend>Tài liệu liên quan · chọn ít nhất 2 tài liệu khác nhau</legend>
          <div className="finding-doc-options">{createDocs.length?createDocs.map(doc=><label key={doc.id}><input type="checkbox" name="document_version_id" value={doc.id}/><span><strong>{doc.documents?.document_code||"DOC"}</strong> · {doc.title_vi} · v{doc.version_number}</span></label>):<p>Chưa có phiên bản tài liệu bạn được phép chọn.</p>}</div>
          <small>Chỉ ghi nhận vấn đề phát sinh giữa ít nhất 2 tài liệu khác nhau. Hai phiên bản của cùng một tài liệu không được tính là 2 tài liệu.</small>
        </fieldset>
        <label className="finding-full">Dẫn chứng / vị trí điều khoản<textarea name="evidence_excerpt" rows={2} maxLength={2000} placeholder="Ví dụ: Điều 4.2 của tài liệu A so với Mục III tài liệu B"/></label>
        <label>Hạn xử lý (tùy chọn)<input type="date" name="due_at"/></label>
        <div className="finding-full"><button className="primary-button" type="submit">Tạo finding & liên kết tài liệu</button></div>
      </form>
    </details>}

    <div className="finding-view-row">
      <div><strong>Danh sách vấn đề giữa các tài liệu</strong><p>Chỉ hiển thị finding liên quan ít nhất 2 tài liệu khác nhau; dữ liệu finding chung cũ được giữ lại ngoài danh sách này.</p></div>
    </div>
    <form className="catalog-toolbar finding-filter-toolbar">
      <select name="status" defaultValue={status} aria-label="Trạng thái finding"><option value="all">Tất cả trạng thái</option><option value="open">Đang mở</option>{Object.entries(issueStatuses).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select>
      <select name="type" defaultValue={type} aria-label="Loại finding"><option value="all">Mọi loại vấn đề</option>{allowedTypes.map(t=><option key={t.code} value={t.code}>{t.label_vi}</option>)}</select>
      <select name="severity" defaultValue={severity} aria-label="Mức độ"><option value="all">Mọi mức độ</option>{Object.entries(severityLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <select name="assigned" defaultValue={assigned} aria-label="Người phụ trách"><option value="all">Mọi người phụ trách</option><option value="me">Được giao cho tôi</option><option value="unassigned">Chưa giao</option></select>
      <button type="submit">Lọc</button>
    </form>
    <section className="data-panel">
      <div className="data-panel-heading"><div><p className="section-kicker">ISSUE REGISTER</p><h2>{filtered.length} finding</h2></div><span className="count-chip">Issue → Action → Kết quả</span></div>
      {findingsResult.error?<div className="state-message error-state"><strong>Không thể tải findings</strong><span>{findingsResult.error.message}</span></div>:
      !filtered.length?<div className="state-message"><strong>Chưa ghi nhận finding về tài liệu phù hợp</strong><span>Chưa có vấn đề đối chiếu từ 2 tài liệu trở lên phù hợp bộ lọc. Đây không phải kết luận tài liệu không có xung đột.</span></div>:
      <div className="finding-issue-list">{filtered.map(f=>{
        const docs=links.filter(l=>l.finding_id===f.id).map(l=>docMap.get(l.object_id)).filter((d):d is DocumentRow=>!!d);
        const itsActions=actions.filter(a=>a.finding_id===f.id && a.status!=="cancelled");
        const completed=itsActions.filter(a=>a.status==="done").length;
        const progress=itsActions.length?Math.round(itsActions.reduce((sum,a)=>sum+a.progress_percent,0)/itsActions.length):0;
        const typeName=typeMap.get(f.finding_type_value_id||"")?.label_vi||"Chưa phân loại";
        const actionText=f.action_decision==="pending"?"Chưa quyết định action":
          f.action_decision==="not_required"?"Không cần action":
          itsActions.length?completed+"/"+itsActions.length+" action hoàn tất":"Cần tạo action";
        return <article key={f.id} className="finding-issue-card">
          <div className="finding-issue-head"><div><span className="mono-code">{f.finding_code}</span> <span className="status-badge">{issueStatuses[f.status]||f.status}</span><h3><Link href={"/findings/"+f.id}>{f.title}</Link></h3></div><span className={"finding-severity-pill finding-severity-"+f.severity}>{severityLabels[f.severity]||f.severity}</span></div>
          <p>{f.description}</p>
          <div className="finding-issue-type">{typeName}</div>
          {!!f.impact_summary&&<p className="finding-impact"><strong>Tác động:</strong> {f.impact_summary}</p>}
          <div className="finding-related-documents"><strong>Tài liệu liên quan ({docs.length})</strong>{docs.length?<div>{docs.map(d=><Link key={d.id} href={"/documents?compare="+d.id}>{d.documents?.document_code||"DOC"} · {d.title_vi} · v{d.version_number}</Link>)}</div>:<small>Không tìm thấy tài liệu được phép xem</small>}</div>
          <div className="finding-action-bar">
            <div><small>Action / kết quả xử lý</small><strong>{actionText}</strong>{itsActions.length>0&&<div className="finding-progress-track" role="progressbar" aria-label="Tiến độ action" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{width:progress+"%"}}/></div>}</div>
            <div><small>Người phụ trách</small><strong>{peopleMap.get(f.assignee_id||"")||"Chưa giao"}</strong></div>
            <div><small>Hạn finding</small><strong>{displayDate(f.due_at)}</strong></div>
            <Link className="text-button" href={"/findings/"+f.id}>Xem issue & action →</Link>
          </div>
        </article>;
      })}</div>}
      {(linksResult.error||actionsResult.error)&&<p className="state-message error-state">Không thể tải đầy đủ liên kết tài liệu hoặc action. Vui lòng thử lại.</p>}
    </section>
  </WorkspaceShell>;
}
