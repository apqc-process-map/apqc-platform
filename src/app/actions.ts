"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const findingStatuses = ["new", "triage", "in_progress", "pending_decision", "resolved", "closed", "reopened"] as const;
const reactions = ["agree", "disagree", "need_more_information"] as const;
const documentStatuses = ["draft", "in_review", "rejected", "approved", "scheduled", "effective", "cancelled", "superseded", "archived"] as const;
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
]);
const allowedFileExtensions: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
  "image/png": ["png"],
  "image/jpeg": ["jpg", "jpeg"],
};

async function authenticatedContext() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=required");
  const { data: profile } = await supabase.from("profiles").select("id,role,is_active").eq("id", user.id).maybeSingle();
  if (!profile?.is_active) redirect("/login?error=inactive");
  return { supabase, user, profile };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = String(formData.get("notification_id") || "");
  if (!notificationId) return;
  const { supabase, user } = await authenticatedContext();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("recipient_id", user.id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await authenticatedContext();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
  revalidatePath("/notifications");
}

export async function acknowledgeReadingAssignment(formData: FormData) {
  const assignmentId = String(formData.get("assignment_id") || "");
  if (!assignmentId) throw new Error("Không tìm thấy yêu cầu đọc tài liệu.");
  const { supabase, user } = await authenticatedContext();
  const { data: assignment, error: readError } = await supabase
    .from("reading_assignments").select("id").eq("id", assignmentId)
    .eq("profile_id", user.id).eq("object_type", "document_version").maybeSingle();
  if (readError || !assignment) throw new Error("Yêu cầu đọc không tồn tại hoặc không thuộc tài khoản của bạn.");
  const { error } = await supabase.from("reading_acknowledgments")
    .upsert({ assignment_id: assignment.id }, { onConflict: "assignment_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  revalidatePath("/documents");
}

export async function updateFindingWorkflow(formData: FormData) {
  const findingId = String(formData.get("finding_id") || "");
  const requestedStatus = String(formData.get("status") || "");
  const assigneeId = String(formData.get("assignee_id") || "");
  const resolutionSummary = String(formData.get("resolution_summary") || "").trim();
  const dueDate = String(formData.get("due_at") || "").trim();
  if(dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw new Error("Ngày xử lý finding không hợp lệ.");
  if (!findingId || !findingStatuses.includes(requestedStatus as typeof findingStatuses[number])) throw new Error("Finding hoặc trạng thái không hợp lệ.");

  const { supabase, profile } = await authenticatedContext();
  if (profile.role !== "admin" && profile.role !== "editor") throw new Error("Bạn không có quyền cập nhật finding.");

  const { data: finding, error: readError } = await supabase.from("findings").select("status,created_by,assignee_id,finding_domain").eq("id", findingId).single();
  if (readError || !finding) throw new Error("Không tìm thấy finding.");
  if (profile.role === "editor" && finding.created_by !== profile.id && finding.assignee_id !== profile.id) throw new Error("Editor chỉ được cập nhật finding do mình tạo hoặc được giao.");

  const editorTransitions: Record<string, string[]> = {
    new: ["triage", "in_progress"],
    triage: ["in_progress"],
    in_progress: ["pending_decision", "resolved"],
    pending_decision: ["in_progress", "resolved"],
    resolved: [],
    closed: [],
    reopened: ["in_progress", "resolved"],
  };
  if (requestedStatus !== finding.status && profile.role !== "admin" && !editorTransitions[finding.status]?.includes(requestedStatus)) throw new Error("Chuyển trạng thái này cần quyền Admin.");
  const isClosing = requestedStatus === "resolved" || requestedStatus === "closed";
  if (isClosing && !resolutionSummary) {
    redirect(`/findings/${findingId}?workflow_error=resolution_required#finding-workflow`);
  }
  if (isClosing && finding.finding_domain === "document") {
    const { count, error: actionCheckError } = await supabase
      .from("finding_actions")
      .select("id", { count: "exact", head: true })
      .eq("finding_id", findingId)
      .not("status", "in", '("done","cancelled")');
    if (actionCheckError) redirect(`/findings/${findingId}?workflow_error=validation_unavailable#finding-workflow`);
    if ((count || 0) > 0) redirect(`/findings/${findingId}?workflow_error=actions_incomplete#finding-workflow`);
  }

  const { error } = await supabase.from("findings").update({ status: requestedStatus, assignee_id: assigneeId || null, due_at: dueDate? dueDate+"T17:00:00+07:00" : null, resolution_summary: resolutionSummary || null }).eq("id", findingId);
  if (error) {
    const code = error.message.includes("corrective actions") ? "actions_incomplete"
      : error.message.toLowerCase().includes("resolution summary") ? "resolution_required"
      : "save_failed";
    redirect(`/findings/${findingId}?workflow_error=${code}#finding-workflow`);
  }
  revalidatePath(`/findings/${findingId}`);
  revalidatePath("/findings");
  redirect(`/findings/${findingId}?workflow_saved=1#finding-workflow`);
}

export async function setFindingReaction(formData: FormData) {
  const findingId = String(formData.get("finding_id") || "");
  const reaction = String(formData.get("reaction") || "");
  if (!findingId || !reactions.includes(reaction as typeof reactions[number])) throw new Error("Reaction không hợp lệ.");
  const { supabase, user } = await authenticatedContext();
  const { error } = await supabase.from("finding_reactions").upsert({ finding_id: findingId, profile_id: user.id, reaction }, { onConflict: "finding_id,profile_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/findings/${findingId}`);
}

export async function addFindingComment(formData: FormData) {
  const findingId = String(formData.get("finding_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!findingId || !body || body.length > 5000) throw new Error("Comment phải có từ 1 đến 5.000 ký tự.");
  const { supabase, user } = await authenticatedContext();
  let { data: thread } = await supabase.from("comment_threads").select("id").eq("context_type", "finding").eq("context_id", findingId).limit(1).maybeSingle();
  if (!thread) {
    const created = await supabase.from("comment_threads").insert({ context_type: "finding", context_id: findingId, anchor: "finding-summary" }).select("id").single();
    if (created.error) throw new Error(created.error.message);
    thread = created.data;
  }
  const { error } = await supabase.from("comments").insert({ thread_id: thread.id, author_id: user.id, body, is_decision: false });
  if (error) throw new Error(error.message);
  revalidatePath(`/findings/${findingId}`);
}

export async function setFindingParticipant(formData: FormData) {
  const findingId = String(formData.get("finding_id") || "");
  const profileId = String(formData.get("profile_id") || "");
  const participantRole = String(formData.get("participant_role") || "");
  if (!findingId || !profileId || !["participant", "watcher"].includes(participantRole)) throw new Error("Participant không hợp lệ.");
  const { supabase, profile } = await authenticatedContext();
  if (profile.role !== "admin" && profile.role !== "editor") throw new Error("Bạn không có quyền quản lý participant.");
  const { error } = await supabase.from("finding_participants").upsert({ finding_id: findingId, profile_id: profileId, participant_role: participantRole }, { onConflict: "finding_id,profile_id" });
  if (error) throw new Error(error.message);
  revalidatePath(`/findings/${findingId}`);
}

export async function removeFindingParticipant(formData: FormData) {
  const findingId = String(formData.get("finding_id") || "");
  const profileId = String(formData.get("profile_id") || "");
  if (!findingId || !profileId) return;
  const { supabase, profile } = await authenticatedContext();
  if (profile.role !== "admin" && profile.role !== "editor") throw new Error("Bạn không có quyền quản lý participant.");
  const { error } = await supabase.from("finding_participants").delete().eq("finding_id", findingId).eq("profile_id", profileId);
  if (error) throw new Error(error.message);
  revalidatePath(`/findings/${findingId}`);
}

export async function uploadDocumentFile(formData: FormData) {
  const documentVersionId = String(formData.get("document_version_id") || "");
  const file = formData.get("file");
  if (!documentVersionId || !(file instanceof File) || !file.size) throw new Error("Hãy chọn file cần upload.");
  if (file.size > 26_214_400) throw new Error("File vượt giới hạn 25 MB.");
  if (!allowedMimeTypes.has(file.type)) throw new Error("Chỉ chấp nhận PDF, DOC, DOCX, XLSX, PPTX, PNG hoặc JPEG.");
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "";
  if (!allowedFileExtensions[file.type]?.includes(extension)) throw new Error("Phần mở rộng file không khớp với MIME type.");

  const { supabase, user, profile } = await authenticatedContext();
  if (profile.role !== "admin" && profile.role !== "editor") throw new Error("Bạn không có quyền upload tài liệu.");

  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const checksum = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  const storageKey = `${documentVersionId}/${crypto.randomUUID()}.${extension}`;

  const upload = await supabase.storage.from("process-documents").upload(storageKey, bytes, { contentType: file.type, upsert: false });
  if (upload.error) throw new Error(upload.error.message);
  const saved = await supabase.from("document_files").insert({
    document_version_id: documentVersionId,
    storage_bucket: "process-documents",
    storage_key: storageKey,
    original_file_name: file.name.slice(0, 255),
    mime_type: file.type,
    size_bytes: file.size,
    checksum_sha256: checksum,
    uploaded_by: user.id,
  });
  if (saved.error) {
    await supabase.storage.from("process-documents").remove([storageKey]);
    throw new Error(saved.error.message);
  }
  revalidatePath("/documents");
}

export async function updateDocumentLifecycle(formData: FormData) {
  const documentVersionId = String(formData.get("document_version_id") || "");
  const status = String(formData.get("status") || "");
  if (!documentVersionId || !documentStatuses.includes(status as typeof documentStatuses[number])) throw new Error("Trạng thái tài liệu không hợp lệ.");
  const { supabase, user, profile } = await authenticatedContext();
  if (profile.role !== "admin" && profile.role !== "editor") throw new Error("Bạn không có quyền cập nhật tài liệu.");
  if (profile.role !== "admin" && ["approved", "scheduled", "effective", "superseded", "archived"].includes(status)) throw new Error("Trạng thái này cần quyền Admin.");

  const auditFields: Record<string, string> = {};
  if (status === "in_review") Object.assign(auditFields, { submitted_at: new Date().toISOString(), submitted_by: user.id });
  if (status === "approved") Object.assign(auditFields, { approved_at: new Date().toISOString(), approved_by: user.id });
  if (status === "effective") Object.assign(auditFields, { published_at: new Date().toISOString(), published_by: user.id });
  const { error } = await supabase.from("document_versions").update({ status, ...auditFields }).eq("id", documentVersionId);
  if (error) throw new Error(error.message);
  revalidatePath("/documents");
}


type DocumentDraftMetadata = {
  title_vi:string; title_en:string|null; document_group:string; document_type_value_id:string|null;
  language:string; document_abstract:string|null; change_summary:string;
  valid_from:string|null; valid_until:string|null; review_due_at:string|null;
  issuing_department:string|null; applicability_note:string|null; keywords:string|null;
  owner_id:string|null; designated_approver_id:string|null;
  legal_reference:string|null; retention_note:string|null; risk_rating:string|null;
  access_level:string; allowed_roles:string[];
};
const documentGroups = ["governance","execution","communication","evidence","planning","external","other"];
const documentScopeDimensions = ["legal_entity","department","location","channel","product_service","employee_audience"] as const;
type ScopeDimension = typeof documentScopeDimensions[number];
type KnowledgeLevel="must"|"should"|"none";
type DocumentExtras = { processId:string|null; scopes:{dimension:ScopeDimension; vocabulary_value_id:string}[]; tagIds:string[]; knowledge:Record<string,KnowledgeLevel> };
function optionalString(data:FormData,field:string,max=1000):string|null {
  const value=String(data.get(field)||"").trim();
  if(value.length>max) throw new Error("Trường "+field+" vượt quá "+max+" ký tự.");
  return value||null;
}
function optionalDate(data:FormData,field:string):string|null {
  const value=optionalString(data,field,10);
  if(value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))) throw new Error("Ngày không hợp lệ.");
  return value;
}
function documentFile(data:FormData):File|null {
  const value=data.get("file");
  if(!(value instanceof File)||!value.size) return null;
  if(value.size>26_214_400) throw new Error("File vượt giới hạn 25 MB.");
  if(!allowedMimeTypes.has(value.type)) throw new Error("Chỉ nhận PDF, DOC, DOCX, XLSX, PPTX, PNG hoặc JPEG.");
  const extension=value.name.split(".").pop()?.toLowerCase()||"";
  if(!allowedFileExtensions[value.type]?.includes(extension)) throw new Error("Định dạng và phần mở rộng file không khớp.");
  return value;
}
async function validateDraftForm(
  supabase:Awaited<ReturnType<typeof createSupabaseServerClient>>,
  data:FormData,
  fallbackGroup="other"
):Promise<{metadata:DocumentDraftMetadata;extras:DocumentExtras}> {
  const valid_from=optionalDate(data,"valid_from");
  const valid_until=optionalDate(data,"valid_until");
  if(valid_from&&valid_until&&valid_until<valid_from)throw new Error("Ngày kết thúc phải từ ngày bắt đầu hiệu lực trở đi.");
  const document_type_value_id=optionalString(data,"document_type_value_id",80);
  // Group is derived from the selected type; retain legacy groups for untyped drafts.
  let document_group=documentGroups.includes(fallbackGroup.toLowerCase())?fallbackGroup.toLowerCase():"other";
  if(document_type_value_id){
    const {data:found,error}=await supabase.from("vocabulary_values")
      .select("id,document_group_code,vocabularies!inner(code)")
      .eq("id",document_type_value_id).eq("vocabularies.code","document_type").eq("is_active",true).maybeSingle();
    if(error||!found)throw new Error("Loại tài liệu không hợp lệ.");
    if(found.document_group_code && documentGroups.includes(found.document_group_code)) document_group=found.document_group_code;
  }
  const owner_id=optionalString(data,"owner_id",80);
  const designated_approver_id=optionalString(data,"designated_approver_id",80);
  const ids=[...new Set([owner_id,designated_approver_id].filter((id):id is string=>!!id))];
  if(ids.length){
    const {data:people,error}=await supabase.from("profiles").select("id,role").in("id",ids).eq("is_active",true);
    if(error||!people||people.length!==ids.length)throw new Error("Người phụ trách hoặc người duyệt không hợp lệ.");
    if(designated_approver_id&&people.find(p=>p.id===designated_approver_id)?.role!=="admin")
      throw new Error("Người duyệt phải có quyền Admin.");
  }
  const access_level=optionalString(data,"access_level",50)||"internal";
  if(!["internal","limited","confidential","highly_restricted"].includes(access_level))throw new Error("Phân loại truy cập không hợp lệ.");
  const allowed_roles=access_level==="internal"?["viewer","editor","admin"]:
    access_level==="highly_restricted"?["admin"]:["editor","admin"];
  const risk_rating=optionalString(data,"risk_rating",30);
  if(risk_rating&&!["low","medium","high","critical"].includes(risk_rating))throw new Error("Mức độ rủi ro không hợp lệ.");
  const processId=optionalString(data,"process_id",80);
  if(processId){
    const {data:process,error}=await supabase.from("processes").select("id").eq("id",processId).maybeSingle();
    if(error||!process)throw new Error("Quy trình liên quan không hợp lệ.");
  }
  const scopes:DocumentExtras["scopes"]=[];
  for(const dimension of documentScopeDimensions){
    const values=[...new Set(data.getAll("scope_"+dimension).map(String).filter(Boolean))];
    if(values.length>30)throw new Error("Quá nhiều giá trị phạm vi áp dụng.");
    if(values.length){
      const {data:matched,error}=await supabase.from("vocabulary_values")
        .select("id,vocabularies!inner(code)").in("id",values)
        .eq("vocabularies.code",dimension).eq("is_active",true);
      if(error||!matched||matched.length!==values.length) throw new Error("Giá trị phạm vi "+dimension+" không hợp lệ.");
      scopes.push(...values.map(v=>({dimension,vocabulary_value_id:v})));
    }
  }
  const tagIds=[...new Set(data.getAll("governance_tag_id").map(String).filter(Boolean))];
  if(tagIds.length>30)throw new Error("Quá nhiều nhãn tài liệu.");
  if(tagIds.length){
    const {data:tags,error}=await supabase.from("governance_tags").select("id").in("id",tagIds).eq("is_active",true);
    if(error||!tags||tags.length!==tagIds.length)throw new Error("Nhãn tài liệu không hợp lệ.");
  }
  const knowledge:Record<string,KnowledgeLevel>={};
  for(const [field,level] of [
    ["knowledge_must","must"],["knowledge_should","should"],["knowledge_none","none"]
  ] as const){
    for(const roleId of data.getAll(field).map(String)){
      if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(roleId))throw new Error("Mã chức danh không hợp lệ.");
      if(knowledge[roleId] && knowledge[roleId]!==level)
        throw new Error("Mỗi chức danh chỉ được chọn vào một nhóm cần biết.");
      knowledge[roleId]=level;
    }
  }
  const selectedRoleIds=Object.keys(knowledge);
  if(selectedRoleIds.length>500)throw new Error("Có quá nhiều chức danh được chọn.");
  if(selectedRoleIds.length){
    const {data:activeRoles,error:roleError}=await supabase.from("business_roles")
      .select("id").in("id",selectedRoleIds).eq("is_active",true);
    if(roleError||!activeRoles||activeRoles.length!==selectedRoleIds.length)
      throw new Error("Có chức danh không hợp lệ hoặc ngừng sử dụng.");
  }
  const metadata:DocumentDraftMetadata={
    title_vi:optionalString(data,"title_vi",255)||"",
    title_en:optionalString(data,"title_en",255),
    document_group,document_type_value_id,
    language:optionalString(data,"language",12)||"vi",
    document_abstract:optionalString(data,"document_abstract",3000),
    change_summary:optionalString(data,"change_summary",2000)||"",
    valid_from,valid_until,review_due_at:optionalDate(data,"review_due_at"),
    issuing_department:optionalString(data,"issuing_department",255),
    applicability_note:optionalString(data,"applicability_note",2000),
    keywords:optionalString(data,"keywords",1000),
    owner_id,designated_approver_id,
    legal_reference:optionalString(data,"legal_reference",1500),
    retention_note:optionalString(data,"retention_note",1500),
    risk_rating,access_level,allowed_roles
  };
  if(!["vi","en","vi-en"].includes(metadata.language)) throw new Error("Ngôn ngữ không hợp lệ.");
  return {metadata,extras:{processId,scopes,tagIds,knowledge}};
}
async function saveDocumentRelations(
  supabase:Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId:string,versionId:string,extras:DocumentExtras,replace:boolean
) {
  if(replace){
    const removedLinks=await supabase.from("document_process_links").delete().eq("document_version_id",versionId).eq("link_role","primary");
    if(removedLinks.error)throw new Error(removedLinks.error.message);
    const removedScopes=await supabase.from("object_applicability").delete()
      .eq("object_type","document_version").eq("object_id",versionId).in("dimension",[...documentScopeDimensions]);
    if(removedScopes.error)throw new Error(removedScopes.error.message);
    const removedTags=await supabase.from("object_tags").delete().eq("object_type","document_version").eq("object_id",versionId);
    if(removedTags.error)throw new Error(removedTags.error.message);
  }
  if(extras.processId){
    const added=await supabase.from("document_process_links").insert({
      document_version_id:versionId,process_id:extras.processId,link_role:"primary"
    });
    if(added.error)throw new Error(added.error.message);
  }
  if(extras.scopes.length){
    const added=await supabase.from("object_applicability").insert(extras.scopes.map(s=>({
      object_type:"document_version",object_id:versionId,dimension:s.dimension,vocabulary_value_id:s.vocabulary_value_id
    })));
    if(added.error)throw new Error(added.error.message);
  }
  if(extras.tagIds.length){
    const added=await supabase.from("object_tags").insert(extras.tagIds.map(tagId=>({
      object_type:"document_version",object_id:versionId,tag_id:tagId,assigned_by:userId
    })));
    if(added.error)throw new Error(added.error.message);
  }
}
async function saveDocumentKnowledge(
  supabase:Awaited<ReturnType<typeof createSupabaseServerClient>>,
  documentId:string,knowledge:Record<string,KnowledgeLevel>
){
  // Database RPC checks Admin role, editable version, known roles and saves all changes atomically.
  const {error}=await supabase.rpc("set_document_knowledge_audience",{
    p_document_id:documentId,p_assignments:knowledge
  });
  if(error)throw new Error("Không thể lưu đối tượng cần biết: "+error.message);
  revalidatePath("/role-knowledge");
  revalidatePath("/relationships");
}

async function saveDraftFile(
  supabase:Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId:string,versionId:string,file:File
){
  const bytes=await file.arrayBuffer();
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  const checksum=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,"0")).join("");
  const ext=file.name.split(".").pop()!.toLowerCase();
  const key=versionId+"/"+crypto.randomUUID()+"."+ext;
  const upload=await supabase.storage.from("process-documents").upload(key,bytes,{contentType:file.type,upsert:false});
  if(upload.error)throw new Error(upload.error.message);
  const saved=await supabase.from("document_files").insert({
    document_version_id:versionId,storage_bucket:"process-documents",storage_key:key,
    original_file_name:file.name.slice(0,255),mime_type:file.type,
    size_bytes:file.size,checksum_sha256:checksum,uploaded_by:userId
  });
  if(saved.error){
    await supabase.storage.from("process-documents").remove([key]);
    throw new Error(saved.error.message);
  }
}
export async function createDocumentDraft(formData:FormData){
  const {supabase,user,profile}=await authenticatedContext();
  if(!["admin","editor"].includes(profile.role))throw new Error("Bạn không có quyền tạo tài liệu.");
  const file=documentFile(formData);
  const {metadata,extras}=await validateDraftForm(supabase,formData);
  if(profile.role!=="admin"&&Object.keys(extras.knowledge).length)
    throw new Error("Chỉ Admin được phân loại nhóm chức danh cần biết.");
  if(!file&&!metadata.title_vi)throw new Error("Hãy nhập tên tài liệu hoặc chọn file.");
  if(!metadata.title_vi)metadata.title_vi=file!.name.replace(/\.[^.]+$/,"").slice(0,255);
  const identity=await supabase.from("documents").insert({created_by:user.id}).select("id").single();
  if(identity.error||!identity.data)throw new Error(identity.error?.message||"Không thể tạo tài liệu.");
  const documentId=identity.data.id;
  let versionId:string|null=null;
  try{
    const version=await supabase.from("document_versions").insert({
      ...metadata,document_id:documentId,version_number:1,status:"draft",created_by:user.id
    }).select("id").single();
    if(version.error||!version.data)throw new Error(version.error?.message||"Không thể lưu metadata.");
    versionId=version.data.id;
    await saveDocumentRelations(supabase,user.id,version.data.id,extras,false);
    if(file)await saveDraftFile(supabase,user.id,version.data.id,file);
    if(profile.role==="admin")await saveDocumentKnowledge(supabase,documentId,extras.knowledge);
  }catch(error){
    if(versionId){
      await supabase.from("object_tags").delete().eq("object_type","document_version").eq("object_id",versionId);
      await supabase.from("object_applicability").delete().eq("object_type","document_version").eq("object_id",versionId);
      await supabase.from("document_process_links").delete().eq("document_version_id",versionId);
      await supabase.from("document_versions").delete().eq("id",versionId);
    }
    await supabase.from("documents").delete().eq("id",documentId);
    throw error;
  }
  revalidatePath("/documents");
  if(!versionId)throw new Error("Không có phiên bản tài liệu mới.");
  return {versionId};
}
export async function updateDocumentMetadata(formData:FormData){
  const {supabase,user,profile}=await authenticatedContext();
  if(!["admin","editor"].includes(profile.role))throw new Error("Không có quyền chỉnh sửa.");
  const versionId=String(formData.get("document_version_id")||"");
  const {data:current,error:readError}=await supabase.from("document_versions")
    .select("id,document_id,document_group,status,created_by,owner_id").eq("id",versionId).maybeSingle();
  if(readError||!current)throw new Error("Không tìm thấy phiên bản tài liệu.");
  if(!["draft","rejected"].includes(current.status))throw new Error("Chỉ chỉnh sửa bản nháp hoặc bị từ chối.");
  if(profile.role==="editor"&&current.created_by!==user.id&&current.owner_id!==user.id)
    throw new Error("Bạn không phụ trách tài liệu này.");
  const {metadata,extras}=await validateDraftForm(supabase,formData,current.document_group);
  if(profile.role!=="admin"&&Object.keys(extras.knowledge).length)
    throw new Error("Chỉ Admin được phân loại nhóm chức danh cần biết.");
  if(!metadata.title_vi)throw new Error("Tên tài liệu không được để trống.");
  const {data:updated,error}=await supabase.from("document_versions").update(metadata).eq("id",versionId).select("id").single();
  if(error||!updated)throw new Error(error?.message||"Không thể lưu metadata.");
  await saveDocumentRelations(supabase,user.id,versionId,extras,true);
  if(profile.role==="admin")await saveDocumentKnowledge(supabase,current.document_id,extras.knowledge);
  revalidatePath("/documents");
  redirect("/documents?updated=1");
}


const processAccessLevels = ["internal", "limited", "confidential", "highly_restricted"] as const;
const processEditableStatuses = ["draft", "rejected"] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function processText(formData: FormData, field: string, label: string, max: number, required = false) {
  const value = String(formData.get(field) || "").trim();
  if (value.length > max) throw new Error(`${label} vượt quá ${max.toLocaleString("vi-VN")} ký tự.`);
  if (required && !value) throw new Error(`${label} là bắt buộc.`);
  return value || null;
}

function processDate(formData: FormData, field: string) {
  const value = processText(formData, field, "Ngày", 10);
  if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))) throw new Error("Ngày không hợp lệ.");
  return value;
}

