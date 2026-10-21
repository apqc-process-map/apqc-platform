import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";
import RelationshipMetadataForm, {
  type EditableRelationship,
  type RelationshipObjectOption,
  type RelationshipTypeOption,
} from "./relationship-metadata-form";
import RelationshipNetwork, { type RelationshipNetworkItem } from "./relationship-network";

export const instant = false;

type NamedRow = { id: string; code?: string; name?: string; title?: string; process_code?: string; document_code?: string; finding_code?: string };
type ProcessRow = NamedRow & { process_versions?: { name_vi: string; version_number: number }[] };
type DocumentRow = NamedRow & { document_versions?: { title_vi: string; version_number: number }[] };
type RelationshipTypeRow = {
  id: string;
  code: string;
  group_code: string;
  label_vi: string;
  inverse_label_vi: string;
  is_directed: boolean;
  allowed_source_types: string[] | null;
  allowed_target_types: string[] | null;
};

function key(type: string, id: string) {
  return `${type}:${id}`;
}

function displayDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("vi-VN").format(new Date(value + "T00:00:00")) : "";
}

export default async function RelationshipsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; status?: string; focus?: string; edit?: string; manage?: string; saved?: string }>;
}) {
  const { group = "all", status = "all", focus = "", edit = "", manage = "", saved = "" } = await searchParams;
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
    supabase.from("relationship_types").select("id,code,group_code,label_vi,inverse_label_vi,is_directed,allowed_source_types,allowed_target_types").eq("is_active", true).order("group_code"),
    supabase.from("processes").select("id,process_code,process_versions(name_vi,version_number)").is("archived_at", null),
    supabase.from("documents").select("id,document_code,document_versions(title_vi,version_number)").is("archived_at", null),
    supabase.from("systems").select("id,code,name").eq("is_active", true),
    supabase.from("risks").select("id,code,name").eq("is_active", true),
    supabase.from("kpis").select("id,code,name").eq("is_active", true),
    supabase.from("business_roles").select("id,code,name").eq("is_active", true),
    supabase.from("business_objects").select("id,code,name").eq("is_active", true),
    supabase.from("findings").select("id,finding_code,title"),
  ]);

  const types = (typeResult.data || []) as RelationshipTypeRow[];
  const relationshipResult = await supabase
    .from("object_relationships")
    .select("id,source_type,source_id,target_type,target_id,relationship_type_id,label,description,evidence_text,status,valid_from,valid_until,created_by,updated_at,relationship_types(code,group_code,label_vi,inverse_label_vi,is_directed)")
    .order("updated_at", { ascending: false })
    .limit(200);
  const allRelationships = relationshipResult.data || [];
  const relationships = allRelationships.filter((item) => {
    const relationshipType = item.relationship_types as unknown as { group_code: string } | null;
    return (status === "all" || item.status === status) && (group === "all" || relationshipType?.group_code === group);
  });

  const metadata = new Map<string, { label: string; code: string }>();
  for (const process of (processResult.data || []) as unknown as ProcessRow[]) {
    const latest = [...(process.process_versions || [])].sort((a, b) => b.version_number - a.version_number)[0];
    metadata.set(key("process", process.id), {
      code: process.process_code || "",
      label: latest?.name_vi || process.process_code || process.id.slice(0, 8),
    });
  }
  for (const document of (documentResult.data || []) as unknown as DocumentRow[]) {
    const latest = [...(document.document_versions || [])].sort((a, b) => b.version_number - a.version_number)[0];
    metadata.set(key("document", document.id), {
      code: document.document_code || "",
      label: latest?.title_vi || document.document_code || document.id.slice(0, 8),
    });
  }
  const addNamed = (type: string, rows: NamedRow[]) => rows.forEach((row) => metadata.set(key(type, row.id), {
    code: row.code || row.finding_code || "",
    label: row.name || row.title || row.finding_code || row.id.slice(0, 8),
  }));
  addNamed("system", (systemResult.data || []) as NamedRow[]);
  addNamed("risk", (riskResult.data || []) as NamedRow[]);
  addNamed("kpi", (kpiResult.data || []) as NamedRow[]);
  addNamed("business_role", (roleResult.data || []) as NamedRow[]);
  addNamed("business_object", (objectResult.data || []) as NamedRow[]);
  addNamed("finding", (findingResult.data || []) as NamedRow[]);

  const networkItems: RelationshipNetworkItem[] = relationships.map((item) => {
    const type = item.relationship_types as unknown as { group_code: string; label_vi: string; inverse_label_vi: string; is_directed: boolean } | null;
    const sourceMetadata = metadata.get(key(item.source_type, item.source_id));
    const targetMetadata = metadata.get(key(item.target_type, item.target_id));
    return {
      id: item.id,
      sourceKey: key(item.source_type, item.source_id),
      sourceCode: sourceMetadata?.code || "",
      sourceLabel: sourceMetadata?.label || `${item.source_type} ${item.source_id.slice(0, 8)}`,
      sourceType: item.source_type,
      targetKey: key(item.target_type, item.target_id),
      targetCode: targetMetadata?.code || "",
      targetLabel: targetMetadata?.label || `${item.target_type} ${item.target_id.slice(0, 8)}`,
      targetType: item.target_type,
      typeLabel: item.label || type?.label_vi || "Liên quan đến",
      inverseLabel: type?.inverse_label_vi || item.label || "Liên quan đến",
      group: type?.group_code || "general",
      directed: type?.is_directed ?? true,
      status: item.status,
    };
  });

  const networkItemById = new Map(networkItems.map((item) => [item.id, item]));
  const groups = [...new Set(types.map((type) => type.group_code))];
  const documentFocusOptions = new Map<string, string>();
  for (const item of networkItems) {
    if (item.sourceType === "document") documentFocusOptions.set(item.sourceKey, [item.sourceCode, item.sourceLabel].filter(Boolean).join(" · "));
    if (item.targetType === "document") documentFocusOptions.set(item.targetKey, [item.targetCode, item.targetLabel].filter(Boolean).join(" · "));
  }

  const objects: RelationshipObjectOption[] = [...metadata.entries()]
    .map(([objectKey, value]) => ({ key: objectKey, type: objectKey.split(":")[0], code: value.code, label: value.label }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.code.localeCompare(b.code) || a.label.localeCompare(b.label, "vi"));
  const relationshipTypes: RelationshipTypeOption[] = types.map((type) => ({
    id: type.id,
    code: type.code,
    group: type.group_code,
    label: type.label_vi,
    inverseLabel: type.inverse_label_vi,
    directed: type.is_directed,
    allowedSourceTypes: type.allowed_source_types || [],
    allowedTargetTypes: type.allowed_target_types || [],
  }));

  const canManage = profile.role === "admin" || profile.role === "editor";
  const selectedForEdit = edit ? allRelationships.find((item) => item.id === edit) : null;
  const canEditSelected = Boolean(selectedForEdit && (
    profile.role === "admin"
    || (profile.role === "editor" && selectedForEdit.created_by === profile.id && ["proposed", "rejected"].includes(selectedForEdit.status))
  ));
  const editable: EditableRelationship | null = selectedForEdit && canEditSelected ? {
    id: selectedForEdit.id,
    sourceKey: key(selectedForEdit.source_type, selectedForEdit.source_id),
    targetKey: key(selectedForEdit.target_type, selectedForEdit.target_id),
    relationshipTypeId: selectedForEdit.relationship_type_id,
    label: selectedForEdit.label || "",
    description: selectedForEdit.description || "",
    evidenceText: selectedForEdit.evidence_text || "",
    validFrom: selectedForEdit.valid_from || "",
    validUntil: selectedForEdit.valid_until || "",
    status: selectedForEdit.status,
  } : null;

  const loadError = relationshipResult.error || typeResult.error || processResult.error || documentResult.error
    || systemResult.error || riskResult.error || kpiResult.error || roleResult.error || objectResult.error || findingResult.error;

  return <WorkspaceShell active="/relationships" eyebrow="MẠNG LƯỚI LIÊN KẾT" title="Quan hệ" description="Xem một đối tượng cung cấp, phụ thuộc, quản lý hoặc liên quan tới đối tượng nào." userName={profile.display_name} role={profile.role}>
    <div className="relationship-summary compact"><article><span>Loại quan hệ</span><strong>{types.length}</strong></article><article><span>Đang hiển thị</span><strong>{relationships.length}</strong></article><article><span>Phạm vi</span><strong>Liên kết trực tiếp</strong></article></div>
    <form className="catalog-toolbar compact relationship-filter"><select name="focus" defaultValue={focus} aria-label="Tài liệu trung tâm"><option value="">Tất cả tài liệu</option>{[...documentFocusOptions].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="group" defaultValue={group} aria-label="Nhóm quan hệ"><option value="all">Tất cả nhóm</option>{groups.map((item) => <option key={item} value={item}>{item}</option>)}</select><select name="status" defaultValue={status} aria-label="Trạng thái"><option value="all">Tất cả trạng thái</option><option value="proposed">Đề xuất</option><option value="verified">Đã xác minh</option><option value="rejected">Từ chối</option></select><button type="submit">Áp dụng</button></form>

    <div className="relationship-management-bar">
      <span>{canManage ? "Tạo hoặc cập nhật metadata quan hệ theo danh mục chuẩn." : "Viewer có quyền xem; Editor hoặc Admin quản lý metadata quan hệ."}</span>
      {canManage ? <a className="primary-button" href="/relationships?manage=new#relationship-metadata">Tạo quan hệ</a> : null}
    </div>
    {saved ? <div className="success-banner" role="status">{saved === "created" ? "Đã tạo quan hệ." : "Đã cập nhật metadata quan hệ."}</div> : null}
    {edit && !canEditSelected ? <div className="state-message error-state"><strong>Không thể chỉnh sửa</strong><span>Quan hệ không tồn tại hoặc tài khoản không có quyền sửa bản ghi này.</span></div> : null}
    {canManage ? <RelationshipMetadataForm key={editable?.id || manage || "closed"} objects={objects} types={relationshipTypes} existing={editable} role={profile.role} startOpen={manage === "new" || Boolean(editable)} /> : null}

    <div className="relationship-layout"><section className="data-panel relationship-network-panel"><div className="data-panel-heading relationship-panel-heading"><div><span className="section-kicker">RELATIONSHIP NETWORK</span><h2>Mạng liên kết</h2></div><span className="relationship-heading-note">Mã đối tượng · tên · chiều quan hệ</span></div>{loadError ? <div className="state-message error-state"><strong>Không thể tải quan hệ</strong><span>{loadError.message}</span></div> : <RelationshipNetwork key={focus || "all"} items={networkItems} initialCenterKey={focus} />}</section>
      <details className="legend-panel relationship-legend"><summary className="legend-summary"><span className="legend-summary-copy"><span className="section-kicker">CHÚ GIẢI</span><strong>Cách đọc quan hệ</strong></span><span className="legend-summary-hint">Mở khi cần</span></summary><div className="legend-content"><div className="legend-direction"><strong>Quan hệ một chiều được đọc từ Nguồn → Đích.</strong><span>Nhãn đặt trực tiếp trên đường nối cho biết ý nghĩa của mũi tên. “Xem thêm liên kết” hiển thị thêm các liên kết của đối tượng kế cận.</span></div><p className="legend-help">Mỗi loại dùng cùng một cách gọi trong toàn hệ thống. Khi đổi đối tượng trung tâm, hướng mũi tên vẫn giữ theo dữ liệu Nguồn → Đích.</p><div className="legend-type-list">{types.map((type) => <div className="legend-row" key={type.id}><span className={`legend-dot tone-${type.group_code}`} /><div><strong>{type.label_vi}</strong><small>{type.is_directed ? `Nguồn → Đích · Chiều ngược: ${type.inverse_label_vi}` : "Áp dụng như nhau ở cả hai chiều"}</small></div></div>)}</div></div></details>
    </div>

    {networkItems.length ? <section className="data-panel relationship-table-panel"><div className="data-panel-heading relationship-panel-heading"><h2>Danh sách quan hệ</h2><span className="count-chip">{networkItems.length}</span></div><div className="relationship-list">{relationships.map((relationship) => {
      const item = networkItemById.get(relationship.id);
      if (!item) return null;
      const mayEdit = profile.role === "admin" || (profile.role === "editor" && relationship.created_by === profile.id && ["proposed", "rejected"].includes(relationship.status));
      const validity = [relationship.valid_from ? "Từ " + displayDate(relationship.valid_from) : "", relationship.valid_until ? "đến " + displayDate(relationship.valid_until) : ""].filter(Boolean).join(" ");
      return <article key={item.id}><span className="object-pill">{item.sourceType}</span><div className="relationship-record-copy"><strong><span className="relationship-inline-code">{item.sourceCode || "—"}</span>{item.sourceLabel} → <span className="relationship-inline-code">{item.targetCode || "—"}</span>{item.targetLabel}</strong><small>{item.typeLabel}{item.directed ? ` · Chiều ngược: ${item.inverseLabel}` : " · Hai chiều"}</small>{relationship.description ? <p>{relationship.description}</p> : null}<span className="relationship-record-meta">{validity || "Không giới hạn hiệu lực"}{relationship.evidence_text ? " · Có bằng chứng" : " · Chưa có bằng chứng"}</span></div><span className="object-pill target">{item.targetType}</span><span className="status-badge">{item.status}</span>{mayEdit ? <a className="relationship-edit-link" href={`/relationships?edit=${item.id}#relationship-metadata`}>Sửa</a> : null}</article>;
    })}</div></section> : null}
  </WorkspaceShell>;
}
