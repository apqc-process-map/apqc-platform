"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { uploadPrivateDocumentFile } from "@/lib/document-upload";

type VersionOption={id:string;label:string};
export default function DocumentFileUploader({versions}:{versions:VersionOption[]}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  async function handleUpload(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    const data=new FormData(event.currentTarget);
    const versionId=String(data.get("document_version_id")||"");
    const file=data.get("file");
    if(!versionId||!(file instanceof File)||!file.size){setError("Vui lòng chọn file và bản nháp.");return;}
    setBusy(true);setError("");setMessage("");
    try{
      await uploadPrivateDocumentFile(versionId,file);
      setMessage("Đã tải file lên và lưu thông tin.");
      event.currentTarget?.reset();
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Không thể tải file.");}
    finally{setBusy(false);}
  }
  return <section className="data-panel document-admin-panel">
    <div className="data-panel-heading"><div>
      <p className="section-kicker">PRIVATE STORAGE</p>
      <h2>Thêm file vào bản nháp đã có</h2>
      <p>File mới được lưu riêng, không ghi đè phiên bản cũ.</p>
    </div><span className="count-chip">25 MB / file</span></div>
    <form className="document-upload-form" onSubmit={handleUpload}>
      <label>Phiên bản tài liệu<select name="document_version_id" required>{versions.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
      <label>Chọn file<input type="file" name="file" accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg" required/></label>
      <button type="submit" className="primary-button" disabled={busy}>{busy?"Đang tải lên…":"Upload private"}</button>
    </form>
    {error&&<p role="alert" className="document-intake-error">{error}</p>}
    {message&&<p role="status" className="document-intake-success">{message}</p>}
    <p className="form-note">Tải thẳng lên Supabase Storage bằng tài khoản đã đăng nhập; mã kiểm tra SHA-256 tính trong trình duyệt.</p>
  </section>;
}