function processDraftMetadata(formData: FormData) {
  const validFrom = processDate(formData, "valid_from");
  const validUntil = processDate(formData, "valid_until");
  const reviewDueAt = processDate(formData, "review_due_at");
  if (validFrom && validUntil && validUntil < validFrom) throw new Error("Ngày hết hiệu lực phải sau ngày bắt đầu.");
  if (validFrom && reviewDueAt && reviewDueAt < validFrom) throw new Error("Ngày review phải từ ngày bắt đầu hiệu lực trở đi.");

  const accessLevel = String(formData.get("access_level") || "internal");
  if (!processAccessLevels.includes(accessLevel as typeof processAccessLevels[number])) throw new Error("Phân loại truy cập không hợp lệ.");
  const allowedRoles = accessLevel === "internal" ? ["viewer", "editor", "admin"] : accessLevel === "highly_restricted" ? ["admin"] : ["editor", "admin"];

  return {
    name_vi: processText(formData, "name_vi", "Tên tiếng Việt", 255, true),
    name_en: processText(formData, "name_en", "Tên tiếng Anh", 255),
    purpose: processText(formData, "purpose", "Purpose", 5000, true),
    description: processText(formData, "description", "Mô tả", 5000, true),
    scope_in: processText(formData, "scope_in", "Đầu vào", 3000, true),
    scope_out: processText(formData, "scope_out", "Đầu ra", 3000, true),
    trigger: processText(formData, "trigger", "Trigger", 3000, true),
    outcome: processText(formData, "outcome", "Outcome", 3000, true),
    business_purpose: processText(formData, "business_purpose", "Mục đích kinh doanh", 5000, true),
    scope_and_boundaries: processText(formData, "scope_and_boundaries", "Phạm vi và điểm đầu-cuối", 5000, true),
    process_at_a_glance: processText(formData, "process_at_a_glance", "Luồng nghiệp vụ chính", 5000, true),
    critical_decision_points: processText(formData, "critical_decision_points", "Quyết định trọng yếu", 5000, true),
    accountability_and_impact: processText(formData, "accountability_and_impact", "Trách nhiệm và tác động", 5000, true),
    access_level: accessLevel,
    allowed_roles: allowedRoles,
    valid_from: validFrom,
    valid_until: validUntil,
    review_due_at: reviewDueAt,
    change_summary: processText(formData, "change_summary", "Tóm tắt thay đổi", 2000, true),
  };
}

