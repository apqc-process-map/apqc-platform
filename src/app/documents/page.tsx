import WorkspaceShell from "@/components/workspace-shell";
import DocumentIntake from "@/components/document-intake";
import DocumentFileUploader from "@/components/document-file-uploader";
import { updateDocumentLifecycle } from "@/app/actions";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

const statuses = ["draft", "in_review", "rejected", "approved", "scheduled", "effective", "cancelled", "superseded", "archived"];
const documentGroups = ["governance", "execution", "communication", "evidence", "planning", "external", "other"];
const sortOptions = [
  ["updated_desc", "Cập nhật mới nhất"],
  ["updated_asc", "Cập nhật cũ nhất"],
  ["title_asc", "Tên A → Z"],
  ["title_desc", "Tên Z → A"],
  ["review_asc", "Hạn rà soát gần nhất"],
  ["valid_from_desc", "Hiệu lực mới nhất"],
] as const;

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string; group?: string; language?: string; access?: string; risk?: string; owner?: string; sort?: string; compare?: string; preview?: string; edit?: string; created?: string; updated?: string }> }) {
  const { q = "", status = "all", type = "all", group = "all", language = "all", access = "all", risk = "all", owner = "all", sort = "updated_desc", compare, preview, edit, created, updated } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  let query = supabase.from("document_versions").select("id, document_id, version_number, status, title_vi, title_en, document_group, language, document_abstract, change_summary, valid_from, valid_until, review_due_at, access_level, risk_rating, issuing_department, keywords, legal_reference, retention_note, updated_at, owner_id, created_by, document_type_value_id, vocabulary_values(label_vi), documents(document_code), document_files(id, original_file_name, mime_type, size_bytes)").limit(100);
  if (q.trim()) query = query.or(`title_vi.ilike.%${q.trim()}%,title_en.ilike.%${q.trim()}%,document_abstract.ilike.%${q.trim()}%,keywords.ilike.%${q.trim()}%,issuing_department.ilike.%${q.trim()}%`);
  if (status !== "all") query = query.eq("status", status);
  if (type !== "all") query = query.eq("document_type_value_id", type);
  if (group !== "all") query = query.eq("document_group", group);
  if (language !== "all") query = query.eq("language", language);
  if (access !== "all") query = query.eq("access_level", access);
  if (risk !== "all") query = query.eq("risk_rating", risk);
  if (owner !== "all") query = query.eq("owner_id", owner);
  if (sort === "updated_asc") query = query.order("updated_at", { ascending: true });
  else if (sort === "title_asc") query = query.order("title_vi", { ascending: true });
  else if (sort === "title_desc") query = query.order("title_vi", { ascending: false });
  else if (sort === "review_asc") query = query.order("review_due_at", { ascending: true, nullsFirst: false });
  else if (sort === "valid_from_desc") query = query.order("valid_from", { ascending: false, nullsFirst: false });
  else query = query.order("updated_at", { ascending: false });
  const { data: versions, error } = await query;
  const selected = compare ? (versions || []).find((item) => item.id === compare) : null;
  const previous = selected ? (versions || []).filter((item) => item.document_id === selected.document_id && item.version_number < selected.version_number).sort((a, b) => b.version_number - a.version_number)[0] : null;
  const files = (versions || []).flatMap((item) => ((item.document_files as unknown as { id: string; original_file_name: string; mime_type: string; size_bytes: number }[]) || []).map((file) => ({ ...file, versionTitle: item.title_vi })));
  const previewFile = preview ? files.find((file) => file.id === preview) : null;
  const canEdit = profile.role === "admin" || profile.role === "editor";
  const scopeDimensions = ["legal_entity","department","location","channel","product_service","employee_audience"];
  const [processRows, peopleRows, typeRows, scopeRows, tagRows, editingResult, linkedRows, appliedRows, markedRows] = await Promise.all([
    canEdit ? supabase.from("processes").select("id,process_code,process_versions(name_vi)").order("display_order").limit(150) : Promise.resolve({data: []}),
    supabase.from("profiles").select("id,display_name,role").eq("is_active",true).order("display_name"),
    supabase.from("vocabulary_values").select("id,label_vi,document_group_code,vocabularies!inner(code)").eq("vocabularies.code","document_type").eq("is_active",true).order("display_order"),
    canEdit ? supabase.from("vocabulary_values").select("id,label_vi,vocabularies!inner(code)").in("vocabularies.code",scopeDimensions).eq("is_active",true).order("display_order") : Promise.resolve({data: []}),
    canEdit ? supabase.from("governance_tags").select("id,label_vi").eq("is_active",true).order("label_vi") : Promise.resolve({data: []}),
    canEdit && edit ? supabase.from("document_versions").select("id,title_vi,title_en,document_group,language,document_abstract,change_summary,valid_from,valid_until,review_due_at,issuing_department,applicability_note,keywords,owner_id,designated_approver_id,document_type_value_id,risk_rating,legal_reference,retention_note,access_level,status,created_by").eq("id",edit).maybeSingle() : Promise.resolve({data:null}),
    canEdit && edit ? supabase.from("document_process_links").select("process_id,link_role").eq("document_version_id",edit).eq("link_role","primary").limit(1) : Promise.resolve({data: []}),
    canEdit && edit ? supabase.from("object_applicability").select("dimension,vocabulary_value_id").eq("object_type","document_version").eq("object_id",edit) : Promise.resolve({data: []}),
    canEdit && edit ? supabase.from("object_tags").select("tag_id").eq("object_type","document_version").eq("object_id",edit) : Promise.resolve({data: []}),
  ]);
  const availableProcesses = ((processRows.data||[]) as unknown as {id:string;process_code:string;process_versions:{name_vi:string}[]|null}[]).map(row=>({id:row.id,label:row.process_code+" · "+(row.process_versions?.[0]?.name_vi || "Quy trình")}));
  const people = (peopleRows.data||[]) as {id:string;display_name:string;role:string}[];
  const availablePeople = people.map(row=>({id:row.id,label:row.display_name}));
  const availableApprovers = people.filter(row=>row.role==="admin").map(row=>({id:row.id,label:row.display_name}));
  const availableTypes = ((typeRows.data||[]) as {id:string;label_vi:string;document_group_code:string|null}[]).map(row=>({id:row.id,label:row.label_vi,group:row.document_group_code||"other"}));
  const availableScopeOptions:Record<string,{id:string;label:string}[]> = Object.fromEntries(scopeDimensions.map(d=>[d,[]]));
  for (const row of ((scopeRows.data||[]) as unknown as {id:string;label_vi:string;vocabularies:{code:string}|{code:string}[]}[])) {
    const vocab = Array.isArray(row.vocabularies)?row.vocabularies[0]:row.vocabularies;
    if (vocab?.code&&availableScopeOptions[vocab.code]) availableScopeOptions[vocab.code].push({id:row.id,label:row.label_vi});
  }
  const availableTags = ((tagRows.data||[]) as {id:string;label_vi:string}[]).map(row=>({id:row.id,label:row.label_vi}));
  const editingDocument = editingResult.data && ["draft","rejected"].includes(editingResult.data.status)
    && (profile.role==="admin" || editingResult.data.created_by===profile.id || editingResult.data.owner_id===profile.id)
    ? editingResult.data : null;
  const currentScope:Record<string,string[]> = {};
  for(const row of ((appliedRows.data||[]) as {dimension:string;vocabulary_value_id:string|null}[])){
    if(!row.vocabulary_value_id)continue;
    (currentScope[row.dimension] ||= []).push(row.vocabulary_value_id);
  }
  const currentTags = ((markedRows.data||[]) as {tag_id:string}[]).map(row=>row.tag_id);
  const primaryProcessId = ((linkedRows.data||[]) as {process_id:string}[])[0]?.process_id||null;

  const comparisonRows = selected ? [
    ["Tiêu đề tiếng Việt", previous?.title_vi, selected.title_vi],
    ["Tiêu đề tiếng Anh", previous?.title_en, selected.title_en],
    ["Nhóm tài liệu", previous?.document_group, selected.document_group],
    ["Ngôn ngữ", previous?.language, selected.language],
    ["Phân loại truy cập", previous?.access_level, selected.access_level],
    ["Rủi ro", previous?.risk_rating, selected.risk_rating],
    ["Đơn vị ban hành", previous?.issuing_department, selected.issuing_department],
    ["Từ khóa", previous?.keywords, selected.keywords],
    ["Căn cứ ban hành", previous?.legal_reference, selected.legal_reference],
    ["Lưu trữ", previous?.retention_note, selected.retention_note],
    ["Tóm tắt", previous?.document_abstract, selected.document_abstract],
    ["Thay đổi", previous?.change_summary, selected.change_summary],
    ["Hiệu lực từ", previous?.valid_from, selected.valid_from],
    ["Hiệu lực đến", previous?.valid_until, selected.valid_until],
    ["Review due", previous?.review_due_at, selected.review_due_at],
    ["Trạng thái", previous?.status, selected.status],
  ] : [];

  return <WorkspaceShell active="/documents" eyebrow="DOCUMENT CONTROL" title="Documents" description="Thư viện tài liệu riêng tư với version, validity và review cadence." userName={profile.display_name} role={profile.role}>
    {(created || updated) && <div className="state-message" role="status"><strong>{created ? "Đã tạo bản nháp tài liệu." : "Đã lưu metadata."}</strong><span>Thông tin đã lưu trong Supabase.</span></div>}
    {canEdit && <DocumentIntake processes={availableProcesses} people={availablePeople} approvers={availableApprovers} types={availableTypes} scopeOptions={availableScopeOptions} tags={availableTags} existing={editingDocument} primaryProcessId={editingDocument?primaryProcessId:null} selectedScopes={editingDocument?currentScope:{}} selectedTags={editingDocument?currentTags:[]}/>}
    <section className="document-library-controls" aria-labelledby="document-library-filter-title">
      <div className="document-library-controls-heading">
        <div><p className="section-kicker">DOCUMENT LIBRARY</p><h2 id="document-library-filter-title">Tìm, lọc và sắp xếp</h2></div>
        <a className="text-button" href="/documents">Xóa bộ lọc</a>
      </div>
      <form className="document-filter-form">
        <label className="document-filter-search">Tìm kiếm
          <input name="q" defaultValue={q} placeholder="Tên, tóm tắt, từ khóa, đơn vị ban hành…" />
        </label>
        <label>Trạng thái<select name="status" defaultValue={status}><option value="all">Tất cả</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Loại tài liệu<select name="type" defaultValue={type}><option value="all">Tất cả</option>{availableTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Nhóm<select name="group" defaultValue={group}><option value="all">Tất cả</option>{documentGroups.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Ngôn ngữ<select name="language" defaultValue={language}><option value="all">Tất cả</option><option value="vi">Tiếng Việt</option><option value="en">Tiếng Anh</option><option value="vi-en">Song ngữ</option></select></label>
        <label>Quyền truy cập<select name="access" defaultValue={access}><option value="all">Tất cả</option><option value="internal">Nội bộ</option><option value="limited">Giới hạn</option><option value="confidential">Bảo mật</option><option value="highly_restricted">Hạn chế cao</option></select></label>
        <label>Rủi ro<select name="risk" defaultValue={risk}><option value="all">Tất cả</option><option value="low">Thấp</option><option value="medium">Trung bình</option><option value="high">Cao</option><option value="critical">Trọng yếu</option></select></label>
        <label>Chủ sở hữu<select name="owner" defaultValue={owner}><option value="all">Tất cả</option>{availablePeople.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Sắp xếp<select name="sort" defaultValue={sort}>{sortOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button type="submit">Áp dụng</button>
      </form>
    </section>

    {canEdit && (versions||[]).some(item=>["draft","rejected"].includes(item.status)) &&
      <DocumentFileUploader versions={(versions||[]).filter(item=>["draft","rejected"].includes(item.status)).map(item=>({
        id:item.id,label:item.title_vi+" · v"+item.version_number
      }))}/>}
    
    {previewFile ? <section className="data-panel document-preview-panel"><div className="data-panel-heading"><div><p className="section-kicker">SECURE PREVIEW</p><h2>{previewFile.original_file_name}</h2></div><a className="text-button" href="/documents">Đóng preview</a></div>{previewFile.mime_type === "application/pdf" ? <iframe title={`Preview ${previewFile.original_file_name}`} src={`/documents/files/${previewFile.id}`} /> : previewFile.mime_type.startsWith("image/") ? <img src={`/documents/files/${previewFile.id}`} alt={previewFile.original_file_name} /> : <div className="state-message"><strong>Office file không hỗ trợ preview an toàn trong trình duyệt.</strong><a className="primary-button" href={`/documents/files/${previewFile.id}`}>Tải file</a></div>}</section> : null}

    {selected ? <section className="compare-panel"><div className="data-panel-heading"><div><p className="section-kicker">VERSION COMPARISON</p><h2>{selected.title_vi}</h2></div><a href="/documents">Đóng so sánh</a></div><div className="comparison-table" role="table" aria-label="So sánh metadata"><div className="comparison-row heading" role="row"><strong>Trường</strong><strong>{previous ? `v${previous.version_number}` : "Phiên bản trước"}</strong><strong>v{selected.version_number}</strong></div>{comparisonRows.map(([label, oldValue, newValue]) => <div className={`comparison-row${String(oldValue || "") !== String(newValue || "") ? " changed" : ""}`} role="row" key={label}><span>{label}</span><span>{oldValue || "—"}</span><span>{newValue || "—"}</span></div>)}</div></section> : null}

    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">PRIVATE LIBRARY</p><h2>{versions?.length || 0} phiên bản</h2></div><span className="count-chip">25 MB / file</span></div>{error ? <div className="state-message error-state"><strong>Không thể tải tài liệu</strong><span>{error.message}</span></div> : !versions?.length ? <div className="state-message"><strong>Chưa có tài liệu</strong><span>Editor có thể tạo metadata và upload PDF, Office hoặc ảnh vào bucket private.</span></div> : <div className="document-grid">{versions.map((item) => { const document = item.documents as unknown as { document_code: string } | null; const docType = item.vocabulary_values as unknown as {label_vi:string}|null; const itemFiles = (item.document_files as unknown as { id: string; original_file_name: string; mime_type: string; size_bytes: number }[]) || []; return <article className="document-card" key={item.id}><div className="document-icon">{itemFiles[0]?.mime_type.includes("pdf") ? "PDF" : itemFiles[0] ? "FILE" : "META"}</div><div><span className="mono-code">{document?.document_code || "—"} · v{item.version_number}</span><h3>{item.title_vi}</h3><p>{item.document_abstract || "Chưa có tóm tắt."}</p><div className="document-card-metadata">{docType?.label_vi&&<span>Loại: {docType.label_vi}</span>}<span>Nhóm: {item.document_group}</span><span>Ngôn ngữ: {item.language}</span><span>Truy cập: {item.access_level}</span>{item.risk_rating&&<span>Rủi ro: {item.risk_rating}</span>}{item.owner_id&&<span>Chủ sở hữu: {availablePeople.find(person=>person.id===item.owner_id)?.label||"—"}</span>}{item.issuing_department&&<span>Ban hành: {item.issuing_department}</span>}{item.valid_from&&<span>Hiệu lực: {item.valid_from}</span>}{item.valid_until&&<span>Hết hiệu lực: {item.valid_until}</span>}{item.keywords&&<span>Từ khóa: {item.keywords}</span>}</div><footer><span className="status-badge">{item.status}</span><span>{item.review_due_at ? `Review ${item.review_due_at}` : "Chưa đặt review"}</span>{itemFiles.map((file) => <a key={file.id} href={file.mime_type === "application/pdf" || file.mime_type.startsWith("image/") ? `/documents?preview=${file.id}` : `/documents/files/${file.id}`}>{file.mime_type === "application/pdf" || file.mime_type.startsWith("image/") ? "Xem" : "Tải"} {file.original_file_name}</a>)}<a href={`/documents?compare=${item.id}`}>So sánh metadata</a>{canEdit && ["draft","rejected"].includes(item.status) && <a href={`/documents?edit=${item.id}#document-edit`}>Sửa metadata</a>}</footer>{canEdit ? <form className="document-lifecycle-form" action={updateDocumentLifecycle}><input type="hidden" name="document_version_id" value={item.id}/><select name="status" defaultValue={item.status} aria-label={`Trạng thái ${item.title_vi}`}>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select><button type="submit" className="text-button">Cập nhật</button></form> : null}</div></article>})}</div>}</section>
  </WorkspaceShell>;
}
