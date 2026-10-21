"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createDocumentDraft, updateDocumentMetadata } from "@/app/actions";
import { uploadPrivateDocumentFile, validateDocumentFile } from "@/lib/document-upload";

type Option = { id:string; label:string; group?:string };
type KnowledgeLevel = "must" | "should" | "none";
const knowledgeGroups: { key: KnowledgeLevel; label: string; description: string; field: string }[] = [
  { key:"must", label:"Phải biết", description:"Cần hiểu và tuân thủ để thực hiện trách nhiệm", field:"knowledge_must" },
  { key:"should", label:"Nên biết / tham chiếu", description:"Hữu ích khi phối hợp hoặc phát sinh nghiệp vụ", field:"knowledge_should" },
  { key:"none", label:"Không áp dụng", description:"Không thuộc phạm vi kiến thức cần thiết của chức danh", field:"knowledge_none" },
];
type Existing = {
  id:string; title_vi:string; title_en?:string|null; document_group:string; language:string;
  document_abstract?:string|null; change_summary:string; valid_from?:string|null; valid_until?:string|null;
  review_due_at?:string|null; issuing_department?:string|null; applicability_note?:string|null;
  keywords?:string|null; owner_id?:string|null; designated_approver_id?:string|null;
  document_type_value_id?:string|null; legal_reference?:string|null; retention_note?:string|null;
  risk_rating?:string|null; access_level?:string|null;
};
type Props = {
  processes:Option[]; people:Option[]; approvers:Option[]; types:Option[]; businessRoles:Option[];
  canManageKnowledge:boolean; selectedKnowledge?:Record<string,KnowledgeLevel>;
  scopeOptions:Record<string,Option[]>; tags:Option[];
  existing?:Existing|null; primaryProcessId?:string|null; selectedScopes?:Record<string,string[]>; selectedTags?:string[];
};
const groups=[
  ["governance","Quản trị / chính sách"],
  ["execution","Quy trình / thực thi"],
  ["communication","Truyền thông / hướng dẫn"],
  ["evidence","Hồ sơ / bằng chứng"],
  ["planning","Kế hoạch / dự án"],
  ["external","Pháp lý / tài liệu ngoài"],
  ["other","Khác"]
];
const dimensions=[
  ["legal_entity","Đơn vị pháp nhân"],
  ["department","Phòng ban / khối áp dụng"],
  ["location","Địa bàn / khu vực"],
  ["channel","Kênh hoạt động"],
  ["product_service","Sản phẩm / dịch vụ"],
  ["employee_audience","Đối tượng nhân viên"]
];
const accessLevels=[
  ["internal","Nội bộ · tất cả vai trò"],
  ["limited","Giới hạn · Editor & Admin"],
  ["confidential","Bảo mật · Editor & Admin"],
  ["highly_restricted","Hạn chế cao · chỉ Admin"]
];
function DateField({name,label,value}:{name:string;label:string;value?:string|null}){
  return <label>{label}<input name={name} type="date" defaultValue={value||""}/></label>;
}
export default function DocumentIntake({
  processes,people,approvers,types,businessRoles,canManageKnowledge,selectedKnowledge={},
  scopeOptions,tags,existing,primaryProcessId,selectedScopes={},selectedTags=[]
}:Props){
  const editing=!!existing;
  const router=useRouter();
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState("");
  const [typeId,setTypeId]=useState(existing?.document_type_value_id||"");
  const [knowledge,setKnowledge]=useState<Record<string,KnowledgeLevel>>(selectedKnowledge);
  const derivedGroup=types.find(type=>type.id===typeId)?.group;
  const groupLabel=groups.find(([code])=>code===(derivedGroup||existing?.document_group?.toLowerCase()||"other"))?.[1]||"Chưa phân loại";
  async function handleCreate(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(uploading)return;
    const data=new FormData(event.currentTarget);
    const input=data.get("file");
    const file=input instanceof File&&input.size>0?input:null;
    if(!file&&!String(data.get("title_vi")||"").trim()){
      setError("Vui lòng chọn file hoặc nhập tên tài liệu.");
      return;
    }
    if(file){
      try{validateDocumentFile(file);}catch(cause){setError(cause instanceof Error?cause.message:"File không hợp lệ.");return;}
    }
    if(file&&!String(data.get("title_vi")||"").trim())
      data.set("title_vi",file.name.replace(/\\.[^.]+$/,"").slice(0,255));
    data.delete("file");
    setError("");
    setUploading(true);
    let created=false;
    try{
      const {versionId}=await createDocumentDraft(data);
      created=true;
      if(file)await uploadPrivateDocumentFile(versionId,file);
      router.push("/documents?created=1");
      router.refresh();
    }catch(cause){
      const message=cause instanceof Error?cause.message:"Có lỗi xảy ra khi lưu tài liệu.";
      setError((created?"Bản nháp đã được tạo nhưng chưa đính kèm file. Bạn có thể thêm file ở bên dưới. ":"")+message);
    }finally{setUploading(false);}
  }
  return <section className="data-panel document-admin-panel" id={editing?"document-edit":"document-create"}>
    <div className="data-panel-heading"><div>
      <p className="section-kicker">DOCUMENT INTAKE</p>
      <h2>{editing?"Bổ sung / sửa metadata tài liệu":"Tạo & upload tài liệu mới"}</h2>
      <p>Chỉ cần tên hoặc file để lưu bản nháp. Mọi metadata còn lại đều tùy chọn, có thể bổ sung sau.</p>
    </div><span className="count-chip">{editing?"EDIT DRAFT":"PRIVATE STORAGE"}</span></div>
    <form action={editing?updateDocumentMetadata:undefined} onSubmit={editing?undefined:handleCreate} className="document-intake-form">
      {editing&&<input type="hidden" name="document_version_id" value={existing.id}/>}
      <div className="document-meta-block">
        <h3>Thông tin cơ bản</h3>
        <div className="document-meta-grid">
          <label className="document-meta-wide">Tên tài liệu
            <input name="title_vi" maxLength={255} defaultValue={existing?.title_vi||""} placeholder="Nếu để trống, hệ thống lấy tên file"/>
          </label>
          {!editing&&<label className="document-meta-wide">File đính kèm
            <input name="file" type="file" accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg"/>
            <small>PDF, Word, Excel, PowerPoint hoặc ảnh · tối đa 25 MB · lưu riêng tư</small>
          </label>}
          <label>Loại tài liệu<select name="document_type_value_id" value={typeId} onChange={event=>setTypeId(event.target.value)}>
            <option value="">— Chưa phân loại —</option>
            {groups.map(([code,label])=><optgroup key={code} label={label}>{types.filter(item=>item.group===code).map(item=><option value={item.id} key={item.id}>{item.label}</option>)}</optgroup>)}
          </select></label>
          <div className="document-scope-group" aria-live="polite">
            <strong>Nhóm tài liệu (tự động)</strong>
            <span>{groupLabel}</span>
            <small>Nhóm được xác định theo loại; không cần nhập lần hai.</small>
          </div>
          <label>Tên tiếng Anh<input name="title_en" maxLength={255} defaultValue={existing?.title_en||""}/></label>
          <label>Ngôn ngữ<select name="language" defaultValue={existing?.language||"vi"}>
            <option value="vi">Tiếng Việt</option><option value="en">Tiếng Anh</option><option value="vi-en">Song ngữ</option>
          </select></label>
          <label className="document-meta-wide">Tóm tắt nội dung<textarea name="document_abstract" rows={2} maxLength={3000} defaultValue={existing?.document_abstract||""} placeholder="Mục đích, nội dung chính và giá trị sử dụng"/></label>
          <label className="document-meta-wide">Từ khóa<input name="keywords" maxLength={1000} defaultValue={existing?.keywords||""} placeholder="Ví dụ: bán hàng, cửa hàng, kiểm kê"/></label>
        </div>
      </div>
      <details className="document-meta-block" open={editing}>
        <summary>Phân loại & phạm vi áp dụng <small>· không bắt buộc</small></summary>
        <div className="document-meta-grid">
          <label className="document-meta-wide">Quy trình liên quan (chính)
            <select name="process_id" defaultValue={primaryProcessId||""}>
              <option value="">— Có thể bổ sung sau —</option>
              {processes.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="document-meta-wide">Mô tả phạm vi / ngoại lệ<textarea name="applicability_note" rows={2} maxLength={2000} defaultValue={existing?.applicability_note||""} placeholder="Đối tượng áp dụng, phạm vi, những trường hợp không áp dụng"/></label>
          {dimensions.map(([dimension,label])=><div key={dimension} className="document-scope-group">
            <strong>{label}</strong>
            <div className="document-meta-choice-group">
              {(scopeOptions[dimension]||[]).map(item=><label className="document-meta-choice" key={item.id}>
                <input name={"scope_"+dimension} type="checkbox" value={item.id} defaultChecked={(selectedScopes[dimension]||[]).includes(item.id)}/>
                <span>{item.label}</span>
              </label>)}
            </div>
            {!(scopeOptions[dimension]||[]).length&&<small>Chưa có danh mục áp dụng</small>}
          </div>)}
          <div className="document-meta-wide document-scope-group">
            <strong>Nhãn quản trị</strong>
            <div className="document-meta-choice-group">{tags.map(item=><label className="document-meta-choice" key={item.id}>
              <input type="checkbox" name="governance_tag_id" value={item.id} defaultChecked={selectedTags.includes(item.id)}/>
              <span>{item.label}</span>
            </label>)}</div>
          </div>
        </div>
      </details>
      <details className="document-meta-block" open={editing}>
        <summary>Trách nhiệm & quyền truy cập <small>· không bắt buộc</small></summary>
        <div className="document-meta-grid">
          <label>Chủ sở hữu tài liệu<select name="owner_id" defaultValue={existing?.owner_id||""}>
            <option value="">— Chưa chọn —</option>{people.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
          </select></label>
          <label>Người dự kiến phê duyệt<select name="designated_approver_id" defaultValue={existing?.designated_approver_id||""}>
            <option value="">— Chưa chọn —</option>{approvers.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
          </select><small>Người này chỉ được ghi nhận dự kiến, chưa thực hiện phê duyệt.</small></label>
          <label>Đơn vị ban hành<input name="issuing_department" maxLength={255} defaultValue={existing?.issuing_department||""} placeholder="Ví dụ: Khối Bán lẻ"/></label>
          <label>Mức truy cập<select name="access_level" defaultValue={existing?.access_level||"internal"}>
            {accessLevels.map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select><small>Quyền xem bản nháp phụ thuộc vai trò; Viewer chỉ xem bản hiệu lực.</small></label>
        </div>
      </details>
      <details className="document-meta-block" open={editing}>
        <summary>Đối tượng cần biết <small>· theo chức danh · không bắt buộc</small></summary>
        <p>Chọn nhiều chức danh cho từng nhóm. Mỗi chức danh chỉ thuộc một nhóm của cùng tài liệu; chưa chọn nghĩa là chưa xác định.</p>
        {!canManageKnowledge&&<p>Chỉ Admin được xác nhận phân loại kiến thức theo chức danh. Các trường dưới đây chỉ để xem.</p>}
        <div className="document-meta-grid">
          {knowledgeGroups.map(group=><div className="document-meta-wide document-scope-group" key={group.key}>
            <strong>{group.label} · {businessRoles.filter(role=>knowledge[role.id]===group.key).length} chức danh</strong>
            <small>{group.description}</small>
            <div className="document-meta-choice-group">
              {businessRoles.map(role=><label key={role.id} className="document-meta-choice">
                <input type="checkbox" name={canManageKnowledge?group.field:undefined} value={role.id}
                  checked={knowledge[role.id]===group.key} disabled={!canManageKnowledge}
                  onChange={event=>setKnowledge(current=>{
                    const next={...current};
                    if(event.target.checked)next[role.id]=group.key;
                    else if(next[role.id]===group.key)delete next[role.id];
                    return next;
                  })}/>
                <span>{role.label}</span>
              </label>)}
            </div>
          </div>)}
          <div className="document-meta-wide document-scope-group">
            <strong>Chưa xác định · {businessRoles.filter(role=>!knowledge[role.id]).length} chức danh</strong>
            <small>Không đồng nghĩa với "Không áp dụng". Chỉ những chức danh đã được phân loại mới được ghi nhận.</small>
            <span>{businessRoles.filter(role=>!knowledge[role.id]).map(role=>role.label).join(", ")||"Đã phân loại tất cả chức danh."}</span>
          </div>
        </div>
        <small>Phân loại kiến thức không tự cấp quyền xem tài liệu và không tự tạo yêu cầu xác nhận đã đọc.</small>
      </details>
      <details className="document-meta-block" open={editing}>
        <summary>Hiệu lực, kiểm soát & lưu trữ <small>· không bắt buộc</small></summary>
        <div className="document-meta-grid">
          <DateField name="valid_from" label="Ngày bắt đầu hiệu lực" value={existing?.valid_from}/>
          <DateField name="valid_until" label="Ngày hết hiệu lực" value={existing?.valid_until}/>
          <DateField name="review_due_at" label="Ngày rà soát tiếp theo" value={existing?.review_due_at}/>
          <label>Mức độ rủi ro<select name="risk_rating" defaultValue={existing?.risk_rating||""}>
            <option value="">— Chưa đánh giá —</option>
            <option value="low">Thấp</option><option value="medium">Trung bình</option>
            <option value="high">Cao</option><option value="critical">Trọng yếu</option>
          </select></label>
          <label className="document-meta-wide">Căn cứ ban hành / tài liệu pháp lý liên quan
            <textarea name="legal_reference" rows={2} maxLength={1500} defaultValue={existing?.legal_reference||""}/>
          </label>
          <label className="document-meta-wide">Lưu trữ / thời hạn lưu trữ
            <textarea name="retention_note" rows={2} maxLength={1500} defaultValue={existing?.retention_note||""}/>
          </label>
          <label className="document-meta-wide">Ghi chú thay đổi
            <textarea name="change_summary" rows={2} maxLength={2000} defaultValue={existing?.change_summary||""}/>
          </label>
        </div>
      </details>
      {error&&<p role="alert" className="document-intake-error">{error}</p>}
      <div className="document-intake-footer">
        <button type="submit" className="primary-button" disabled={uploading}>{uploading?"Đang lưu & upload…":editing?"Lưu metadata":"Tạo bản nháp & upload"}</button>
        {editing&&<a className="text-button" href="/documents">Hủy chỉnh sửa</a>}
        <small>Hệ thống tự ghi mã, phiên bản, người tạo, dung lượng và mã kiểm tra file. Không tự xuất bản.</small>
      </div>
    </form>
  </section>;
}
