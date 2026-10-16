import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentAccount() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, profile: null };
  const { data: profile } = await supabase.from("profiles").select("id, display_name, role, is_active").eq("id", user.id).maybeSingle();
  return { supabase, user, profile };
}

export async function requireActiveAccount() {
  const account = await getCurrentAccount();
  if (!account.user) redirect("/login?error=required");
  if (!account.profile?.is_active) redirect("/login?error=inactive");
  return account as typeof account & { user: NonNullable<typeof account.user>; profile: NonNullable<typeof account.profile> };
}
