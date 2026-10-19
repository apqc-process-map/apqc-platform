"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function markNotificationRead(formData: FormData) {
  const notificationId = String(formData.get("notification_id") || "");
  if (!notificationId) return;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=required");
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId).eq("recipient_id", user.id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=required");
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", user.id).is("read_at", null);
  revalidatePath("/notifications");
}
export async function updateFindingWorkflow(formData: FormData) {
  const findingId = String(formData.get("finding_id") || "");
  const status = String(formData.get("status") || "");
  const assigneeId = String(formData.get("assignee_id") || "");
  const resolutionSummary = String(formData.get("resolution_summary") || "");
  if (!findingId || !status) return;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=required");
  await supabase.from("findings").update({ status, assignee_id: assigneeId || null, resolution_summary: resolutionSummary || null }).eq("id", findingId);
  revalidatePath(`/findings/${findingId}`);
  revalidatePath("/findings");
}

export async function setFindingReaction(formData: FormData) {
  const findingId = String(formData.get("finding_id") || "");
  const reaction = String(formData.get("reaction") || "");
  if (!findingId || !reaction) return;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=required");
  await supabase.from("finding_reactions").upsert({ finding_id: findingId, profile_id: user.id, reaction }, { onConflict: "finding_id,profile_id" });
  revalidatePath(`/findings/${findingId}`);
}