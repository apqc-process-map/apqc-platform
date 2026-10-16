import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q = "", type = "all" } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  const term = q.trim();
  let processQuery = supabase.from("process_versions").select("id, process_id, version_number, status, name_vi, name_en, purpose, updated_at, processes(process_code, level_type)").order("updated_at", { ascending: false }).limit(100);
  let apqcQuery = supabase.from("apqc_elements").select("id, pcf_id, hierarchy_id, level_number, name, description").order("display_order").limit(100);
  if (term) {
    processQuery = processQuery.or(`name_vi.ilike.%${term}%,name_en.ilike.%${term}%,purpose.ilike.%${term}%`);
    apqcQuery = apqcQuery.or(`pcf_id.ilike.%${term}%,name.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const [processResult, apqcResult] = await Promise.all([type === "apqc" ? Promise.resolve({ data: [], error: null }) : processQuery, type === "enterprise" ? Promise.resolve({ data: [], error: null }) : apqcQuery]);
  const rows = [
    ...(processResult.data || []).map((item) => ({ id: item.id, kind: "Enterprise", code: (item.processes as unknown as { process_code: string } | null)?.process_code || "—", name: item.name_vi, detail: item.purpose, level: (item.processes as unknown as { level_type: string } | null)?.level_type || "—", status: item.status })),
    ...(apqcResult.data || []).map((item) => ({ id: item.id, kind: "APQC", code: item.pcf_id, name: item.name, detail: item.description || "Chưa có mô tả", level: `Level ${item.level_number}`, status: "reference" })),
  ];
  const error = processResult.error?.message || apqcResult.error?.message;
  return <WorkspaceShell active="/catalog" eyebrow="DISCOVERY" title="Process Catalog" description="Tìm kiếm enterprise process và APQC reference trong cùng một nơi." userName={profile.display_name} role={profile.role}>
    <form className="catalog-toolbar"><input name="q" defaultValue={q} placeholder="Tìm theo mã, tên hoặc mô tả…" aria-label="Từ khóa tìm kiếm" /><select name="type" defaultValue={type} aria-label="Loại dữ liệu"><option value="all">Tất cả</option><option value="enterprise">Enterprise</option><option value="apqc">APQC</option></select><button type="submit">Tìm kiếm</button></form>
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">CATALOG</p><h2>{rows.length} kết quả</h2></div><span className="count-chip">{type === "all" ? "Enterprise + APQC" : type}</span></div>
      {error ? <div className="state-message error-state"><strong>Không thể tải catalog</strong><span>{error}</span></div> : rows.length === 0 ? <div className="state-message"><strong>Chưa có dữ liệu phù hợp</strong><span>{term ? "Thử từ khóa khác hoặc xóa bộ lọc." : "APQC workbook và enterprise process chưa được import."}</span></div> : <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Mã</th><th>Tên</th><th>Nguồn</th><th>Cấp</th><th>Trạng thái</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><span className="mono-code">{row.code}</span></td><td><strong>{row.name}</strong><small>{row.detail}</small></td><td>{row.kind}</td><td>{row.level}</td><td><span className="status-badge">{row.status}</span></td></tr>)}</tbody></table></div>}
    </section>
  </WorkspaceShell>;
}




