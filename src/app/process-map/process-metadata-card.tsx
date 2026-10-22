import type { ProcessMapNode } from "./process-map-client";
import SharedMetadataCard, { type MetadataGroup as SharedMetadataGroup } from "@/components/metadata-card";

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

  const alwaysOptional = new Set(["Tên tiếng Anh", "Phân công khác", "Governance tags", "Hệ thống", "Phạm vi áp dụng", "Hiệu lực đến", "Thay thế phiên bản", "Gửi duyệt", "Người gửi duyệt", "Phê duyệt", "Người phê duyệt", "Xuất bản", "Người xuất bản"]);
  const operational = new Set(["4. Ba quyết định trọng yếu", "Đầu vào", "Đầu ra", "Trigger", "Outcome"]);
  const sharedGroups: SharedMetadataGroup[] = groups.map((group) => ({
    key: group.key,
    title: group.title,
    description: group.description,
    properties: group.properties.map((property, index) => ({
      key: group.key+"-"+index,
      label: property.label,
      value: property.value,
      required: !alwaysOptional.has(property.label) && (!operational.has(property.label) || ["process","subprocess","activity","task"].includes(process.level)),
      origin: property.system ? "system" : ["Thuộc quy trình cha","Quy trình con","Phân công khác","Hệ thống","APQC mappings"].includes(property.label) ? "relationship" : ["Phân loại truy cập","Vai trò được phép","Governance tags","Phạm vi áp dụng"].includes(property.label) ? "controlled" : "user",
    })),
  }));
  return <SharedMetadataCard objectType="Business Process" className={levelLabels[process.level] || process.level} groups={sharedGroups} testId="process-metadata-card" />;
}
