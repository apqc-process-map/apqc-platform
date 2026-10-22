import { noteSlowPage } from "@/lib/page-perf";
import Form from "next/form";
import WorkspaceShell from "@/components/workspace-shell";
import { createDocumentFinding } from "@/app/finding-actions";
import { requireActiveAccount } from "@/lib/auth";
import IssueClassifier,{type IssueTaxonomyItem} from "@/components/issue-classifier";
import FindingIssueMatrix,{type MatrixDocument,type MatrixEvidence,type MatrixFinding,type MatrixProcess} from "@/components/finding-issue-matrix";

export const instant = false;

const activeStatuses = ["new","triage","in_progress","pending_decision","reopened"];
const severityLabels:Record<string,string>={critical:"Trọng yếu",high:"Cao",medium:"Trung bình",low:"Thấp"};
const issueStatuses:Record<string,string>={
  new:"Mới phát hiện",triage:"Đang xác minh",in_progress:"Đang xử lý",
  pending_decision:"Chờ quyết định",resolved:"Đã xử lý",closed:"Đã đóng",reopened:"Mở lại"
};
type DocumentRow={id:string;document_id:string;title_vi:string;version_number:number;issuing_department:string|null;valid_from:string|null;vocabulary_values:{label_vi:string}|null;documents:{document_code:string}|null};
type ProcessRow={id:string;name_vi:string;level_type:string;enterprise_processes:{process_code:string}|null};
type ActionRow={id:string;finding_id:string;status:string;progress_percent:number;due_at:string|null;assignee_id:string|null};
type FindingLink={id:string;finding_id:string;object_type:string;object_id:string;link_role:string;evidence_excerpt:string|null};
type SourceEvidenceRow={finding_id:string;source_ref:number;evidence_excerpt:string};
const overdue=(date:string|null|undefined)=>!!date&&new Date(date).getTime()<Date.now();

