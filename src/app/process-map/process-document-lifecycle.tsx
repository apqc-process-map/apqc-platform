import Link from "next/link";
import MetadataCard, { hasMetadataValue, type MetadataGroup, type MetadataProperty } from "@/components/metadata-card";
import { documentAccessOptions, documentDate, documentGroupOptions, documentOptionLabel, documentRiskOptions, documentStatusOptions } from "@/lib/document-display";
import { documentRequiredKeys } from "@/lib/metadata-schema";
import type { ProcessMapRelatedDocument } from "./process-map-client";

function dateOrMissing(value: string | null): string | null {
  return value ? documentDate(value) : null;
}

function dateTimeOrMissing(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

function lifecycleMetadata(document: ProcessMapRelatedDocument): MetadataGroup[] {
  // Use exactly the required/optional rules used by the Document tab.
  const requiredKeys = documentRequiredKeys(document.documentGroup);
  const field = (
    key: string, label: string, value: MetadataProperty["value"],
    origin: MetadataProperty["origin"] = "user", alwaysRequired = false,
  ): MetadataProperty => ({
    key, label, value, origin, required: alwaysRequired || requiredKeys.has(key),
  });

  return [
    {
      key: "identity", title: "1. Nhận diện & liên kết quy trình",
      properties: [
        field("documentCode", "Mã tài liệu", document.code, "system"),
        field("documentType", "Loại tài liệu", document.documentType, "controlled"),
        field("documentGroup", "Nhóm tài liệu", document.documentGroup ? documentOptionLabel(documentGroupOptions, document.documentGroup) : null, "derived"),
        field("version", "Phiên bản hiện hành", `v${document.versionNumber}`, "system"),
        field("status", "Trạng thái phê duyệt/hiệu lực", documentOptionLabel(documentStatusOptions, document.status, document.status), "system"),
        field("processLink", "Vai trò liên kết với L2", ({
          primary: "Quy trình chính", supporting: "Hỗ trợ", evidence: "Minh chứng", reference: "Tham khảo",
        } as Record<string, string>)[document.role] || document.role, "relationship", true),
      ],
    },
    {
      key: "ownership", title: "2. Trách nhiệm & phê duyệt",
      properties: [
        field("owner", "Chủ sở hữu", document.owner, "relationship"),
        field("issuingDepartment", "Đơn vị ban hành", document.issuingDepartment),
        field("approver", "Người phê duyệt dự kiến", document.approver, "relationship"),
        field("submittedAt", "Trình duyệt lúc", dateTimeOrMissing(document.submittedAt), "system"),
        field("approvedAt", "Đã phê duyệt lúc", dateTimeOrMissing(document.approvedAt), "system"),
        field("publishedAt", "Đã xuất bản lúc", dateTimeOrMissing(document.publishedAt), "system"),
      ],
    },
    {
      key: "control", title: "3. Hiệu lực, rà soát & lưu trữ",
      properties: [
        field("validFrom", "Hiệu lực từ", dateOrMissing(document.validFrom)),
        field("validUntil", "Hiệu lực đến", dateOrMissing(document.validUntil)),
        field("reviewDue", "Hạn rà soát tiếp theo", dateOrMissing(document.reviewDueAt)),
        field("changeSummary", "Nội dung thay đổi", document.changeSummary),
        ...(document.versionNumber > 1 ? [
          field("supersedes", "Liên kết phiên bản bị thay thế", document.hasSupersededVersion ? "Đã ghi nhận" : null, "relationship"),
        ] : []),
        field("files", "Tệp đính kèm", document.files.map((file) => file.name), "system"),
        field("retentionNote", "Yêu cầu lưu trữ", document.retentionNote),
        field("accessLevel", "Phân loại truy cập", document.accessLevel ? documentOptionLabel(documentAccessOptions, document.accessLevel) : null, "controlled"),
        field("riskRating", "Mức độ rủi ro", document.riskRating ? documentOptionLabel(documentRiskOptions, document.riskRating) : null, "controlled"),
        field("legalReference", "Căn cứ ban hành", document.legalReference),
      ],
    },
  ];
}

function missingMandatory(groups: MetadataGroup[]): number {
  return groups.flatMap((group) => group.properties).filter((property) => property.required && !hasMetadataValue(property.value)).length;
}

type Props = { documents: ProcessMapRelatedDocument[] };

export default function ProcessDocumentLifecycle({ documents }: Props) {
  // Only RLS-visible, current document versions linked to the selected process are supplied.
  const items = documents.map((document) => ({ document, groups: lifecycleMetadata(document) }));
  const missingCount = items.filter(({ groups }) => missingMandatory(groups) > 0).length;
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const overdueReview = items.filter(({ document }) =>
    document.status === "effective" && Boolean(document.reviewDueAt) && document.reviewDueAt! < today
  ).length;
  const expiredEffective = items.filter(({ document }) =>
    document.status === "effective" && Boolean(document.validUntil) && document.validUntil! < today
  ).length;

  if (!items.length) {
    return <div className="process-document-lifecycle-empty">
      <strong>Chưa có tài liệu liên kết trực tiếp với quy trình L2 này.</strong>
      <p>Chưa thể đánh giá vòng đời tài liệu. Cần liên kết tài liệu vào quy trình để theo dõi phiên bản, trách nhiệm, hiệu lực và hạn rà soát.</p>
    </div>;
  }

  return <div className="process-document-lifecycle">
    <div className="process-document-lifecycle-stats" aria-label="Tổng hợp vòng đời tài liệu liên kết">
      <span><b>{items.length}</b> tài liệu hiển thị</span>
      <span className={missingCount ? "has-missing" : ""}><b>{missingCount}</b> tài liệu thiếu metadata bắt buộc</span>
      <span className={overdueReview ? "has-missing" : ""}><b>{overdueReview}</b> tài liệu hiệu lực quá hạn rà soát</span>
      <span className={expiredEffective ? "has-missing" : ""}><b>{expiredEffective}</b> tài liệu hiệu lực quá ngày hết hạn</span>
    </div>
    <p className="process-document-lifecycle-note">
      Chỉ tính tài liệu và phiên bản hiện hành mà tài khoản có quyền xem. Màu vàng đánh dấu trường chưa có dữ liệu; nhãn “Bắt buộc” theo cấu hình metadata của tab Document. Ngày hết hiệu lực có thể để trống theo chính sách; không tự kết luận vi phạm.
    </p>
    <div className="process-document-lifecycle-items">
      {items.map(({ document, groups }, index) => {
        const missing = missingMandatory(groups);
        return <details className="process-document-lifecycle-item" key={document.versionId} open={index === 0}>
          <summary>
            <span className="process-document-lifecycle-identity">
              <small>{document.code || "Chưa có mã"} · v{document.versionNumber}</small>
              <strong>{document.title}</strong>
              <span>{documentOptionLabel(documentStatusOptions, document.status, document.status)}</span>
            </span>
            <span className={missing ? "process-document-lifecycle-warning" : "process-document-lifecycle-complete"}>
              {missing ? `${missing} trường bắt buộc thiếu` : "Đủ trường bắt buộc"}
            </span>
          </summary>
          <div className="process-document-lifecycle-body">
            <MetadataCard
              objectType="Document"
              className={document.documentType || "Chưa phân loại"}
              groups={groups}
              testId="process-document-lifecycle-metadata"
            />
            <div className="process-document-lifecycle-links">
              <Link href={`/documents?detail=${document.versionId}#document-metadata-detail`}>Mở toàn bộ metadata trong Document</Link>
              {document.files.length > 0 ? <span>{document.files.length} tệp đính kèm</span> : null}
            </div>
          </div>
        </details>;
      })}
    </div>
    <div className="process-document-lifecycle-next">
      <strong>Trường đề xuất bổ sung ở giai đoạn tiếp theo</strong>
      <span>Chu kỳ rà soát; ngày/kết quả rà soát gần nhất; người rà soát; nguyên nhân thu hồi/thay thế. Các trường này chưa nằm trong bộ dữ liệu đang truy vấn, nên không được tính là tài liệu thiếu metadata hiện có.</span>
    </div>
  </div>;
}
