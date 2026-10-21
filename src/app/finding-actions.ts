"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>;
const issueTypes = ["exact_duplicate","semantic_duplicate","scope_overlap","potential_conflict","version_conflict","effective_date_conflict","relationship_conflict","supersession_candidate","other"];

async function session() {
  const supabase=await createSupabaseServerClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)redirect("/login?error=required");
  const {data:profile}=await supabase.from("profiles").select("id,role,is_active").eq("id",user.id).maybeSingle();
  if(!profile?.is_active || !["admin","editor"].includes(profile.role))throw new Error("Chỉ Admin/Editor được cập nhật finding và action.");
  return {supabase,user,profile};
}
function textField(form:FormData,key:string,max:number,required=false){
  const v=String(form.get(key)||"").trim();
  if(v.length>max||(required&&!v))throw new Error("Thông tin "+key+" không hợp lệ.");
  return v;
}
function dateField(form:FormData,key:string){
  const value=textField(form,key,10);
  if(value&&!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error("Ngày không đúng định dạng.");
  return value||null;
}
async function allowedManager(supabase:Client,userId:string,role:string,findingId:string){
  const {data:finding,error}=await supabase.from("findings").select("id,created_by,assignee_id,finding_domain,action_decision").eq("id",findingId).maybeSingle();
  if(error||!finding||finding.finding_domain!=="document")throw new Error("Không tìm thấy finding tài liệu.");
  if(role!=="admin" && finding.created_by!==userId && finding.assignee_id!==userId)
    throw new Error("Bạn không được giao quản lý finding này.");
  return finding;
}
async function validateAssignee(supabase:Client,id:string){
  if(!id)return null;
  const {data,error}=await supabase.from("profiles").select("id,role").eq("id",id).eq("is_active",true).maybeSingle();
  if(error||!data||!["admin","editor"].includes(data.role))throw new Error("Người thực hiện phải là Admin hoặc Editor đang hoạt động.");
  return id;
}
function refresh(id:string){
  revalidatePath("/findings");
  revalidatePath("/findings/"+id);
}
export async function createDocumentFinding(formData:FormData){
  const {supabase,user}=await session();
  const title=textField(formData,"title",220,true);
  const description=textField(formData,"description",5000,true);
  const impact_summary=textField(formData,"impact_summary",2000)||null;
  const typeCode=textField(formData,"type_code",100,true);
  if(!issueTypes.includes(typeCode))throw new Error("Nhóm vấn đề không hợp lệ.");
  const severity=textField(formData,"severity",20)||"medium";
  const priority=textField(formData,"priority",20)||"medium";
  if(!["low","medium","high","critical"].includes(severity)||!["low","medium","high","urgent"].includes(priority))
    throw new Error("Mức độ hoặc mức ưu tiên không hợp lệ.");
  const documentIds=[...new Set(formData.getAll("document_version_id").map(String).filter(Boolean))];
  if(documentIds.length<2||documentIds.length>20)
    throw new Error("Finding phải đối chiếu ít nhất 2 tài liệu khác nhau (tối đa 20 phiên bản).");
  const {data:validDocuments,error:documentError}=await supabase.from("document_versions")
    .select("id,document_id").in("id",documentIds);
  if(documentError||!validDocuments||validDocuments.length!==documentIds.length)
    throw new Error("Có tài liệu không tồn tại hoặc bạn không được phép truy cập.");
  const distinctDocuments=new Set(validDocuments.map(doc=>doc.document_id));
  if(distinctDocuments.size<2)
    throw new Error("Hai phiên bản của cùng một tài liệu không tạo thành finding chồng chéo giữa nhiều tài liệu.");
  const {data:type,error:typeError}=await supabase.from("vocabulary_values")
    .select("id,vocabularies!inner(code)").eq("code",typeCode).eq("vocabularies.code","finding_type").eq("is_active",true).maybeSingle();
  if(typeError||!type)throw new Error("Loại finding chưa được cấu hình.");
  const assignee=await validateAssignee(supabase,textField(formData,"assignee_id",80));
  const due=dateField(formData,"due_at");
  const evidence=textField(formData,"evidence_excerpt",2000)||null;
  const {data:created,error}=await supabase.from("findings").insert({
    title,description,impact_summary, finding_domain:"document",
    finding_type_value_id:type.id,severity,priority,status:"new",
    created_by:user.id,assignee_id:assignee,
    ...(due?{due_at:due+"T17:00:00+07:00"}:{})
  }).select("id").single();
  if(error||!created)throw new Error(error?.message||"Không thể tạo finding.");
  const linkResult=await supabase.from("finding_links").insert(documentIds.map(id=>({
    finding_id:created.id,object_type:"document_version",object_id:id,link_role:"subject",evidence_excerpt:evidence
  })));
  if(linkResult.error){
    // Keep this as a visible record for recovery instead of silently losing a partially created issue.
    throw new Error("Finding đã tạo nhưng liên kết tài liệu thất bại: "+linkResult.error.message+". Mã bản ghi: "+created.id);
  }
  refresh(created.id);
  redirect("/findings/"+created.id);
}
export async function saveDocumentFindingDecision(formData:FormData){
  const {supabase,user,profile}=await session();
  const findingId=textField(formData,"finding_id",80,true);
  const finding=await allowedManager(supabase,user.id,profile.role,findingId);
  const decision=textField(formData,"action_decision",30);
  const reason=textField(formData,"action_decision_reason",2000);
  const impact=textField(formData,"impact_summary",2000);
  if(!["pending","required","not_required"].includes(decision))throw new Error("Quyết định action không hợp lệ.");
  if(decision==="not_required"&&!reason)throw new Error("Vui lòng nêu lý do không cần action.");
  if(decision!=="required"){
    const {data:actions}=await supabase.from("finding_actions").select("id").eq("finding_id",finding.id).neq("status","cancelled").limit(1);
    if(actions?.length)throw new Error("Finding còn action đang hoạt động. Hãy xử lý hoặc hủy action trước.");
  }
  const {error}=await supabase.from("findings").update({
    action_decision:decision,action_decision_reason:reason||null,impact_summary:impact||null
  }).eq("id",finding.id);
  if(error)throw new Error(error.message);
  refresh(finding.id);
}
export async function createFindingAction(formData:FormData){
  const {supabase,user,profile}=await session();
  const findingId=textField(formData,"finding_id",80,true);
  const finding=await allowedManager(supabase,user.id,profile.role,findingId);
  const title=textField(formData,"action_title",300,true);
  const description=textField(formData,"description",3000)||null;
  const due_at=dateField(formData,"due_at");
  const assignee_id=await validateAssignee(supabase,textField(formData,"assignee_id",80));
  if(finding.action_decision!=="required"){
    const {error}=await supabase.from("findings").update({action_decision:"required",action_decision_reason:null}).eq("id",findingId);
    if(error)throw new Error(error.message);
  }
  const {error}=await supabase.from("finding_actions").insert({
    finding_id:findingId,action_title:title,description,assignee_id,due_at,
    status:"todo",progress_percent:0,created_by:user.id
  });
  if(error)throw new Error(error.message);
  refresh(findingId);
}
export async function updateFindingAction(formData:FormData){
  const {supabase,user,profile}=await session();
  const findingId=textField(formData,"finding_id",80,true);
  const id=textField(formData,"action_id",80,true);
  const {data:action,error:actionError}=await supabase.from("finding_actions")
    .select("id,assignee_id,created_by,due_at").eq("id",id).eq("finding_id",findingId).maybeSingle();
  if(actionError||!action)throw new Error("Không tìm thấy action.");
  const {data:finding,error:findingError}=await supabase.from("findings")
    .select("id,created_by,assignee_id,finding_domain").eq("id",findingId).maybeSingle();
  if(findingError||!finding||finding.finding_domain!=="document")throw new Error("Finding không hợp lệ.");
  const isManager=profile.role==="admin"||finding.created_by===user.id||finding.assignee_id===user.id;
  const isWorker=action.assignee_id===user.id||action.created_by===user.id;
  if(!isManager&&!isWorker)throw new Error("Bạn không được giao thực hiện action này.");
  const status=textField(formData,"status",30,true);
  if(!["todo","in_progress","blocked","done","cancelled"].includes(status))throw new Error("Trạng thái action không hợp lệ.");
  const progress=Number(formData.get("progress_percent")||0);
  if(!Number.isInteger(progress)||progress<0||progress>100)throw new Error("Tiến độ phải trong khoảng 0–100%.");
  const last_update=textField(formData,"last_update",3000)||null;
  const completion_evidence=textField(formData,"completion_evidence",3000)||null;
  if(status==="blocked"&&!last_update)throw new Error("Action bị vướng mắc cần mô tả nguyên nhân.");
  if(status==="done"&&!completion_evidence)throw new Error("Action hoàn thành cần có kết quả hoặc dẫn chứng.");
  const patch:{
    status:string;progress_percent:number;last_update:string|null;completion_evidence:string|null;
    due_at?:string|null;assignee_id?:string|null
  }={status,progress_percent:status==="done"?100:progress,last_update,completion_evidence};
  if(isManager){
    patch.due_at=dateField(formData,"due_at");
    patch.assignee_id=await validateAssignee(supabase,textField(formData,"assignee_id",80));
  }
  const {error}=await supabase.from("finding_actions").update(patch).eq("id",id).eq("finding_id",findingId);
  if(error)throw new Error(error.message);
  refresh(findingId);
}
export async function addFindingDocumentEvidence(formData:FormData){
  const {supabase,user,profile}=await session();
  const findingId=textField(formData,"finding_id",80,true);
  await allowedManager(supabase,user.id,profile.role,findingId);
  const documentVersionId=textField(formData,"document_version_id",80,true);
  const evidence=textField(formData,"evidence_excerpt",2000);
  const {data:document}=await supabase.from("document_versions").select("id").eq("id",documentVersionId).maybeSingle();
  if(!document)throw new Error("Bạn không được phép truy cập tài liệu.");
  const {error}=await supabase.from("finding_links").upsert({
    finding_id:findingId,object_type:"document_version",object_id:documentVersionId,
    link_role:"subject",evidence_excerpt:evidence||null
  },{onConflict:"finding_id,object_type,object_id,link_role"});
  if(error)throw new Error(error.message);
  refresh(findingId);
}
