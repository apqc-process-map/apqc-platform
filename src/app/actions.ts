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