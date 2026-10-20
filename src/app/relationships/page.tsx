import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";
import RelationshipNetwork, { type RelationshipNetworkItem } from "./relationship-network";

export const instant = false;

type NamedRow = { id: string; name?: string; title?: string; process_code?: string; document_code?: string; finding_code?: string };
type ProcessRow = NamedRow & { process_versions?: { name_vi: string; version_number: number }[] };
type DocumentRow = NamedRow & { document_versions?: { title_vi: string; version_number: number }[] };

function key(type: string, id: string) {
  return `${type}:${id}`;
}

export default async function RelationshipsPage({ searchParams }: { searchParams: Promise<{ group?: string; status?: string; focus?: string }> }) {
  const { group = "all", status = "all", focus = "" } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();

  const [
    typeResult,
    processResult,
    documentResult,
    systemResult,
    riskResult,
    kpiResult,
    roleResult,
    objectResult,
    findingResult,
  ] = await Promise.all([
    supabase.from("relationship_types").select("id, code, group_code, label_vi, inverse_label_vi, is_directed").eq("is_active", true).order("group_code"),
    supabase.from("processes").select("id,process_code,process_versions(name_vi,version_number)").is("archived_at", null),
    supabase.from("documents").select("id,document_code,document_versions(title_vi,version_number)").is("archived_at", null),
    supabase.from("systems").select("id,name"),
    supabase.from("risks").select("id,name"),
    supabase.from("kpis").select("id,name"),
    supabase.from("business_roles").select("id,name"),
    supabase.from("business_objects").select("id,name"),
    supabase.from("findings").select("id,finding_code,title"),
  ]);

  const types = typeResult.data || [];
  let relationshipQuery = supabase
    .from("object_relationships")
    .select("id, source_type, source_id, target_type, target_id, label, description, status, relationship_types(code, group_code, label_vi, inverse_label_vi, is_directed)")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (status !== "all") relationshipQuery = relationshipQuery.eq("status", status);
  const { data: rawRelationships, error } = await relationshipQuery;
  const relationships = (rawRelationships || []).filter((item) => {
    if (group === "all") return true;
    const relationshipType = item.relationship_types as unknown as { group_code: string } | null;
    return relationshipType?.group_code === group;
  });

  const labels = new Map<string, string>();
  for (const process of (processResult.data || []) as unknown as ProcessRow[]) {
    const latest = [...(process.process_versions || [])].sort((a, b) => b.version_number - a.version_number)[0];
    labels.set(key("process", process.id), latest?.name_vi || process.process_code || process.id.slice(0, 8));
  }
  for (const document of (documentResult.data || []) as unknown as DocumentRow[]) {
    const latest = [...(document.document_versions || [])].sort((a, b) => b.version_number - a.version_number)[0];
    labels.set(key("document", document.id), latest?.title_vi || document.document_code || document.id.slice(0, 8));
  }
  const addNamed = (type: string, rows: NamedRow[]) => rows.forEach((row) => labels.set(key(type, row.id), row.name || row.title || row.finding_code || row.id.slice(0, 8)));
  addNamed("system", (systemResult.data || []) as NamedRow[]);
  addNamed("risk", (riskResult.data || []) as NamedRow[]);
  addNamed("kpi", (kpiResult.data || []) as NamedRow[]);
  addNamed("business_role", (roleResult.data || []) as NamedRow[]);
  addNamed("business_object", (objectResult.data || []) as NamedRow[]);
  addNamed("finding", (findingResult.data || []) as NamedRow[]);

  const networkItems: RelationshipNetworkItem[] = (relationships || []).map((item) => {
    const type = item.relationship_types as unknown as { group_code: string; label_vi: string; inverse_label_vi: string; is_directed: boolean } | null;
    return {
      id: item.id,
      sourceKey: key(item.source_type, item.source_id),
      sourceLabel: labels.get(key(item.source_type, item.source_id)) || `${item.source_type} ${item.source_id.slice(0, 8)}`,
      sourceType: item.source_type,
      targetKey: key(item.target_type, item.target_id),
      targetLabel: labels.get(key(item.target_type, item.target_id)) || `${item.target_type} ${item.target_id.slice(0, 8)}`,
      targetType: item.target_type,
      typeLabel: item.label || type?.label_vi || "Liên quan đến",
      inverseLabel: type?.inverse_label_vi || item.label || "Liên quan đến",
      group: type?.group_code || "general",
      directed: type?.is_directed ?? true,
      status: item.status,
    };
  });

  const groups = [...new Set(types.map((type) => type.group_code))];
  const documentFocusOptions = new Map<string, string>();
  for (const item of networkItems) {
    if (item.sourceType === "document") documentFocusOptions.set(item.sourceKey, item.sourceLabel);
    if (item.targetType === "document") documentFocusOptions.set(item.targetKey, item.targetLabel);
  }
  const loadError = error || typeResult.error || processResult.error || documentResult.error;

  return <WorkspaceShell active="/relationships" eyebrow="MẠNG LƯỚI LIÊN KẾT" title="Quan hệ" description="Xem một đối tượng cung cấp, phụ thuộc, quản lý hoặc liên quan tới đối tượng nào." userName={profile.display_name} role={profile.role}>
    <div className="relationship-summary compact"><article><span>Loại</span><strong>{types.length}</strong></article><article><span>Đang hiển thị</span><strong>{relationships?.length || 0}</strong></article><article><span>Phạm vi</span><strong>1–2 bước</strong></article></div>
    <form className="catalog-toolbar compact relationship-filter"><select name="focus" defaultValue={focus} aria-label="Tài liệu trung tâm"><option value="">Tất cả tài liệu</option>{[...documentFocusOptions].map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select name="group" defaultValue={group} aria-label="Nhóm quan hệ"><option value="all">Tất cả nhóm</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select><select name="status" defaultValue={status} aria-label="Trạng thái"><option value="all">Tất cả trạng thái</option><option value="proposed">Proposed</option><option value="verified">Verified</option><option value="rejected">Rejected</option></select><button type="submit">Áp dụng</button></form>
    <div className="relationship-layout"><section className="data-panel"><div className="data-panel-heading relationship-panel-heading"><h2>Quan hệ</h2></div>{loadError ? <div className="state-message error-state"><strong>Không thể tải quan hệ</strong><span>{loadError.message}</span></div> : <RelationshipNetwork items={networkItems} initialCenterKey={focus} />}</section>
      <details className="legend-panel relationship-legend"><summary className="legend-summary"><span className="legend-summary-copy"><span className="section-kicker">CHÚ GIẢI</span><strong>Cách đọc quan hệ</strong></span><span className="legend-summary-hint">Mở khi cần</span></summary><div className="legend-content"><div className="legend-direction"><strong>Quan hệ một chiều được đọc từ Nguồn → Đích.</strong><span>Đường liền nối đối tượng trung tâm với quan hệ trực tiếp. “Xem thêm liên kết” hiển thị thêm các liên kết của đối tượng kế cận.</span></div><p className="legend-help">Mỗi loại dùng cùng một cách gọi trong toàn hệ thống. Mũi tên cho biết cách đọc từ đối tượng nguồn sang đối tượng đích.</p><div className="legend-type-list">{types.map((type) => <div className="legend-row" key={type.id}><span className={`legend-dot tone-${type.group_code}`} /><div><strong>{type.label_vi}</strong><small>{type.is_directed ? `Nguồn → Đích · Chiều ngược: ${type.inverse_label_vi}` : "Áp dụng như nhau ở cả hai chiều"}</small></div></div>)}</div></div></details>
    </div>
    {networkItems.length ? <section className="data-panel relationship-table-panel"><div className="data-panel-heading relationship-panel-heading"><h2>Danh sách</h2><span className="count-chip">{networkItems.length}</span></div><div className="relationship-list">{networkItems.map((item) => <article key={item.id}><span className="object-pill">{item.sourceType}</span><div><strong>{item.sourceLabel} → {item.targetLabel}</strong><small>{item.typeLabel}{item.directed ? ` · Chiều ngược: ${item.inverseLabel}` : " · Hai chiều"}</small></div><span className="object-pill target">{item.targetType}</span><span className="status-badge">{item.status}</span></article>)}</div></section> : null}
  </WorkspaceShell>;
}
