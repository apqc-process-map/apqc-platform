import { noteSlowPage } from "@/lib/page-perf";
import Form from "next/form";
import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

const processStatuses = ["draft", "in_review", "rejected", "approved", "scheduled", "effective", "cancelled", "superseded", "archived"];
const processLevels = ["value_chain", "e2e", "process", "subprocess", "activity", "task"];

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string; level?: string; sort?: string }> }) {
  const { q = "", type = "all", status = "all", level = "all", sort = "updated_desc" } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  // Safe, post-response timing with no user or document identifiers.
  noteSlowPage("/catalog", performance.now());
  const term = q.trim();

  let processQuery = supabase.from("process_versions")
    .select("id, process_id, version_number, status, name_vi, name_en, purpose, updated_at, processes!inner(process_code, level_type)")
    .limit(150);
  let apqcQuery = supabase.from("apqc_elements")
    .select("id, pcf_id, hierarchy_id, level_number, name, description, display_order")
    .limit(150);

  if (term) {
    processQuery = processQuery.or(`name_vi.ilike.%${term}%,name_en.ilike.%${term}%,purpose.ilike.%${term}%`);
    apqcQuery = apqcQuery.or(`pcf_id.ilike.%${term}%,name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  if (status !== "all") processQuery = processQuery.eq("status", status);
  if (level !== "all") {
    if (level.startsWith("apqc-")) apqcQuery = apqcQuery.eq("level_number", Number(level.slice(5)));
    else processQuery = processQuery.eq("processes.level_type", level);
  }

  const [processResult, apqcResult] = await Promise.all([
    type === "apqc" || level.startsWith("apqc-") ? Promise.resolve({ data: [], error: null }) : processQuery,
    type === "enterprise" || (level !== "all" && !level.startsWith("apqc-")) ? Promise.resolve({ data: [], error: null }) : apqcQuery,
  ]);

  const rows = [
    ...(processResult.data || []).map((item) => {
      const process = item.processes as unknown as { process_code: string; level_type: string } | null;
      return { id: item.id, processId: item.process_id, kind: "Enterprise", code: process?.process_code || "—", name: item.name_vi, detail: item.purpose, level: process?.level_type || "—", status: item.status, updatedAt: item.updated_at, order: Number.MAX_SAFE_INTEGER };
    }),
    ...(apqcResult.data || []).map((item) => ({ id: item.id, processId: null, kind: "APQC", code: item.pcf_id, name: item.name, detail: item.description || "Chưa có mô tả", level: `Level ${item.level_number}`, status: "reference", updatedAt: "", order: item.display_order })),
  ].sort((a, b) => {
    if (sort === "name_asc") return a.name.localeCompare(b.name, "vi");
    if (sort === "code_asc") return a.code.localeCompare(b.code, "vi", { numeric: true });
    if (sort === "level_asc") return a.level.localeCompare(b.level, "vi", { numeric: true });
    return b.updatedAt.localeCompare(a.updatedAt) || a.order - b.order;
  });

  const error = processResult.error?.message || apqcResult.error?.message;
  return <WorkspaceShell active="/catalog" eyebrow="DISCOVERY" title="Process Catalog" description="Tìm kiếm, lọc và sắp xếp enterprise process cùng APQC reference." userName={profile.display_name} role={profile.role}>
    <section className="catalog-control-panel" aria-labelledby="catalog-filter-title">
      <div className="document-library-controls-heading"><div><p className="section-kicker">GLOBAL SEARCH</p><h2 id="catalog-filter-title">Tra cứu repository</h2></div><Link className="text-button" href="/catalog">Xóa bộ lọc</Link></div>
      <Form action="/catalog" scroll={false} className="catalog-filter-form">
        <label className="catalog-filter-search">Từ khóa<input name="q" defaultValue={q} placeholder="Mã, tên hoặc mô tả…" /></label>
        <label>Nguồn<select name="type" defaultValue={type}><option value="all">Enterprise + APQC</option><option value="enterprise">Enterprise</option><option value="apqc">APQC</option></select></label>
        <label>Trạng thái<select name="status" defaultValue={status}><option value="all">Tất cả</option>{processStatuses.map(value => <option key={value}>{value}</option>)}</select></label>
        <label>Cấp độ<select name="level" defaultValue={level}><option value="all">Tất cả</option><optgroup label="Enterprise">{processLevels.map(value => <option key={value}>{value}</option>)}</optgroup><optgroup label="APQC">{[1,2,3,4,5].map(value => <option key={value} value={`apqc-${value}`}>Level {value}</option>)}</optgroup></select></label>
        <label>Sắp xếp<select name="sort" defaultValue={sort}><option value="updated_desc">Cập nhật mới nhất</option><option value="name_asc">Tên A → Z</option><option value="code_asc">Mã tăng dần</option><option value="level_asc">Cấp độ</option></select></label>
        <button type="submit">Áp dụng</button>
      </Form>
    </section>
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">CATALOG</p><h2>{rows.length} kết quả</h2></div><span className="count-chip">{type === "all" ? "Enterprise + APQC" : type}</span></div>
      {error ? <div className="state-message error-state"><strong>Không thể tải catalog</strong><span>{error}</span></div> : rows.length === 0 ? <div className="state-message"><strong>Chưa có dữ liệu phù hợp</strong><span>{term || status !== "all" || level !== "all" ? "Thử điều kiện khác hoặc xóa bộ lọc." : "Repository chưa có dữ liệu."}</span></div> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Mã</th><th>Tên</th><th>Nguồn</th><th>Cấp</th><th>Trạng thái</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><span className="mono-code">{row.code}</span></td><td><strong>{row.kind === "APQC" ? <Link href={`/catalog/apqc/${row.id}`}>{row.name}</Link> : <Link href={`/process-map?selected=${row.processId}`}>{row.name}</Link>}</strong><small>{row.detail}</small></td><td>{row.kind}</td><td>{row.level}</td><td><span className="status-badge">{row.status}</span></td></tr>)}</tbody></table></div>}
    </section>
  </WorkspaceShell>;
}