async function copyProcessVersionRelations(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sourceVersionId: string,
  targetVersionId: string,
  userId: string,
) {
  const [assignmentsResult, mappingsResult, tagsResult, applicabilityResult] = await Promise.all([
    supabase.from("process_assignments").select("profile_id,assignment_role,is_inherited,inherited_from_process_id").eq("process_version_id", sourceVersionId),
    supabase.from("process_apqc_mappings").select("apqc_element_id,mapping_role,match_type,rationale").eq("process_version_id", sourceVersionId),
    supabase.from("object_tags").select("tag_id").eq("object_type", "process_version").eq("object_id", sourceVersionId),
    supabase.from("object_applicability").select("dimension,vocabulary_value_id,system_id,free_text,is_inherited,inherited_from_object_id").eq("object_type", "process_version").eq("object_id", sourceVersionId),
  ]);
  const readError = assignmentsResult.error || mappingsResult.error || tagsResult.error || applicabilityResult.error;
  if (readError) throw new Error(readError.message);

  if (assignmentsResult.data?.length) {
    const { error } = await supabase.from("process_assignments").insert(assignmentsResult.data.map((row) => ({ ...row, process_version_id: targetVersionId })));
    if (error) throw new Error(error.message);
  }
  if (mappingsResult.data?.length) {
    const { error } = await supabase.from("process_apqc_mappings").insert(mappingsResult.data.map((row) => ({
      ...row,
      process_version_id: targetVersionId,
      status: "proposed",
      verified_by: null,
      verified_at: null,
    })));
    if (error) throw new Error(error.message);
  }
  if (tagsResult.data?.length) {
    const { error } = await supabase.from("object_tags").insert(tagsResult.data.map((row) => ({
      object_type: "process_version",
      object_id: targetVersionId,
      tag_id: row.tag_id,
      assigned_by: userId,
    })));
    if (error) throw new Error(error.message);
  }
  if (applicabilityResult.data?.length) {
    const { error } = await supabase.from("object_applicability").insert(applicabilityResult.data.map((row) => ({
      ...row,
      object_type: "process_version",
      object_id: targetVersionId,
    })));
    if (error) throw new Error(error.message);
  }
}

