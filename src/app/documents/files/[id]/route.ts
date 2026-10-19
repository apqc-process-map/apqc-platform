import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: file, error } = await supabase.from("document_files").select("storage_bucket,storage_key,original_file_name,mime_type").eq("id", id).maybeSingle();
  if (error || !file) return NextResponse.json({ error: "File not found" }, { status: 404 });
  const { data: signed, error: signedError } = await supabase.storage.from(file.storage_bucket).createSignedUrl(file.storage_key, 60);
  if (signedError || !signed?.signedUrl) return NextResponse.json({ error: "Unable to create file access link" }, { status: 502 });
  return Response.redirect(signed.signedUrl, 302);
}