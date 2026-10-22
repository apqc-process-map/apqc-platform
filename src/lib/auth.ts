import { cache } from "react";
import { connection, after } from "next/server";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Every call below requires the current request's cookies and must never
// execute inside speculative Cache Components prerendering.
// React.cache scopes this lookup to a single request/render (not cross-user).
export const getCurrentAccount = cache(async function getCurrentAccount() {
  await connection();
  const authStart = performance.now();
  const reportAuth = () => {
    const elapsed = Math.round(performance.now() - authStart);
    if (elapsed >= 450) after(() => console.info(JSON.stringify({event:"apqc_slow_auth",elapsed_ms:elapsed})));
  };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) { reportAuth(); return { supabase, user: null, profile: null }; }
  const user = { id: claims.sub };
  const { data: profile } = await supabase.from("profiles")
    .select("id, display_name, role, is_active").eq("id", user.id).maybeSingle();
  reportAuth();
  return { supabase, user, profile };
});

export async function requireActiveAccount() {
  const account = await getCurrentAccount();
  if (!account.user) redirect("/login?error=required");
  if (!account.profile?.is_active) redirect("/login?error=inactive");
  return account as typeof account & { user: NonNullable<typeof account.user>; profile: NonNullable<typeof account.profile> };
}