async function removeIncompleteProcessDraft(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  versionId: string,
) {
  await supabase.from("object_tags").delete().eq("object_type", "process_version").eq("object_id", versionId);
  await supabase.from("object_applicability").delete().eq("object_type", "process_version").eq("object_id", versionId);
  await supabase.from("process_versions").delete().eq("id", versionId);
}

export async function updateProcessMetadata(formData: FormData) {
  const processId = String(formData.get("process_id") || "");
  const processVersionId = String(formData.get("process_version_id") || "");
  if (!uuidPattern.test(processId) || !uuidPattern.test(processVersionId)) throw new Error("Quy trình hoặc phiên bản không hợp lệ.");

  const { supabase, user, profile } = await authenticatedContext();
  if (profile.role !== "admin") throw new Error("Chỉ Admin được chỉnh sửa metadata quy trình.");

  const metadata = processDraftMetadata(formData);
  const { data: current, error: currentError } = await supabase
    .from("process_versions")
    .select("id,process_id,version_number,status,allowed_roles")
    .eq("id", processVersionId)
    .eq("process_id", processId)
    .maybeSingle();
  if (currentError || !current) throw new Error(currentError?.message || "Không tìm thấy phiên bản quy trình.");

  if (processEditableStatuses.includes(current.status as typeof processEditableStatuses[number])) {
    const { error } = await supabase.from("process_versions").update({ ...metadata, updated_by: user.id }).eq("id", current.id);
    if (error) throw new Error(error.message);
    revalidatePath("/process-map");
    redirect(`/process-map?selected=${processId}&version=${current.id}&updated=1`);
  }

  const { data: latest, error: latestError } = await supabase
    .from("process_versions")
    .select("version_number")
    .eq("process_id", processId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw new Error(latestError.message);

  const { data: draft, error: draftError } = await supabase.from("process_versions").insert({
    ...metadata,
    process_id: processId,
    version_number: (latest?.version_number || current.version_number) + 1,
    status: "draft",
    created_by: user.id,
    updated_by: user.id,
    supersedes_version_id: current.id,
  }).select("id").single();
  if (draftError || !draft) throw new Error(draftError?.message || "Không thể tạo bản nháp.");

  try {
    await copyProcessVersionRelations(supabase, current.id, draft.id, user.id);
  } catch (error) {
    await removeIncompleteProcessDraft(supabase, draft.id);
    throw error;
  }

  revalidatePath("/process-map");
  redirect(`/process-map?selected=${processId}&version=${draft.id}&updated=1`);
}


const relationshipObjectTypes = ["process", "document", "business_object", "system", "risk", "kpi", "business_role", "finding"] as const;
const relationshipStatuses = ["proposed", "verified", "rejected"] as const;
type RelationshipObjectType = typeof relationshipObjectTypes[number];

function relationshipText(formData: FormData, field: string, label: string, max: number, required = false) {
  const value = String(formData.get(field) || "").trim();
  if (required && !value) throw new Error(label + " là bắt buộc.");
  if (value.length > max) throw new Error(label + " vượt quá " + max.toLocaleString("vi-VN") + " ký tự.");
  return value || null;
}

function relationshipDate(formData: FormData, field: string, label: string) {
  const value = relationshipText(formData, field, label, 10);
  if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))) {
    throw new Error(label + " không hợp lệ.");
  }
  return value;
}

