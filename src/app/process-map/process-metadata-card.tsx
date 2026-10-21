import type { ProcessMapNode } from "./process-map-client";

type MetadataProperty = {
  label: string;
  value: string | number | string[] | null | undefined;
  system?: boolean;
};

type MetadataGroup = {
  key: string;
  title: string;
  description: string;
  properties: MetadataProperty[];
};

const levelLabels: Record<string, string> = {
  value_chain: "Process Level 0 · Chuỗi giá trị",
  e2e: "Process Level 1 · Quy trình E2E",
  process: "Process Level 2 · Quy trình",
  subprocess: "Process Level 3 · Quy trình con",
  activity: "Process Level 4 · Hoạt động",
  task: "Process Level 4 · Công việc",
};

const statusLabels: Record<string, string> = {
  draft: "Bản nháp",
  in_review: "Đang duyệt",
  rejected: "Bị từ chối",
  approved: "Đã phê duyệt",
  scheduled: "Đã lên lịch",
  effective: "Đang hiệu lực",
  cancelled: "Đã hủy",
  superseded: "Đã thay thế",
  archived: "Đã lưu trữ",
};

const accessLabels: Record<string, string> = {
  internal: "Nội bộ",
  limited: "Hạn chế",
  confidential: "Bảo mật",
  highly_restricted: "Hạn chế cao",
};

const assignmentLabels: Record<string, string> = {
  creator: "Người tạo",
  owner: "Chủ sở hữu",
  steward: "Quản trị quy trình",
  sme: "Chuyên gia nghiệp vụ",
  approver: "Người phê duyệt",
  required_reader: "Người bắt buộc đọc",
  interested_reader: "Người cần tham chiếu",
};

const dimensionLabels: Record<string, string> = {
  legal_entity: "Pháp nhân",
  department: "Đơn vị",
  location: "Địa điểm",
  channel: "Kênh",
  product_service: "Sản phẩm / dịch vụ",
  system: "Hệ thống",
  employee_audience: "Đối tượng nhân viên",
  exception: "Ngoại lệ",
};

function hasMetadataValue(value: MetadataProperty["value"]) {
  if (Array.isArray(value)) return value.some((item) => item.trim().length > 0);
  if (typeof value === "number") return true;
  return Boolean(value?.trim());
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });
const dateTimeFormatter = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
});

function formatDate(value: string | null, includeTime = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return (includeTime ? dateTimeFormatter : dateFormatter).format(date);
}

function MetadataValue({ property }: { property: MetadataProperty }) {
  if (!hasMetadataValue(property.value)) {
    return <span className="process-property-missing"><span aria-hidden="true">!</span> Thiếu dữ liệu</span>;
  }
  if (Array.isArray(property.value)) {
    return <ul className="process-property-values">{property.value.map((item, index) => <li key={item + index}>{item}</li>)}</ul>;
  }
  return <span>{property.value}</span>;
}

type Props = {
  process: ProcessMapNode;
  nodes: ProcessMapNode[];
};

