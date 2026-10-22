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
    const form=event.currentTarget;
    const data=new FormData(form);
    const versionId=String(data.get("document_version_id")||"");
    const file=data.get("file");
    if(!versionId||!(file instanceof File)||!file.size){setError("Vui lòng chọn tệp và phiên bản bản nháp.");return;}
    setBusy(true);setError("");setMessage("");
    try{
      await uploadPrivateDocumentFile(versionId,file);
      setMessage("Đã tải tệp lên và lưu thông tin.");
      form.reset();
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Không thể tải tệp.");}
    finally{setBusy(false);}
  }
  return <section className="data-panel document-admin-panel">
    <div className="data-panel-heading"><div>
      <p className="section-kicker">TỆP ĐÍNH KÈM</p>
      <h2>Thêm tệp vào bản nháp hiện có</h2>
      <p>Tệp mới được lưu riêng, không ghi đè tệp đã có.</p>
    </div><span className="count-chip">Tối đa 25 MB/tệp</span></div>
    <form className="document-upload-form" onSubmit={handleUpload}>
      <label>Phiên bản tài liệu<select name="document_version_id" required>{versions.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
      <label>Chọn tệp<input type="file" name="file" accept=".pdf,.doc,.docx,.xlsx,.pptx,.png,.jpg,.jpeg" required/></label>
      <button type="submit" className="primary-button" disabled={busy}>{busy?"Đang tải lên…":"Tải tệp lên"}</button>
    </form>
    {error&&<p role="alert" className="document-intake-error">{error}</p>}
    {message&&<p role="status" className="document-intake-success">{message}</p>}
    <p className="form-note">Tệp được lưu trong kho riêng tư; hệ thống ghi nhận mã kiểm tra SHA-256 để đối chiếu tính toàn vẹn.</p>
  </section>;
}
