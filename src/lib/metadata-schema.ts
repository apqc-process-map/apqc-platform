import type { MetadataGroup, MetadataOrigin } from "@/components/metadata-card";

type Source = Record<string, string | number | string[] | null | undefined>;
type Field = { key: string; label: string; required?: boolean; origin?: MetadataOrigin; help?: string };
type Group = { key: string; title: string; description?: string; fields: Field[] };

const commonDocumentGroups: Group[] = [
  { key: "classification", title: "1. Phân loại", description: "Class quyết định các property áp dụng và trường bắt buộc.", fields: [
    { key: "documentCode", label: "Mã tài liệu", required: true, origin: "system" },
    { key: "documentType", label: "Class / loại tài liệu", required: true, origin: "controlled" },
    { key: "documentGroup", label: "Class Group", required: true, origin: "derived", help: "Được suy ra từ loại tài liệu." },
    { key: "version", label: "Phiên bản", required: true, origin: "system" },
    { key: "status", label: "Trạng thái", required: true, origin: "system" },
  ]},
  { key: "identity", title: "2. Nhận diện & nội dung", fields: [
    { key: "titleVi", label: "Tiêu đề tiếng Việt", required: true, origin: "user" },
    { key: "titleEn", label: "Tiêu đề tiếng Anh", origin: "user" },
    { key: "language", label: "Ngôn ngữ", required: true, origin: "controlled" },
    { key: "abstract", label: "Tóm tắt", required: true, origin: "user" },
    { key: "keywords", label: "Từ khóa", origin: "user" },
    { key: "changeSummary", label: "Tóm tắt thay đổi", required: true, origin: "user" },
  ]},
  { key: "governance", title: "3. Trách nhiệm & quản trị", fields: [
    { key: "owner", label: "Chủ sở hữu", required: true, origin: "relationship" },
    { key: "approver", label: "Người phê duyệt dự kiến", origin: "relationship" },
    { key: "issuingDepartment", label: "Đơn vị ban hành", required: true, origin: "user" },
    { key: "accessLevel", label: "Mức độ truy cập", required: true, origin: "controlled" },
    { key: "riskRating", label: "Mức độ rủi ro", origin: "controlled" },
    { key: "legalReference", label: "Căn cứ ban hành", origin: "user" },
    { key: "retentionNote", label: "Yêu cầu lưu trữ", origin: "user" },
  ]},
  { key: "context", title: "4. Lookup & phạm vi", fields: [
    { key: "primaryProcess", label: "Quy trình chính", required: true, origin: "relationship" },
    { key: "applicability", label: "Phạm vi áp dụng", origin: "controlled" },
    { key: "applicabilityNote", label: "Ngoại lệ / diễn giải phạm vi", origin: "user" },
    { key: "tags", label: "Governance tags", origin: "controlled" },
    { key: "knowledgeAudience", label: "Vai trò cần biết", origin: "relationship" },
    { key: "relatedObjects", label: "Đối tượng liên quan", origin: "relationship" },
  ]},
  { key: "lifecycle", title: "5. Hiệu lực & audit", fields: [
    { key: "validFrom", label: "Hiệu lực từ", origin: "user" },
    { key: "validUntil", label: "Hiệu lực đến", origin: "user" },
    { key: "reviewDue", label: "Hạn rà soát", required: true, origin: "user" },
    { key: "files", label: "Tệp đính kèm", origin: "system" },
    { key: "createdAt", label: "Ngày tạo", required: true, origin: "system" },
    { key: "updatedAt", label: "Cập nhật lần cuối", required: true, origin: "system" },
  ]},
];

const classRequirements: Record<string, string[]> = {
  governance: ["legalReference", "validFrom", "validUntil"],
  execution: ["primaryProcess", "applicability"],
  evidence: ["primaryProcess", "files"],
  forms: ["primaryProcess", "files"],
  contracts: ["validFrom", "validUntil", "legalReference"],
  assurance: ["primaryProcess", "riskRating"],
};

export function buildDocumentMetadataGroups(source: Source, documentGroup: string): MetadataGroup[] {
  const extraRequired = new Set(classRequirements[documentGroup] || []);
  return commonDocumentGroups.map((group) => ({
    key: group.key,
    title: group.title,
    description: group.description,
    properties: group.fields.map((field) => ({
      ...field,
      required: Boolean(field.required || extraRequired.has(field.key)),
      value: source[field.key],
    })),
  }));
}

export function documentRequiredKeys(documentGroup: string) {
  return new Set(commonDocumentGroups.flatMap((group) => group.fields).filter((field) => field.required || (classRequirements[documentGroup] || []).includes(field.key)).map((field) => field.key));
}
