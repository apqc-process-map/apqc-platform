import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

export const instant = false;

export default async function RelationshipsPage({ searchParams }: { searchParams: Promise<{ group?: string; status?: string }> }) {
  const { group = "all", status = "all" } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  const { data: types, error: typeError } = await supabase.from("relationship_types").select("id, code, group_code, label_vi, inverse_label_vi, is_directed").eq("is_active", true).order("group_code");
  let query = supabase.from("object_relationships").select("id, source_type, source_id, target_type, target_id, label, description, status, relationship_types(code, group_code, label_vi, inverse_label_vi, is_directed)").order("updated_at", { ascending: false }).limit(100);
  if (group !== "all") query = query.eq("relationship_types.group_code", group);
  if (status !== "all") query = query.eq("status", status);
  const { data: relationships, error } = await query;
  const groups = [...new Set((types || []).map((type) => type.group_code))];
  return <WorkspaceShell active="/relationships" eyebrow="CONTEXT NETWORK" title="Relationships" description="Khám phá cross-links tách biệt khỏi hierarchy, theo hướng inbound và outbound." userName={profile.display_name} role={profile.role}>
    <div className="relationship-summary"><article><span>Relationship types</span><strong>{types?.length || 0}</strong></article><article><span>Connections</span><strong>{relationships?.length || 0}</strong></article><article><span>View depth</span><strong>1 hop</strong></article></div>
    <form className="catalog-toolbar compact"><select name="group" defaultValue={group} aria-label="Nhóm quan hệ"><option value="all">Tất cả nhóm</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select><select name="status" defaultValue={status} aria-label="Trạng thái"><option value="all">Tất cả trạng thái</option><option value="proposed">Proposed</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select><button type="submit">Áp dụng</button></form>
    <div className="relationship-layout"><section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">CENTERED NETWORK</p><h2>Inbound / Outbound</h2></div><span className="count-chip">1 hop mặc định</span></div>{error || typeError ? <div className="state-message error-state"><strong>Không thể tải relationships</strong><span>{error?.message || typeError?.message}</span></div> : !relationships?.length ? <div className="state-message network-empty"><div className="network-node">PROCESS</div><strong>Chưa có connection</strong><span>Tạo relationship để bắt đầu network. Việc mở rộng graph luôn cần thao tác rõ ràng.</span></div> : <div className="relationship-list">{relationships.map((item) => { const type = item.relationship_types as unknown as { label_vi: string; group_code: string } | null; return <article key={item.id}><span className="object-pill">{item.source_type}</span><div><strong>{item.label || type?.label_vi || "Liên quan"}</strong><small>{String(item.source_id).slice(0, 8)} → {String(item.target_id).slice(0, 8)}</small></div><span className="object-pill target">{item.target_type}</span><span className="status-badge">{item.status}</span></article>})}</div>}</section>
      <aside className="legend-panel"><p className="section-kicker">LEGEND</p><h2>Controlled types</h2>{(types || []).map((type) => <div className="legend-row" key={type.id}><span className={`legend-dot tone-${type.group_code}`} /><div><strong>{type.label_vi}</strong><small>{type.group_code} · {type.is_directed ? "Có hướng" : "Hai chiều"}</small></div></div>)}</aside>
    </div>
  </WorkspaceShell>;
}