export default function ProcessMetadataCard({ process, nodes }: Props) {
  const parent = nodes.find((candidate) => candidate.id === process.parentId);
  const children = nodes.filter((candidate) => candidate.parentId === process.id);
  const assignments = process.assignments.map((assignment) => `${assignmentLabels[assignment.role] || assignment.role}: ${assignment.profileName}`);
  const applicability = process.applicability.map((item) => `${dimensionLabels[item.dimension] || item.dimension}: ${item.label}${item.isInherited ? " · kế thừa" : ""}`);
  const mappings = process.apqcMappings.map((mapping) => {
    const classification = [mapping.role, mapping.matchType, mapping.status].filter(Boolean).join(" · ");
    return `${mapping.pcfId} · ${mapping.name}${classification ? ` — ${classification}` : ""}${mapping.rationale ? ` · ${mapping.rationale}` : ""}`;
  });

  const groups: MetadataGroup[] = [
    {
      key: "classification",
      title: "1. Phân loại & phân tầng",
      description: "Object Type, Class và hierarchy xác định bộ thuộc tính của quy trình.",
      properties: [
        { label: "Object Type", value: "Business Process", system: true },
        { label: "Class / cấp quy trình", value: levelLabels[process.level] || process.level, system: true },
        { label: "Mã quy trình", value: process.code, system: true },
        { label: "Mã nguồn", value: process.sourceCode },
        { label: "Thuộc quy trình cha", value: parent ? `${parent.code} · ${parent.name}` : null },
        { label: "Quy trình con", value: children.map((child) => `${child.code} · ${child.name}`) },
        { label: "Thứ tự hiển thị", value: process.displayOrder, system: true },
        { label: "Phiên bản", value: process.versionNumber ? `v${process.versionNumber}` : null, system: true },
        { label: "Trạng thái", value: statusLabels[process.status] || process.status, system: true },
      ],
    },
    {
      key: "identity",
      title: "2. Nhận diện & quản trị",
      description: "Các property nhận diện, trách nhiệm và quyền truy cập.",
      properties: [
        { label: "Tên tiếng Việt", value: process.name },
        { label: "Tên tiếng Anh", value: process.nameEn },
        { label: "Chủ sở hữu", value: process.owner },
        { label: "Phân công khác", value: assignments.filter((item) => !item.startsWith("Chủ sở hữu:")) },
        { label: "Phân loại truy cập", value: accessLabels[process.accessLevel] || process.accessLevel },
        { label: "Vai trò được phép", value: process.allowedRoles.map((item) => item.toUpperCase()) },
      ],
    },
    {
      key: "executive-summary",
      title: "3. Tổng quan điều hành",
      description: "Năm nội dung Executive Summary dùng cho tooltip và quyết định quản trị.",
      properties: [
        { label: "1. Mục đích kinh doanh", value: process.businessPurpose },
        { label: "2. Phạm vi & điểm đầu–cuối", value: process.scopeAndBoundaries },
        { label: "3. Luồng nghiệp vụ chính", value: process.summary },
        { label: "4. Ba quyết định trọng yếu", value: process.criticalDecisionPoints },
        { label: "5. Trách nhiệm & quy mô tác động", value: process.accountabilityAndImpact },
      ],
    },
    {
      key: "flow",
      title: "4. Nội dung & luồng nghiệp vụ",
      description: "Property mô tả mục tiêu, luồng vào–ra và kết quả mong đợi.",
      properties: [
        { label: "Purpose", value: process.purpose },
        { label: "Mô tả", value: process.description },
        { label: "Đầu vào", value: process.scopeIn },
        { label: "Đầu ra", value: process.scopeOut },
        { label: "Trigger", value: process.trigger },
        { label: "Outcome", value: process.outcome },
      ],
    },
    {
      key: "lookups",
      title: "5. Lookup & liên kết",
      description: "Giá trị chọn từ danh mục hoặc object liên quan, tương tự lookup property của M-Files.",
      properties: [
        { label: "Governance tags", value: process.tags.map((tag) => `${tag.code} · ${tag.label}`) },
        { label: "Hệ thống", value: process.systems },
        { label: "Phạm vi áp dụng", value: applicability },
        { label: "APQC mappings", value: mappings },
      ],
    },
    {
      key: "lifecycle",
      title: "6. Vòng đời & audit",
      description: "Workflow, hiệu lực và system metadata được hệ thống ghi nhận.",
      properties: [
        { label: "Hiệu lực từ", value: formatDate(process.validFrom) },
        { label: "Hiệu lực đến", value: formatDate(process.validUntil) },
        { label: "Hạn rà soát", value: formatDate(process.reviewDueAt) },
        { label: "Tóm tắt thay đổi", value: process.changeSummary },
        { label: "Thay thế phiên bản", value: process.supersedesVersionNumber ? `v${process.supersedesVersionNumber}` : null, system: true },
        { label: "Ngày tạo", value: formatDate(process.createdAt, true), system: true },
        { label: "Người tạo", value: process.createdBy, system: true },
        { label: "Cập nhật lần cuối", value: formatDate(process.updatedAt, true), system: true },
        { label: "Người cập nhật", value: process.updatedBy, system: true },
        { label: "Gửi duyệt", value: formatDate(process.submittedAt, true), system: true },
        { label: "Người gửi duyệt", value: process.submittedBy, system: true },
        { label: "Phê duyệt", value: formatDate(process.approvedAt, true), system: true },
        { label: "Người phê duyệt", value: process.approvedBy, system: true },
        { label: "Xuất bản", value: formatDate(process.publishedAt, true), system: true },
        { label: "Người xuất bản", value: process.publishedBy, system: true },
      ],
    },
  ];

  const properties = groups.flatMap((group) => group.properties);
  const completedCount = properties.filter((property) => hasMetadataValue(property.value)).length;
  const missingCount = properties.length - completedCount;
  const completionPercent = Math.round((completedCount / properties.length) * 100);

  return <div className="process-metadata-card" data-testid="process-metadata-card">
    <div className="process-metadata-model" aria-label="Cơ chế metadata phân tầng">
      <span>Object Type</span><b aria-hidden="true">›</b><span>Class</span><b aria-hidden="true">›</b><span>Property</span><b aria-hidden="true">›</b><span>Value / Lookup</span>
    </div>
    <div className="process-metadata-health">
      <div><strong>{completionPercent}%</strong><span>{completedCount}/{properties.length} thuộc tính đã có dữ liệu</span></div>
      <span className={missingCount ? "is-incomplete" : "is-complete"}>{missingCount ? `${missingCount} trường còn thiếu` : "Metadata đầy đủ"}</span>
      <div className="process-metadata-progress" role="progressbar" aria-label="Mức độ hoàn thiện metadata" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent}><i style={{ width: `${completionPercent}%` }} /></div>
    </div>
    <div className="process-metadata-groups">
      {groups.map((group) => {
        const groupMissing = group.properties.filter((property) => !hasMetadataValue(property.value)).length;
        return <section className="process-metadata-group" key={group.key} aria-labelledby={`metadata-group-${group.key}`}>
          <header><div><h3 id={`metadata-group-${group.key}`}>{group.title}</h3><p>{group.description}</p></div><span className={groupMissing ? "has-missing" : "is-complete"}>{groupMissing ? `${groupMissing} thiếu` : "Đủ"}</span></header>
          <dl>
            {group.properties.map((property) => {
              const missing = !hasMetadataValue(property.value);
              return <div className={`process-property-row${missing ? " is-missing" : ""}`} key={property.label} data-metadata-state={missing ? "missing" : "complete"}>
                <dt>{property.label}{property.system ? <small>System</small> : null}</dt>
                <dd><MetadataValue property={property} /></dd>
              </div>;
            })}
          </dl>
        </section>;
      })}
    </div>
  </div>;
}
