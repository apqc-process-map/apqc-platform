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

  const { supabase, user, profile } = await authenticatedContext();
  if (profile.role !== "admin" && profile.role !== "editor") throw new Error("Bạn không có quyền upload tài liệu.");

  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const checksum = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
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
