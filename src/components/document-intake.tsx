import { createDocumentDraft, updateDocumentMetadata } from "@/app/actions";
type Option={id:string;label:string};
type Existing={id:string;title_vi:string;title_en?:string|null;document_group:string;language:string;document_abstract?:string|null;change_summary:string;valid_from?:string|null;valid_until?:string|null;review_due_at?:string|null;issuing_department?:string|null;applicability_note?:string|null;keywords?:string|null;owner_id?:string|null;document_type_value_id?:string|null;};
export default function DocumentIntake({processes,people,types,existing}:{
  processes:Option[];people:Option[];types:Option[];existing?:Existing|null;
}) {
 const editing=!!existing;
 const formId=editing?"document-edit":"document-create";
 return <section className="data-panel document-admin-panel" id={formId}>
   <div className="data-panel-heading"><div><p className="section-kicker">DOCUMENT INTAKE</p>
     <h2>{editing?"Bổ sung / sửa metadata":"Tạo & upload tài liệu mới"}</h2>
     <p>{editing?"Chỉnh sửa thông tin bản nháp trước khi duyệt.":"Chỉ cần chọn file hoặc nhập tên. Các trường metadata đều tùy chọn và có thể bổ sung sau."}</p>
   </div><span className="count-chip">{editing?"EDIT DRAFT":"PRIVATE STORAGE"}</span></div>
   <form action={editing?updateDocumentMetadata:createDocumentDraft} className="document-upload-form" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16,alignItems:"end"}}>
     {editing&&<input type="hidden" name="document_version_id" value={existing.id}/>}
     <label style={{gridColumn:"1 / -1"}}>Tên tài liệu (tự lấy tên file nếu bỏ trống)
       <input type="text" name="title_vi" maxLength={255} defaultValue={existing?.title_vi||""} placeholder="VD: Quy trình xử lý đơn hàng"/></label>
     {!editing&&<label style={{gridColumn:"1 / -1"}}>Chọn file (không bắt buộc nếu chỉ tạo metadata)
       <input name="file" type="file" accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg"/>
       <small>PDF, DOCX, XLSX, PPTX, PNG, JPG/JPEG — tối đa 25 MB, lưu riêng tư.</small></label>}
     <label>Tên tiếng Anh<input name="title_en" type="text" maxLength={255} defaultValue={existing?.title_en||""}/></label>
     <label>Nhóm tài liệu<select name="document_group" defaultValue={existing?.document_group||"other"}>
       {[["other","Khác / chưa phân nhóm"],["governance","Quản trị / chính sách"],["execution","Quy trình / hướng dẫn"],["communication","Thông báo / truyền thông"],["evidence","Hồ sơ / bằng chứng"],["planning","Kế hoạch / dự án"],["external","Tài liệu ngoài / pháp lý"]].map(([value,label])=><option key={value} value={value}>{label}</option>)}
     </select></label>
     <label>Loại tài liệu<select name="document_type_value_id" defaultValue={existing?.document_type_value_id||""}><option value="">— Chưa chọn —</option>{types.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
     <label>Quy trình liên quan<select name="process_id" defaultValue=""><option value="">— Bổ sung sau —</option>{processes.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
     <label>Người phụ trách<select name="owner_id" defaultValue={existing?.owner_id||""}><option value="">— Chưa chọn —</option>{people.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
     <label>Đơn vị ban hành<input name="issuing_department" maxLength={255} defaultValue={existing?.issuing_department||""} placeholder="VD: Khối Bán lẻ"/></label>
     <label>Ngôn ngữ<select name="language" defaultValue={existing?.language||"vi"}><option value="vi">Tiếng Việt</option><option value="en">Tiếng Anh</option><option value="vi-en">Song ngữ</option></select></label>
     <label>Từ khóa<input name="keywords" maxLength={1000} defaultValue={existing?.keywords||""} placeholder="VD: bán hàng, cửa hàng"/></label>
     <label>Ngày bắt đầu hiệu lực<input type="date" name="valid_from" defaultValue={existing?.valid_from||""}/></label>
     <label>Ngày hết hiệu lực<input type="date" name="valid_until" defaultValue={existing?.valid_until||""}/></label>
     <label>Ngày rà soát tiếp theo<input type="date" name="review_due_at" defaultValue={existing?.review_due_at||""}/></label>
     <label style={{gridColumn:"1 / -1"}}>Tóm tắt nội dung<textarea name="document_abstract" rows={2} maxLength={3000} defaultValue={existing?.document_abstract||""} placeholder="Mô tả ngắn mục đích và nội dung..."/></label>
     <label style={{gridColumn:"1 / -1"}}>Phạm vi áp dụng<textarea name="applicability_note" rows={2} maxLength={2000} defaultValue={existing?.applicability_note||""} placeholder="Đơn vị, khu vực, đối tượng áp dụng..."/></label>
     <label style={{gridColumn:"1 / -1"}}>Ghi chú thay đổi<textarea name="change_summary" rows={2} maxLength={2000} defaultValue={existing?.change_summary||""}/></label>
     <div style={{gridColumn:"1 / -1",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
       <button type="submit" className="primary-button">{editing?"Lưu metadata":"Tạo bản nháp & upload"}</button>
       {editing&&<a href="/documents" className="text-button">Hủy chỉnh sửa</a>}
       <small>Chỉ Admin/Editor được tạo và sửa bản nháp. Việc xuất bản cần quy trình liên quan và thông tin hiệu lực.</small>
     </div>
   </form>
 </section>;
}
