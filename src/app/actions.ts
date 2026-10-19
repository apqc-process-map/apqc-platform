"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const findingStatuses = ["new", "triage", "in_progress", "pending_decision", "resolved", "closed", "reopened"] as const;
const reactions = ["agree", "disagree", "need_more_information"] as const;
const documentStatuses = ["draft", "in_review", "rejected", "approved", "scheduled", "effective", "cancelled", "superseded", "archived"] as const;
const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
]);
const allowedFileExtensions: Record<string, string[]> = {
  "application/pdf": ["pdf"],
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

export async function updateFindingWorkflow(formData: FormData) {
  const findingId = String(formData.get("finding_id") || "");
  const requestedStatus = String(formData.get("status") || "");
  const assigneeId = String(formData.get("assignee_id") || "");
  const resolutionSummary = String(formData.get("resolution_summary") || "").trim();
  if (!findingId || !findingStatuses.includes(requestedStatus as typeof findingStatuses[number])) throw new Error("Finding hoặc trạng thái không hợp lệ.");

  const { supabase, profile } = await authenticatedContext();
  if (profile.role !== "admin" && profile.role !== "editor") throw new Error("Bạn không có quyền cập nhật finding.");

  const { data: finding, error: readError } = await supabase.from("findings").select("status,created_by,assignee_id").eq("id", findingId).single();
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
  if ((requestedStatus === "resolved" || requestedStatus === "closed") && !resolutionSummary) throw new Error("Resolved/closed bắt buộc có tóm tắt xử lý.");

  const { error } = await supabase.from("findings").update({ status: requestedStatus, assignee_id: assigneeId || null, resolution_summary: resolutionSummary || null }).eq("id", findingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/findings/${findingId}`);
  revalidatePath("/findings");
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
  if (!allowedMimeTypes.has(file.type)) throw new Error("Chỉ chấp nhận PDF, DOCX, XLSX, PPTX, PNG hoặc JPEG.");
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
type DocumentExtras = { processId:string|null; scopes:{dimension:ScopeDimension; vocabulary_value_id:string}[]; tagIds:string[] };
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
  if(!allowedMimeTypes.has(value.type)) throw new Error("Chỉ nhận PDF, DOCX, XLSX, PPTX, PNG hoặc JPEG.");
  const extension=value.name.split(".").pop()?.toLowerCase()||"";
  if(!allowedFileExtensions[value.type]?.includes(extension)) throw new Error("Định dạng và phần mở rộng file không khớp.");
  return value;
}
async function validateDraftForm(
  supabase:Awaited<ReturnType<typeof createSupabaseServerClient>>,
  data:FormData
):Promise<{metadata:DocumentDraftMetadata;extras:DocumentExtras}> {
  const valid_from=optionalDate(data,"valid_from");
  const valid_until=optionalDate(data,"valid_until");
  if(valid_from&&valid_until&&valid_until<valid_from)throw new Error("Ngày kết thúc phải từ ngày bắt đầu hiệu lực trở đi.");
  const document_type_value_id=optionalString(data,"document_type_value_id",80);
  let document_group=optionalString(data,"document_group",100)||"other";
  if(!documentGroups.includes(document_group)) throw new Error("Nhóm tài liệu không hợp lệ.");
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
  return {metadata,extras:{processId,scopes,tagIds}};
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
    .select("id,status,created_by,owner_id").eq("id",versionId).maybeSingle();
  if(readError||!current)throw new Error("Không tìm thấy phiên bản tài liệu.");
  if(!["draft","rejected"].includes(current.status))throw new Error("Chỉ chỉnh sửa bản nháp hoặc bị từ chối.");
  if(profile.role==="editor"&&current.created_by!==user.id&&current.owner_id!==user.id)
    throw new Error("Bạn không phụ trách tài liệu này.");
  const {metadata,extras}=await validateDraftForm(supabase,formData);
  if(!metadata.title_vi)throw new Error("Tên tài liệu không được để trống.");
  const {data:updated,error}=await supabase.from("document_versions").update(metadata).eq("id",versionId).select("id").single();
  if(error||!updated)throw new Error(error?.message||"Không thể lưu metadata.");
  await saveDocumentRelations(supabase,user.id,versionId,extras,true);
  revalidatePath("/documents");
  redirect("/documents?updated=1");
}