function parseRelationshipObjectKey(value: FormDataEntryValue | null, label: string) {
  const [type, id, extra] = String(value || "").split(":");
  if (extra || !relationshipObjectTypes.includes(type as RelationshipObjectType) || !uuidPattern.test(id || "")) {
    throw new Error(label + " không hợp lệ.");
  }
  return { type: type as RelationshipObjectType, id };
}

async function relationshipObjectExists(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  type: RelationshipObjectType,
  id: string,
) {
  const tableByType: Record<RelationshipObjectType, string> = {
    process: "processes",
    document: "documents",
    business_object: "business_objects",
    system: "systems",
    risk: "risks",
    kpi: "kpis",
    business_role: "business_roles",
    finding: "findings",
  };
  let query = supabase.from(tableByType[type]).select("id").eq("id", id);
  if (type === "process" || type === "document") query = query.is("archived_at", null);
  else if (type !== "finding") query = query.eq("is_active", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function saveRelationshipMetadata(formData: FormData) {
  const relationshipId = String(formData.get("relationship_id") || "");
  if (relationshipId && !uuidPattern.test(relationshipId)) throw new Error("Quan hệ không hợp lệ.");

  const source = parseRelationshipObjectKey(formData.get("source_key"), "Đối tượng nguồn");
  const target = parseRelationshipObjectKey(formData.get("target_key"), "Đối tượng đích");
  if (source.type === target.type && source.id === target.id) throw new Error("Nguồn và đích phải là hai đối tượng khác nhau.");

  const relationshipTypeId = String(formData.get("relationship_type_id") || "");
  if (!uuidPattern.test(relationshipTypeId)) throw new Error("Loại quan hệ không hợp lệ.");
  const label = relationshipText(formData, "label", "Nhãn hiển thị", 255);
  const description = relationshipText(formData, "description", "Mô tả nghiệp vụ", 3000);
  const evidenceText = relationshipText(formData, "evidence_text", "Bằng chứng", 3000);
  const validFrom = relationshipDate(formData, "valid_from", "Ngày bắt đầu hiệu lực");
  const validUntil = relationshipDate(formData, "valid_until", "Ngày kết thúc hiệu lực");
  if (validFrom && validUntil && validUntil < validFrom) throw new Error("Ngày kết thúc phải sau ngày bắt đầu hiệu lực.");

  const { supabase, user, profile } = await authenticatedContext();
  if (!["admin", "editor"].includes(profile.role)) throw new Error("Bạn không có quyền quản lý quan hệ.");

  const { data: relationshipType, error: typeError } = await supabase
    .from("relationship_types")
    .select("id,allowed_source_types,allowed_target_types,is_active")
    .eq("id", relationshipTypeId)
    .maybeSingle();
  if (typeError || !relationshipType?.is_active) throw new Error(typeError?.message || "Loại quan hệ không tồn tại hoặc đã ngừng sử dụng.");
  if (relationshipType.allowed_source_types?.length && !relationshipType.allowed_source_types.includes(source.type)) {
    throw new Error("Loại đối tượng nguồn không phù hợp với loại quan hệ đã chọn.");
  }
  if (relationshipType.allowed_target_types?.length && !relationshipType.allowed_target_types.includes(target.type)) {
    throw new Error("Loại đối tượng đích không phù hợp với loại quan hệ đã chọn.");
  }

  const [sourceExists, targetExists] = await Promise.all([
    relationshipObjectExists(supabase, source.type, source.id),
    relationshipObjectExists(supabase, target.type, target.id),
  ]);
  if (!sourceExists || !targetExists) throw new Error("Nguồn hoặc đích không tồn tại, đã lưu trữ hoặc ngừng hoạt động.");

  const requestedStatus = String(formData.get("status") || "proposed");
  if (!relationshipStatuses.includes(requestedStatus as typeof relationshipStatuses[number])) throw new Error("Trạng thái không hợp lệ.");
  const status = profile.role === "admin" ? requestedStatus : "proposed";
  if (status === "verified" && (!description || !evidenceText)) {
    throw new Error("Quan hệ đã xác minh bắt buộc có mô tả nghiệp vụ và bằng chứng.");
  }

  let duplicateQuery = supabase
    .from("object_relationships")
    .select("id")
    .eq("source_type", source.type)
    .eq("source_id", source.id)
    .eq("target_type", target.type)
    .eq("target_id", target.id)
    .eq("relationship_type_id", relationshipTypeId);
  if (relationshipId) duplicateQuery = duplicateQuery.neq("id", relationshipId);
  const { data: duplicate, error: duplicateError } = await duplicateQuery.limit(1).maybeSingle();
  if (duplicateError) throw new Error(duplicateError.message);
  if (duplicate) throw new Error("Quan hệ cùng Nguồn, Loại và Đích đã tồn tại.");

  const payload = {
    source_type: source.type,
    source_id: source.id,
    target_type: target.type,
    target_id: target.id,
    relationship_type_id: relationshipTypeId,
    label,
    description,
    evidence_text: evidenceText,
    valid_from: validFrom,
    valid_until: validUntil,
    status,
    updated_by: user.id,
    verified_by: status === "verified" ? user.id : null,
  };

  let savedId = relationshipId;
  if (relationshipId) {
    const { data: current, error: currentError } = await supabase
      .from("object_relationships")
      .select("id,status,created_by")
      .eq("id", relationshipId)
      .maybeSingle();
    if (currentError || !current) throw new Error(currentError?.message || "Không tìm thấy quan hệ cần chỉnh sửa.");
    if (profile.role === "editor" && (current.created_by !== user.id || !["proposed", "rejected"].includes(current.status))) {
      throw new Error("Editor chỉ được sửa đề xuất do mình tạo khi đang chờ duyệt hoặc bị từ chối.");
    }
    const { data, error } = await supabase.from("object_relationships").update(payload).eq("id", relationshipId).select("id").single();
    if (error || !data) throw new Error(error?.code === "23505" ? "Quan hệ này đã tồn tại." : error?.message || "Không thể lưu quan hệ.");
  } else {
    const { data, error } = await supabase.from("object_relationships").insert({ ...payload, created_by: user.id }).select("id").single();
    if (error || !data) throw new Error(error?.code === "23505" ? "Quan hệ này đã tồn tại." : error?.message || "Không thể tạo quan hệ.");
    savedId = data.id;
  }

  revalidatePath("/relationships");
  redirect("/relationships?saved=" + (relationshipId ? "updated" : "created") + "&edit=" + savedId + "#relationship-metadata");
}
