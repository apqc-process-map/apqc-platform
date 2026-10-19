import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; compare?: string }> }) {
  const { q = "", status = "all", compare } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  let query = supabase.from("document_versions").select("id, document_id, version_number, status, title_vi, title_en, document_group, language, document_abstract, change_summary, valid_from, valid_until, review_due_at, updated_at, documents(document_code), document_files(id, original_file_name, mime_type, size_bytes)").order("updated_at", { ascending: false }).limit(100);
  if (q.trim()) query = query.or(`title_vi.ilike.%${q.trim()}%,title_en.ilike.%${q.trim()}%,document_abstract.ilike.%${q.trim()}%`);
  if (status !== "all") query = query.eq("status", status);
  const { data: versions, error } = await query;
  const selected = compare ? (versions || []).find((item) => item.id === compare) : null;
  const previous = selected ? (versions || []).filter((item) => item.document_id === selected.document_id && item.version_number < selected.version_number).sort((a, b) => b.version_number - a.version_number)[0] : null;
  return <WorkspaceShell active="/documents" eyebrow="DOCUMENT CONTROL" title="Documents" description="Thư viện tài liệu riêng tư với version, validity và review cadence." userName={profile.display_name} role={profile.role}>
    <form className="catalog-toolbar"><input name="q" defaultValue={q} placeholder="Tìm tài liệu…" aria-label="Từ khóa tài liệu" /><select name="status" defaultValue={status} aria-label="Trạng thái tài liệu"><option value="all">Tất cả trạng thái</option>{["draft","in_review","approved","scheduled","effective","superseded","archived"].map((item) => <option key={item}>{item}</option>)}</select><button type="submit">Tìm kiếm</button></form>
    {selected ? <section className="compare-panel"><div className="data-panel-heading"><div><p className="section-kicker">VERSION COMPARISON</p><h2>{selected.title_vi}</h2></div><a href="/documents">Đóng so sánh</a></div><div className="compare-grid"><div><span>Phiên bản trước</span><strong>{previous ? `v${previous.version_number}` : "Không có"}</strong><p>{previous?.change_summary || "Đây là phiên bản đầu tiên."}</p></div><div><span>Phiên bản đang chọn</span><strong>v{selected.version_number}</strong><p>{selected.change_summary || "Không có tóm tắt thay đổi."}</p></div></div></section> : null}
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">PRIVATE LIBRARY</p><h2>{versions?.length || 0} phiên bản</h2></div><span className="count-chip">25 MB / file</span></div>{error ? <div className="state-message error-state"><strong>Không thể tải tài liệu</strong><span>{error.message}</span></div> : !versions?.length ? <div className="state-message"><strong>Chưa có tài liệu</strong><span>Editor có thể tạo metadata và upload PDF, Office hoặc ảnh vào bucket private.</span></div> : <div className="document-grid">{versions.map((item) => { const document = item.documents as unknown as { document_code: string } | null; const files = item.document_files as unknown as { id: string; original_file_name: string; mime_type: string; size_bytes: number }[]; return <article className="document-card" key={item.id}><div className="document-icon">{files?.[0]?.mime_type.includes("pdf") ? "PDF" : "DOC"}</div><div><span className="mono-code">{document?.document_code || "—"} · v{item.version_number}</span><h3>{item.title_vi}</h3><p>{item.document_abstract || "Chưa có tóm tắt."}</p><footer><span className="status-badge">{item.status}</span><span>{item.review_due_at ? `Review ${item.review_due_at}` : "Chưa đặt review"}</span>{files?.[0]?.id ? <a href={`/documents/files/${files[0].id}`}>Mở file</a> : null}<a href={`/documents?compare=${item.id}`}>So sánh metadata</a></footer></div></article>})}</div>}</section>
  </WorkspaceShell>;
}




