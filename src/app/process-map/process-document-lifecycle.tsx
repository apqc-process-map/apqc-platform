import Link from "next/link";
import { hasMetadataValue, type MetadataProperty } from "@/components/metadata-card";
import { documentDate, documentOptionLabel, documentStatusOptions } from "@/lib/document-display";
import { documentRequiredKeys } from "@/lib/metadata-schema";
import type { ProcessMapRelatedDocument } from "./process-map-client";

type CoreGroup = { key: string; title: string; properties: MetadataProperty[] };
type DocumentItem = { document: ProcessMapRelatedDocument; groups: CoreGroup[]; missingRequired: number };

function documentDateOrMissing(value: string | null) {
  return value ? documentDate(value) : null;
}

function publishedDateOrMissing(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

/** Core fields only. Full class-specific governance remains on the Document page. */
function documentCoreGroups(document: ProcessMapRelatedDocument): CoreGroup[] {
  const required = documentRequiredKeys(document.documentGroup);
  const field = (key: string, label: string, value: MetadataProperty["value"]): MetadataProperty => ({
    key, label, value, required: required.has(key),
  });
  return [
    {
      key: "understanding",
      title: "Tài liệu nói về gì?",
      properties: [
        field("documentType", "Loại tài liệu", document.documentType),
        field("abstract", "Nội dung chính / tóm tắt", document.abstract),
      ],
    },
    {
      key: "accountability",
      title: "Ai chịu trách nhiệm?",
      properties: [
        field("owner", "Chủ sở hữu tài liệu", document.owner),
        field("issuingDepartment", "Đơn vị ban hành", document.issuingDepartment),
      ],
    },
    {
      key: "lifecycle",
      title: "Trạng thái & vòng đời",
      properties: [
        field("publishedAt", "Xuất bản trên hệ thống", publishedDateOrMissing(document.publishedAt)),
        field("validFrom", "Hiệu lực từ", documentDateOrMissing(document.validFrom)),
        field("validUntil", "Hết hiệu lực", documentDateOrMissing(document.validUntil)),
        field("reviewDue", "Hạn rà soát tiếp theo", documentDateOrMissing(document.reviewDueAt)),
        field("changeSummary", "Nội dung thay đổi phiên bản", document.changeSummary),
      ],
    },
  ];
}

function countMissingCore(document: ProcessMapRelatedDocument, groups: CoreGroup[]) {
  const missingFields = groups.flatMap((group) => group.properties).filter((property) =>
    property.required && !hasMetadataValue(property.value)
  ).length;
  const missingHeader = [document.code, document.title, document.status].filter((value) => !value.trim()).length;
  return missingFields + missingHeader + (document.versionNumber > 0 ? 0 : 1);
}

function CoreFields({ group }: { group: CoreGroup }) {
  return <section className="process-document-core-group" aria-label={group.title}>
    <h4>{group.title}</h4>
    <dl>
      {group.properties.map((property) => {
        const missing = !hasMetadataValue(property.value);
        return <div key={property.key} className={`process-property-row${missing ? " is-missing" : ""}`} data-metadata-state={missing ? "missing" : "complete"}>
          <dt>{property.label}
            {property.required ? <span className="metadata-property-flags"><small className="is-required">Bắt buộc</small></span> : null}
          </dt>
          <dd>{missing
            ? <span className="process-property-missing"><span aria-hidden="true">!</span> Thiếu dữ liệu</span>
            : property.value}
          </dd>
        </div>;
      })}
    </dl>
  </section>;
}

export default function ProcessDocumentLifecycle({ documents }: { documents: ProcessMapRelatedDocument[] }) {
  const items: DocumentItem[] = documents.map((document) => {
    const groups = documentCoreGroups(document);
    return { document, groups, missingRequired: countMissingCore(document, groups) };
  });
  const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const incomplete = items.filter((item) => item.missingRequired > 0).length;
  const overdueReview = items.filter(({ document }) =>
    document.status === "effective" && Boolean(document.reviewDueAt) && document.reviewDueAt! < today
  ).length;
  const pastEndDate = items.filter(({ document }) =>
    document.status === "effective" && Boolean(document.validUntil) && document.validUntil! < today
  ).length;

  if (!items.length) return <div className="process-document-lifecycle-empty">
    <strong>Chưa có tài liệu liên kết trực tiếp với quy trình L2 này.</strong>
    <p>Liên kết tài liệu trong tab Document để theo dõi nội dung, chủ sở hữu và vòng đời tại đây.</p>
  </div>;

  return <div className="process-document-lifecycle">
    <div className="process-document-lifecycle-stats" aria-label="Tổng hợp tài liệu liên kết">
      <span><b>{items.length}</b> tài liệu</span>
      <span className={incomplete ? "has-missing" : ""}><b>{incomplete}</b> thiếu thông tin chính</span>
      <span className={overdueReview ? "has-missing" : ""}><b>{overdueReview}</b> quá hạn rà soát</span>
      <span className={pastEndDate ? "has-missing" : ""}><b>{pastEndDate}</b> đã qua ngày hết hiệu lực</span>
    </div>
    <p className="process-document-lifecycle-note">
      Chỉ hiển thị tài liệu hiện hành được liên kết với L2 mà bạn có quyền xem. Màu vàng là dữ liệu chưa cập nhật; ngày hết hiệu lực bỏ trống không mặc định là vi phạm.
    </p>
    <div className="process-document-lifecycle-items">
      {items.map(({ document, groups, missingRequired }, index) => {
        const firstFile = document.files[0];
        return <details className="process-document-lifecycle-item" key={document.versionId} open={index === 0}>
          <summary>
            <span className="process-document-lifecycle-identity">
              <small>{document.code || <span className="process-document-core-missing">Thiếu mã tài liệu</span>} · v{document.versionNumber || "?"}</small>
              <strong>{document.title || <span className="process-document-core-missing">Thiếu tên tài liệu</span>}</strong>
              <span>{documentOptionLabel(documentStatusOptions, document.status, document.status || "Thiếu trạng thái")}</span>
            </span>
            <span className={missingRequired ? "process-document-lifecycle-warning" : "process-document-lifecycle-complete"}>
              {missingRequired ? `Thiếu ${missingRequired} thông tin chính` : "Đủ thông tin chính"}
            </span>
          </summary>
          <div className="process-document-lifecycle-body">
            <div className="process-document-core-groups">
              {groups.map((group) => <CoreFields key={group.key} group={group} />)}
            </div>
            <div className="process-document-lifecycle-links">
              <Link href={`/documents?detail=${document.versionId}#document-metadata-detail`}>Xem metadata đầy đủ</Link>
              {firstFile ? <a href={`/documents/files/${firstFile.id}`} target="_blank" rel="noopener noreferrer">
                {firstFile.mimeType === "application/pdf" || firstFile.mimeType.startsWith("image/") ? "Mở tài liệu" : "Tải tệp tài liệu"}
              </a> : <span className="process-document-core-missing">Chưa có tệp đính kèm</span>}
            </div>
          </div>
        </details>;
      })}
    </div>
  </div>;
}
