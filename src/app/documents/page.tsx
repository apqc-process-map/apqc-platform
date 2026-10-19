import WorkspaceShell from "@/components/workspace-shell";
import { updateDocumentLifecycle, uploadDocumentFile } from "@/app/actions";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

const statuses = ["draft", "in_review", "rejected", "approved", "scheduled", "effective", "cancelled", "superseded", "archived"];

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; compare?: string; preview?: string }> }) {
  const { q = "", status = "all", compare, preview } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  let query = supabase.from("document_versions").select("id, document_id, version_number, status, title_vi, title_en, document_group, language, document_abstract, change_summary, valid_from, valid_until, review_due_at, updated_at, documents(document_code), document_files(id, original_file_name, mime_type, size_bytes)").order("updated_at", { ascending: false }).limit(100);
  if (q.trim()) query = query.or(`title_vi.ilike.%${q.trim()}%,title_en.ilike.%${q.trim()}%,document_abstract.ilike.%${q.trim()}%`);
  if (status !== "all") query = query.eq("status", status);
  const { data: versions, error } = await query;
  const selected = compare ? (versions || []).find((item) => item.id === compare) : null;
  const previous = selected ? (versions || []).filter((item) => item.document_id === selected.document_id && item.version_number < selected.version_number).sort((a, b) => b.version_number - a.version_number)[0] : null;
  const files = (versions || []).flatMap((item) => ((item.document_files as unknown as { id: string; original_file_name: string; mime_type: string; size_bytes: number }[]) || []).map((file) => ({ ...file, versionTitle: item.title_vi })));
  const previewFile = preview ? files.find((file) => file.id === preview) : null;
  const canEdit = profile.role === "admin" || profile.role === "editor";

  const comparisonRows = selected ? [
    ["Tiêu đề tiếng Việt", previous?.title_vi, selected.title_vi],
    ["Tiêu đề tiếng Anh", previous?.title_en, selected.title_en],
    ["Nhóm tài liệu", previous?.document_group, selected.document_group],
    ["Ngôn ngữ", previous?.language, selected.language],
    ["Tóm tắt", previous?.document_abstract, selected.document_abstract],
    ["Thay đổi", previous?.change_summary, selected.change_summary],
    ["Hiệu lực từ", previous?.valid_from, selected.valid_from],
    ["Hiệu lực đến", previous?.valid_until, selected.valid_until],
    ["Review due", previous?.review_due_at, selected.review_due_at],
    ["Trạng thái", previous?.status, selected.status],
  ] : [];

  return <WorkspaceShell active="/documents" eyebrow="DOCUMENT CONTROL" title="Documents" description="Thư viện tài liệu riêng tư với version, validity và review cadence." userName={profile.display_name} role={profile.role}>
    <form className="catalog-toolbar"><input name="q" defaultValue={q} placeholder="Tìm tài liệu…" aria-label="Từ khóa tài liệu" /><select name="status" defaultValue={status} aria-label="Trạng thái tài liệu"><option value="all">Tất cả trạng thái</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select><button type="submit">Tìm kiếm</button></form>

    {canEdit && versions?.length ? <section className="data-panel document-admin-panel"><div className="data-panel-heading"><div><p className="section-kicker">PRIVATE UPLOAD</p><h2>Thêm file vào phiên bản</h2></div><span className="count-chip">PDF · Office · Image</span></div><form className="document-upload-form" action={uploadDocumentFile}><label>Phiên bản<select name="document_version_id" required>{versions.map((item) => <option key={item.id} value={item.id}>{item.title_vi} · v{item.version_number}</option>)}</select></label><label>File tối đa 25 MB<input type="file" name="file" required accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg,.jpeg" /></label><button className="primary-button" type="submit">Upload private</button></form><p className="form-note">File được lưu trong Supabase Storage private; checksum SHA-256 được tạo ở server trước khi ghi metadata.</p></section> : null}

    {previewFile ? <section className="data-panel document-preview-panel"><div className="data-panel-heading"><div><p className="section-kicker">SECURE PREVIEW</p><h2>{previewFile.original_file_name}</h2></div><a className="text-button" href="/documents">Đóng preview</a></div>{previewFile.mime_type === "application/pdf" ? <iframe title={`Preview ${previewFile.original_file_name}`} src={`/documents/files/${previewFile.id}`} /> : previewFile.mime_type.startsWith("image/") ? <img src={`/documents/files/${previewFile.id}`} alt={previewFile.original_file_name} /> : <div className="state-message"><strong>Office file không hỗ trợ preview an toàn trong trình duyệt.</strong><a className="primary-button" href={`/documents/files/${previewFile.id}`}>Tải file</a></div>}</section> : null}

    {selected ? <section className="compare-panel"><div className="data-panel-heading"><div><p className="section-kicker">VERSION COMPARISON</p><h2>{selected.title_vi}</h2></div><a href="/documents">Đóng so sánh</a></div><div className="comparison-table" role="table" aria-label="So sánh metadata"><div className="comparison-row heading" role="row"><strong>Trường</strong><strong>{previous ? `v${previous.version_number}` : "Phiên bản trước"}</strong><strong>v{selected.version_number}</strong></div>{comparisonRows.map(([label, oldValue, newValue]) => <div className={`comparison-row${String(oldValue || "") !== String(newValue || "") ? " changed" : ""}`} role="row" key={label}><span>{label}</span><span>{oldValue || "—"}</span><span>{newValue || "—"}</span></div>)}</div></section> : null}

    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">PRIVATE LIBRARY</p><h2>{versions?.length || 0} phiên bản</h2></div><span className="count-chip">25 MB / file</span></div>{error ? <div className="state-message error-state"><strong>Không thể tải tài liệu</strong><span>{error.message}</span></div> : !versions?.length ? <div className="state-message"><strong>Chưa có tài liệu</strong><span>Editor có thể tạo metadata và upload PDF, Office hoặc ảnh vào bucket private.</span></div> : <div className="document-grid">{versions.map((item) => { const document = item.documents as unknown as { document_code: string } | null; const itemFiles = (item.document_files as unknown as { id: string; original_file_name: string; mime_type: string; size_bytes: number }[]) || []; return <article className="document-card" key={item.id}><div className="document-icon">{itemFiles[0]?.mime_type.includes("pdf") ? "PDF" : itemFiles[0] ? "FILE" : "META"}</div><div><span className="mono-code">{document?.document_code || "—"} · v{item.version_number}</span><h3>{item.title_vi}</h3><p>{item.document_abstract || "Chưa có tóm tắt."}</p><footer><span className="status-badge">{item.status}</span><span>{item.review_due_at ? `Review ${item.review_due_at}` : "Chưa đặt review"}</span>{itemFiles.map((file) => <a key={file.id} href={file.mime_type === "application/pdf" || file.mime_type.startsWith("image/") ? `/documents?preview=${file.id}` : `/documents/files/${file.id}`}>{file.mime_type === "application/pdf" || file.mime_type.startsWith("image/") ? "Xem" : "Tải"} {file.original_file_name}</a>)}<a href={`/documents?compare=${item.id}`}>So sánh metadata</a></footer>{canEdit ? <form className="document-lifecycle-form" action={updateDocumentLifecycle}><input type="hidden" name="document_version_id" value={item.id}/><select name="status" defaultValue={item.status} aria-label={`Trạng thái ${item.title_vi}`}>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select><button type="submit" className="text-button">Cập nhật</button></form> : null}</div></article>})}</div>}</section>
  </WorkspaceShell>;
}