export default async function FindingsPage({searchParams}:{
  searchParams:Promise<{status?:string;severity?:string;assigned?:string;type?:string}>
}) {
  const {status="all",severity="all",assigned="all",type="all"}=await searchParams;
  const {supabase,profile}=await requireActiveAccount();
  // Safe, post-response timing with no user or document identifiers.
  noteSlowPage("/findings", performance.now());
  const canWrite=profile.role==="admin"||profile.role==="editor";
  let query=supabase.from("findings").select(
    "id,finding_code,title,description,impact_summary,finding_domain,action_decision,action_decision_reason,finding_type_value_id,primary_issue_code,severity,priority,status,due_at,assignee_id,created_at,decision_point,evidence_status,proposed_action,owner_question,process_owner_feedback"
  ).eq("finding_domain","document").order("created_at",{ascending:false}).limit(200);
  if(status==="open")query=query.in("status",activeStatuses);
  else if(status!=="all")query=query.eq("status",status);
  if(severity!=="all")query=query.eq("severity",severity);
  if(assigned==="me")query=query.eq("assignee_id",profile.id);
  if(assigned==="unassigned")query=query.is("assignee_id",null);
  const [findingsResult,allDocuments,taxonomyResult,peopleResult,processResult] = await Promise.all([
    query,
    supabase.from("document_versions").select("id,document_id,title_vi,version_number,issuing_department,valid_from,vocabulary_values(label_vi),documents(document_code)")
      .order("updated_at",{ascending:false}).limit(200),
    supabase.from("issue_taxonomy").select("code,group_code,group_label_vi,type_label_vi,explanation_vi,decision_order,decision_question_vi,minimum_evidence_vi").eq("is_active",true).order("decision_order"),
    supabase.from("profiles").select("id,display_name,role").eq("is_active",true).order("display_name"),
    supabase.from("process_versions").select("id,name_vi,level_type,enterprise_processes(process_code)").order("updated_at",{ascending:false}).limit(200)
  ]);
  const findings=(findingsResult.data||[]);
  const findingIds=findings.map(x=>x.id);
  const [linksResult,actionsResult,sourceEvidenceResult]=await Promise.all([
    findingIds.length?supabase.from("finding_links").select("id,finding_id,object_type,object_id,link_role,evidence_excerpt")
      .in("finding_id",findingIds).eq("link_role","subject"):
      Promise.resolve({data:[],error:null}),
    findingIds.length?supabase.from("finding_actions").select("id,finding_id,status,progress_percent,due_at,assignee_id")
      .in("finding_id",findingIds):Promise.resolve({data:[],error:null}),
    findingIds.length?supabase.from("finding_source_evidence").select("finding_id,source_ref,evidence_excerpt")
      .in("finding_id",findingIds):Promise.resolve({data:[],error:null})
  ]);
  const links=(linksResult.data||[]) as FindingLink[];
  const actions=(actionsResult.data||[]) as ActionRow[];
  const sourceEvidence=(sourceEvidenceResult.data||[]) as SourceEvidenceRow[];
  const docMap=new Map(((allDocuments.data||[]) as unknown as DocumentRow[]).map(doc=>[doc.id,doc]));
  // The intake already loads recent versions; reuse them and fetch only missing
  // older linked versions, avoiding a third sequential DB request for normal cases.
  const missingDocs=[...new Set(links.map(l=>l.object_id))].filter(id=>!docMap.has(id));
  if(missingDocs.length){
    const moreDocs=await supabase.from("document_versions")
      .select("id,document_id,title_vi,version_number,issuing_department,valid_from,vocabulary_values(label_vi),documents(document_code)").in("id",missingDocs);
    for(const doc of (moreDocs.data||[]) as unknown as DocumentRow[])docMap.set(doc.id,doc);
  }
  const taxonomy=(taxonomyResult.data||[]) as IssueTaxonomyItem[];
  const taxonomyMap=new Map(taxonomy.map(t=>[t.code,t]));
  const people=(peopleResult.data||[]) as {id:string;display_name:string;role:string}[];
  const peopleMap=new Map(people.map(p=>[p.id,p.display_name]));
  // The Excel register contains single-source, cross-document and missing-source issues.
  // Keep all three classes visible; filters describe evidence scope instead of hiding valid rows.
  const filtered=(type==="all"?findings:findings.filter(f=>f.primary_issue_code===type))
    .sort((a,b)=>(taxonomyMap.get(a.primary_issue_code||"")?.decision_order||99)-(taxonomyMap.get(b.primary_issue_code||"")?.decision_order||99));
  const active=filtered.filter(f=>activeStatuses.includes(f.status));
  const activeActionIds=new Set(active.map(f=>f.id));
  const currentActions=actions.filter(a=>activeActionIds.has(a.finding_id)&&a.status!=="cancelled");
  const delayed=currentActions.filter(a=>a.status!=="done"&&overdue(a.due_at)).length;
  const decisionPending=active.filter(f=>f.action_decision==="pending").length;
  const createDocs=(allDocuments.data||[]) as unknown as DocumentRow[];
  const processes=(processResult.data||[]) as unknown as ProcessRow[];
  const processMap=new Map(processes.map(process=>[process.id,process]));
  const sourceTitles=[
    "Thông báo giảm phí trả góp VNPAY","Quy trình bán hàng trả góp","Chính sách bán hàng trả góp",
    "Hướng dẫn thao tác trên phần mềm trả góp","Biểu mẫu F5 thông báo thay đổi phí chuyển đổi trả góp",
    "Thông báo ngân hàng được áp dụng trả góp qua Payoo năm 2026",
    "Thông báo quy định chung trả góp qua thẻ tín dụng tại PNJ",
    "Thông báo dừng tính năng chuyển đơn đặt cọc sang đơn bán hàng trả góp",
    "Thông báo tính năng chuyển đơn đặt cọc sang đơn bán hàng trả góp",
    "Phụ lục hướng dẫn thanh toán quẹt thẻ trả góp luồng độc lập tại máy POS VNPAY",
    "Thông báo hợp nhất về trả góp tại PNJ","Thông báo hợp nhất trả góp 2022",
    "Thông báo đối tác Payoo thay mới máy POS và hướng dẫn thanh toán mPOS",
    "1104-Hướng dẫn thanh toán QR-trả thẳng-trả góp trên mPOS"
  ];
  const refFromDoc=(doc:DocumentRow)=>{
    const match=doc.documents?.document_code?.match(/TG-DOC-(\d{3})$/);
    return match?Number(match[1]):null;
  };
  const sourceByRef=new Map<number,DocumentRow>();
  for(const doc of docMap.values()){const ref=refFromDoc(doc);if(ref&&ref<=14&&!sourceByRef.has(ref))sourceByRef.set(ref,doc);}
  const matrixDocuments:MatrixDocument[]=sourceTitles.map((title,index)=>{
    const ref=index+1,doc=sourceByRef.get(ref);
    return {id:doc?.id||null,ref,code:doc?.documents?.document_code||("SOURCE-"+String(ref).padStart(2,"0")),
      title:doc?.title_vi||title,department:doc?.issuing_department||null,documentType:doc?.vocabulary_values?.label_vi||null,
      validFrom:doc?.valid_from||null,available:Boolean(doc)};
  });
  const matrixFindings:MatrixFinding[]=filtered.map(f=>{
    const issueType=taxonomyMap.get(f.primary_issue_code||"");
    const itsActions=actions.filter(a=>a.finding_id===f.id&&a.status!=="cancelled");
    const completed=itsActions.filter(a=>a.status==="done").length;
    const progress=itsActions.length?Math.round(itsActions.reduce((sum,a)=>sum+a.progress_percent,0)/itsActions.length):0;
    const actionSummary=f.action_decision==="pending"?"Chưa quyết định action":
      f.action_decision==="not_required"?"Không cần action":
      itsActions.length?(completed+"/"+itsActions.length+" action hoàn tất"):"Cần tạo action";
    const evidence:MatrixEvidence[]=sourceEvidence.filter(item=>item.finding_id===f.id).map(item=>({
      documentId:sourceByRef.get(item.source_ref)?.document_id||null,ref:item.source_ref,evidence:item.evidence_excerpt
    }));
    for(const link of links.filter(link=>link.finding_id===f.id&&link.object_type==="document_version")){
      const doc=docMap.get(link.object_id),ref=doc?refFromDoc(doc)||0:0;
      if(ref>0&&!evidence.some(item=>item.ref===ref))evidence.push({documentId:doc?.document_id||null,ref,evidence:link.evidence_excerpt});
    }
    const referencedText=[f.title,f.description,f.proposed_action,f.owner_question,f.process_owner_feedback].filter(Boolean).join(" ");
    for(const match of referencedText.matchAll(/\[(\d{1,2})\]/g)){
      const ref=Number(match[1]);if(ref>=1&&ref<=14&&!evidence.some(item=>item.ref===ref))evidence.push({documentId:sourceByRef.get(ref)?.document_id||null,ref,evidence:null});
    }
    const relatedProcesses:MatrixProcess[]=links.filter(link=>link.finding_id===f.id&&link.object_type==="process_version")
      .map(link=>processMap.get(link.object_id)).filter((process):process is ProcessRow=>Boolean(process))
      .map(process=>({id:process.id,code:process.enterprise_processes?.process_code||"PROC",
        name:process.name_vi,level:process.level_type}));
    const excelId=f.title.match(/^\[([^\]]+)\]/)?.[1]||f.finding_code;
    return {id:f.id,code:excelId,title:f.title.replace(/^\[[^\]]+\]\s*/,""),description:f.description,impact:f.impact_summary,
      issueCode:f.primary_issue_code,issueType:issueType?.type_label_vi||"Chưa phân loại chuẩn hóa",
      groupCode:issueType?.group_code||"—",groupLabel:issueType?.group_label_vi||"Chưa phân nhóm",
      decisionPoint:f.decision_point,proposedAction:f.proposed_action,ownerQuestion:f.owner_question,
      ownerFeedback:f.process_owner_feedback,evidenceStatus:f.evidence_status,status:f.status,statusLabel:issueStatuses[f.status]||f.status,
      severity:f.severity,severityLabel:severityLabels[f.severity]||f.severity,assignee:peopleMap.get(f.assignee_id||"")||"Chưa giao",
      dueAt:f.due_at,actionSummary,actionProgress:progress,evidence,relatedProcesses};
  });

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
        <IssueClassifier items={taxonomy}/>
        <label>Mức độ ảnh hưởng<select name="severity" defaultValue="medium">{Object.entries(severityLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <label>Ưu tiên<select name="priority" defaultValue="medium"><option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="urgent">Khẩn cấp</option></select></label>
        <label>Giao người phụ trách<select name="assignee_id" defaultValue=""><option value="">Chưa giao</option>{people.filter(p=>p.role==="admin"||p.role==="editor").map(p=><option value={p.id} key={p.id}>{p.display_name}</option>)}</select></label>
        <label>Quy trình liên quan<select name="process_version_id" defaultValue=""><option value="">Chưa liên kết</option>{processes.map(p=><option key={p.id} value={p.id}>{p.enterprise_processes?.process_code||"PROC"} · {p.name_vi} · {p.level_type}</option>)}</select></label>
        <label className="finding-full">Decision Point / điểm quyết định<input name="decision_point" maxLength={500} placeholder="Bước hoặc quyết định nghiệp vụ nơi vấn đề phát sinh"/></label>
        <label className="finding-full">Mô tả vấn đề / nội dung khác nhau<textarea name="description" rows={3} maxLength={5000} required placeholder="Văn bản A quy định…, trong khi văn bản B quy định…; phạm vi trùng tại…"/></label>
        <label className="finding-full">Ảnh hưởng vận hành (nếu có)<textarea name="impact_summary" rows={2} maxLength={2000} placeholder="Ví dụ: cửa hàng có thể áp dụng mức phí không thống nhất"/></label>
        <fieldset className="finding-full finding-doc-picker"><legend>Tài liệu liên quan · chọn ít nhất 2 tài liệu khác nhau</legend>
          <div className="finding-doc-options">{createDocs.length?createDocs.map(doc=><label key={doc.id}><input type="checkbox" name="document_version_id" value={doc.id}/><span><strong>{doc.documents?.document_code||"DOC"}</strong> · {doc.title_vi} · v{doc.version_number}</span></label>):<p>Chưa có phiên bản tài liệu bạn được phép chọn.</p>}</div>
          <small>Chỉ ghi nhận vấn đề phát sinh giữa ít nhất 2 tài liệu khác nhau. Hai phiên bản của cùng một tài liệu không được tính là 2 tài liệu.</small>
        </fieldset>
        <label className="finding-full">Dẫn chứng / vị trí điều khoản<textarea name="evidence_excerpt" rows={2} maxLength={2000} placeholder="Ví dụ: Điều 4.2 của tài liệu A so với Mục III tài liệu B"/></label>
        <label className="finding-full">Lý do phân loại<textarea name="classification_rationale" rows={2} maxLength={2000} required placeholder="Vì sao chọn mã này thay vì mã gần nhất?"/></label>
        <label>Trạng thái bằng chứng<select name="evidence_status" defaultValue="candidate"><option value="candidate">Candidate · mới ghi nhận</option><option value="pending">Pending · chờ xác minh</option><option value="validated">Validated · đã xác nhận</option><option value="rejected">Rejected · không hợp lệ</option></select></label>
        <label className="finding-full">Câu hỏi cho Process Owner<textarea name="owner_question" rows={2} maxLength={2000} placeholder="Nội dung cụ thể cần Process Owner xác nhận"/></label>
        <label className="finding-full">Đề xuất hành động ban đầu<textarea name="proposed_action" rows={2} maxLength={3000} placeholder="Khuyến nghị sơ bộ; action thực thi sẽ được giao ở trang chi tiết"/></label>
        <label>Hạn xử lý (tùy chọn)<input type="date" name="due_at"/></label>
        <div className="finding-full"><button className="primary-button" type="submit">Tạo finding & liên kết tài liệu</button></div>
      </form>
    </details>}

    <div className="finding-view-row">
      <div><strong>Ma trận issue và nội dung đối chiếu</strong><p>Mỗi finding gom quy trình, tài liệu liên quan và các trích dẫn mâu thuẫn vào hai cột có thể thay đổi kích thước; không ẩn issue chỉ có một nguồn hoặc đang thiếu file.</p></div>
    </div>
    <Form action="/findings" scroll={false} className="catalog-toolbar finding-filter-toolbar">
      <select name="status" defaultValue={status} aria-label="Trạng thái finding"><option value="all">Tất cả trạng thái</option><option value="open">Đang mở</option>{Object.entries(issueStatuses).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select>
      <select name="type" defaultValue={type} aria-label="Loại finding"><option value="all">Mọi loại vấn đề</option>{taxonomy.map(t=><option key={t.code} value={t.code}>{t.code} · {t.type_label_vi}</option>)}</select>
      <select name="severity" defaultValue={severity} aria-label="Mức độ"><option value="all">Mọi mức độ</option>{Object.entries(severityLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
      <select name="assigned" defaultValue={assigned} aria-label="Người phụ trách"><option value="all">Mọi người phụ trách</option><option value="me">Được giao cho tôi</option><option value="unassigned">Chưa giao</option></select>
      <button type="submit">Lọc</button>
    </Form>
    {findingsResult.error?<div className="state-message error-state"><strong>Không thể tải findings</strong><span>{findingsResult.error.message}</span></div>:
      <FindingIssueMatrix findings={matrixFindings} documents={matrixDocuments}/>}
    {(linksResult.error||actionsResult.error||sourceEvidenceResult.error)&&<p className="state-message error-state">Không thể tải đầy đủ liên kết tài liệu hoặc action. Vui lòng thử lại.</p>}
  </WorkspaceShell>;
}
