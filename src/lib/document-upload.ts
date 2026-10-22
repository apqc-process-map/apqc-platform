"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const MAX_DOCUMENT_BYTES=26_214_400;
const allowed:Record<string,string[]>={
  "application/pdf":["pdf"],
  "application/msword":["doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":["docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":["xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":["pptx"],
  "image/png":["png"],
  "image/jpeg":["jpg","jpeg"]
};

export function validateDocumentFile(file:File){
  if(!file.size)throw new Error("Vui lòng chọn file.");
  if(file.size>MAX_DOCUMENT_BYTES)throw new Error("File vượt quá 25 MB.");
  const extension=file.name.split(".").pop()?.toLowerCase()||"";
  if(!allowed[file.type]?.includes(extension))throw new Error("Chỉ nhận PDF, DOC, DOCX, XLSX, PPTX, PNG, JPG hoặc JPEG.");
}

export async function uploadPrivateDocumentFile(documentVersionId:string,file:File){
  validateDocumentFile(file);
  const extension=file.name.split(".").pop()!.toLowerCase();
  const supabase=createSupabaseBrowserClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user)throw new Error("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
  // Upload goes directly from the authenticated browser to private Storage,
  // avoiding Vercel's 4.5 MB function payload limit.
  const fileBuffer=await file.arrayBuffer();
  const digest=await crypto.subtle.digest("SHA-256",fileBuffer);
  const checksum=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
  const storageKey=documentVersionId+"/"+crypto.randomUUID()+"."+extension;
  const upload=await supabase.storage.from("process-documents").upload(storageKey,file,{
    contentType:file.type,upsert:false
  });
  if(upload.error)throw new Error("Không thể tải file: "+upload.error.message);
  const saved=await supabase.from("document_files").insert({
    document_version_id:documentVersionId,
    storage_bucket:"process-documents",storage_key:storageKey,
    original_file_name:file.name.slice(0,255),mime_type:file.type,
    size_bytes:file.size,checksum_sha256:checksum,uploaded_by:user.id
  });
  if(saved.error){
    await supabase.storage.from("process-documents").remove([storageKey]);
    throw new Error("File đã tải lên nhưng không lưu được metadata: "+saved.error.message);
  }
}
