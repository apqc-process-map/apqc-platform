"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { updateProcessMetadata } from "@/app/actions";
import WorkspaceShell from "@/components/workspace-shell";
import ProcessMetadataCard from "./process-metadata-card";

export type ProcessMapTag = { code: string; label: string; color: string };
export type ProcessMapAssignment = { role: string; profileName: string };
export type ProcessMapApplicability = { dimension: string; label: string; isInherited: boolean };
export type ProcessMapApqcMapping = { pcfId: string; name: string; role: string; matchType: string; status: string; rationale: string };
export type ProcessMapRelatedDocument = {
  versionId: string; code: string; title: string; versionNumber: number; status: string; role: string;
  files: Array<{ id: string; name: string; mimeType: string }>;
};
export type ProcessMapNode = {
  id: string; versionId: string; versionNumber: number; parentId: string | null; code: string; name: string; nameEn: string;
  sourceCode: string; allowedRoles: string[];
  level: string; status: string; owner: string; summary: string; purpose: string; description: string;
  scopeIn: string; scopeOut: string; trigger: string; outcome: string; changeSummary: string;
  validFrom: string | null; validUntil: string | null; mappingCount: number; displayOrder: number;
  businessPurpose: string; scopeAndBoundaries: string; criticalDecisionPoints: string;
  accountabilityAndImpact: string; accessLevel: string; reviewDueAt: string | null;
  tags: ProcessMapTag[]; assignments: ProcessMapAssignment[]; applicability: ProcessMapApplicability[]; systems: string[]; apqcMappings: ProcessMapApqcMapping[];
  relatedDocuments: ProcessMapRelatedDocument[];
  supersedesVersionNumber: number | null;
  createdAt: string | null; createdBy: string; updatedAt: string | null; updatedBy: string;
  submittedAt: string | null; submittedBy: string; approvedAt: string | null; approvedBy: string; publishedAt: string | null; publishedBy: string;
};

type Props = { nodes: ProcessMapNode[]; userName: string; role: string; errorMessage?: string };

const LEVEL_BANDS = [
  { key: "L0", label: "Chuỗi giá trị", types: ["value_chain"], tone: "l0" },
  { key: "L1", label: "Quy trình E2E", types: ["e2e"], tone: "l1" },
  { key: "L2", label: "Quy trình", types: ["process"], tone: "l2" },
  { key: "L3", label: "Quy trình con", types: ["subprocess"], tone: "l3" },
  { key: "L4", label: "Hoạt động / công việc", types: ["activity", "task"], tone: "l4" },
] as const;

const EDITABLE_STATUSES = new Set(["draft", "rejected"]);
const PREVIEWABLE_LEVELS = new Set(["L2", "L3", "L4"]);

export default function ProcessMapClient({ nodes, userName, role, errorMessage }: Props) {
  const roots = useMemo(() => nodes.filter((node) => !node.parentId || !nodes.some((candidate) => candidate.id === node.parentId)), [nodes]);
  const [selectedId, setSelectedId] = useState(roots[0]?.id || nodes[0]?.id || "");
  const [referenceMode, setReferenceMode] = useState(false);
  const [query, setQuery] = useState("");
  const [activeLevels, setActiveLevels] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const [editing, setEditing] = useState(false);
  const [headerExpanded, setHeaderExpanded] = useState(true);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("selected");
    if (!requested || !nodes.some((node) => node.id === requested)) return;
    const frame = window.requestAnimationFrame(() => setSelectedId(requested));
    return () => window.cancelAnimationFrame(frame);
  }, [nodes]);

  function showPreview(id: string, target: HTMLElement) {
    const rect = target.getBoundingClientRect();
    const width = Math.min(520, window.innerWidth - 32);
    const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= 360 ? rect.bottom + 8 : Math.max(16, rect.top - 368);
    setPreviewPosition({ top, left });
    setPreviewId(id);
  }

  function chooseNode(id: string) {
    setSelectedId(id);
    setEditing(false);
    const url = new URL(window.location.href);
    url.searchParams.set("selected", id);
    url.searchParams.delete("version");
    url.searchParams.delete("updated");
    window.history.replaceState(null, "", url);
  }

  const effectiveSelectedId = nodes.some((node) => node.id === selectedId) ? selectedId : (roots[0]?.id || nodes[0]?.id || "");
  const selected = nodes.find((node) => node.id === effectiveSelectedId) || roots[0] || nodes[0];
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleNodes = nodes.filter((node) => {
    const matchesLevel = !activeLevels.length || activeLevels.includes(node.level);
    const haystack = [node.code, node.name, node.nameEn, node.owner, node.level, node.summary, node.tags.map((tag) => tag.label).join(" ")].join(" ").toLocaleLowerCase("vi");
    return matchesLevel && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const canEdit = role === "admin" && Boolean(selected?.versionId);
  const editableVersion = selected ? EDITABLE_STATUSES.has(selected.status) : false;

  const headerContent = <section className={`process-map-header-block${headerExpanded ? " is-expanded" : " is-collapsed"}`} aria-label="Điều khiển Process Landscape">
    <div className="process-map-header-main">
      <p className="eyebrow accent process-map-header-label">PROCESS LANDSCAPE</p>
      <div className="process-map-header-controls" id="process-map-header-controls" hidden={!headerExpanded}>
        <div className="map-actions"><button type="button" className={`mode-button${!referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(false)}>Enterprise</button><button type="button" className={`mode-button${referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(true)}>APQC Reference</button></div>
        {!referenceMode ? <div className="process-map-toolbar-search"><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Tìm process trên sơ đồ" placeholder="Tìm code, tên, owner, tag hoặc nội dung…" /></div> : null}
      </div>
      <button type="button" className="process-map-collapse-button" onClick={() => setHeaderExpanded((value) => !value)} aria-expanded={headerExpanded} aria-controls="process-map-header-controls">
        <span aria-hidden="true">{headerExpanded ? "⌃" : "⌄"}</span>
        {headerExpanded ? "Thu gọn" : "Mở rộng"}
      </button>
    </div>
  </section>;

  return <WorkspaceShell active="/process-map" eyebrow="PROCESS LANDSCAPE" title="Process Map" description="Tìm kiếm, xem tổng quan và quản trị metadata quy trình theo L0–L4." userName={userName} role={role} headerContent={headerContent}>
    {errorMessage ? <div className="state-message error-state"><strong>Không thể tải Process Map</strong><span>{errorMessage}</span></div> : null}
    {!errorMessage && !selected ? <div className="state-message"><strong>Chưa có process</strong><span>Tạo process metadata để bắt đầu hierarchy.</span></div> : null}
    {referenceMode ? <section className="reference-empty"><div className="reference-icon">◇</div><h2>APQC Reference View</h2><p>Tra cứu taxonomy APQC đã import và đối chiếu coverage với enterprise process. Hai mô hình được quản lý độc lập.</p><Link className="primary-button" href="/catalog">Mở APQC Catalog →</Link></section> : selected ? <div className="map-layout value-chain-layout process-map-workspace">
      <section className="scope-column panel value-chain-panel">
        <div className="level-filter" aria-label="Lọc theo cấp độ">
          <button type="button" className={!activeLevels.length ? "active" : ""} onClick={() => setActiveLevels([])}>Tất cả cấp</button>
          {LEVEL_BANDS.map((band) => <button key={band.key} type="button" className={activeLevels.includes(band.types[0]) || (band.key === "L4" && activeLevels.includes("task")) ? "active" : ""} onClick={() => {
            const values = band.types as readonly string[];
            const allActive = values.every((value) => activeLevels.includes(value));
            setActiveLevels((current) => allActive ? current.filter((value) => !values.includes(value)) : [...new Set([...current, ...values])]);
          }}>{band.key} · {band.label}</button>)}
        </div>
        <div className="value-chain-scroll"><div className="value-chain-map" aria-label="Sơ đồ process theo cấp độ L0 đến L4">
          {LEVEL_BANDS.map((band) => {
            const allBandNodes = nodes.filter((node) => (band.types as readonly string[]).includes(node.level));
            const bandNodes = visibleNodes.filter((node) => (band.types as readonly string[]).includes(node.level));
            return <section className={`process-level-band ${band.tone}`} key={band.key} aria-labelledby={`band-${band.key}`}>
              <header id={`band-${band.key}`}><strong>{band.key}</strong><span>{band.label}</span></header>
              <div className="process-level-grid">
                {bandNodes.length ? bandNodes.map((node) => {
                  const tooltipId = `process-preview-${node.id}`;
                  const supportsPreview = PREVIEWABLE_LEVELS.has(band.key);
                  const isPreviewed = supportsPreview && previewId === node.id;
                  return <div className="process-block-shell" key={node.id} onMouseLeave={() => setPreviewId(null)}>
                    <button type="button" className={`process-block${node.id === selected.id ? " selected" : ""}`} onClick={() => chooseNode(node.id)} onMouseEnter={supportsPreview ? (event) => showPreview(node.id, event.currentTarget) : undefined} onFocus={supportsPreview ? (event) => showPreview(node.id, event.currentTarget) : undefined} onBlur={supportsPreview ? () => setPreviewId(null) : undefined} onKeyDown={supportsPreview ? (event) => { if (event.key === "Escape") setPreviewId(null); } : undefined} aria-pressed={node.id === selected.id} aria-describedby={isPreviewed ? tooltipId : undefined}>
                      <span>{node.code}</span><strong>{node.name}</strong><small>{node.owner}</small>
                    </button>
                    {isPreviewed ? <div className="process-preview" id={tooltipId} role="tooltip" style={{ top: previewPosition.top, left: previewPosition.left }}>
                      <div className="process-preview-heading"><span>{band.key} · {node.code}</span><strong>{node.name}</strong></div>
                      <dl>
                        <div><dt>1. Mục đích kinh doanh</dt><dd>{node.businessPurpose}</dd></div>
                        <div><dt>2. Phạm vi & điểm đầu–cuối</dt><dd>{node.scopeAndBoundaries}</dd></div>
                        <div><dt>3. Luồng nghiệp vụ chính</dt><dd>{node.summary}</dd></div>
                        <div><dt>4. Ba quyết định trọng yếu</dt><dd>{node.criticalDecisionPoints}</dd></div>
                        <div><dt>5. Trách nhiệm & quy mô tác động</dt><dd>{node.accountabilityAndImpact}</dd></div>
                      </dl>
                      <small>Click để mở chi tiết · Nhấn Esc để đóng</small>
                    </div> : null}
                  </div>;
                }) : <div className="process-level-empty">{allBandNodes.length ? "Không có process phù hợp bộ lọc." : `Chưa có dữ liệu ${band.key}.`}</div>}
              </div>
            </section>;
          })}
          <div className="value-chain-legend" aria-label="Chú thích level"><span className="legend-l0">L0 Value chain</span><span className="legend-l1">L1 E2E</span><span className="legend-l2">L2 Process</span><span className="legend-l3">L3 Subprocess</span><span className="legend-l4">L4 Activity / Task</span></div>
        </div></div>
      </section>
      <aside className="detail-panel process-detail-panel">
        <div className="process-detail-heading"><div><p className="section-kicker">PROCESS DETAIL</p><span className="detail-code">{selected.code} · v{selected.versionNumber}</span><h2>{selected.name}</h2><span className="detail-level">{selected.level} · {selected.status}</span></div>{canEdit ? <button type="button" className="process-edit-toggle" onClick={() => setEditing((value) => !value)} aria-expanded={editing}>{editing ? "Đóng chỉnh sửa" : "Chỉnh sửa metadata"}</button> : null}</div>
        <section className="process-documents-panel" aria-labelledby="process-documents-title">
          <div className="process-documents-header">
            <div><h3 id="process-documents-title">Tài liệu liên quan <span className="count-chip">{selected.relatedDocuments.length}</span></h3>
              <p>Các file đã gắn với quy trình này và bạn có quyền truy cập.</p></div>
            <Link className="text-button" href={"/documents?process=" + selected.id}>Xem trong Document →</Link>
          </div>
          {selected.relatedDocuments.length ? <ul className="process-documents-list">
            {selected.relatedDocuments.map((document) => <li key={document.versionId}>
              <div className="process-document-details">
                <strong>{document.code ? document.code + " · " : ""}{document.title}</strong>
                <span>v{document.versionNumber} · {document.status === "effective" ? "Đang hiệu lực" : document.status === "approved" ? "Đã duyệt" : document.status === "draft" ? "Bản nháp" : document.status} · {document.role === "primary" ? "Quy trình chính" : "Quy trình liên quan"}</span>
              </div>
              <div className="process-document-links">
                {document.files.length ? document.files.map((file) => <a key={file.id} href={"/documents/files/" + file.id} target="_blank" rel="noopener noreferrer" title={file.name}>
                  {file.mimeType === "application/pdf" || file.mimeType.startsWith("image/") ? "Mở file" : "Tải file"} · {file.name}
                </a>) : <span>Chưa có file đính kèm</span>}
                <Link href={"/documents?detail=" + document.versionId + "#document-metadata-detail"}>Thông tin tài liệu</Link>
              </div>
            </li>)}
          </ul> : <p className="process-documents-empty">Chưa có tài liệu được liên kết hoặc không có tài liệu bạn được phép xem.</p>}
        </section>
        <ProcessMetadataCard key={selected.versionId || selected.id} process={selected} nodes={nodes} />
        {editing && canEdit ? <form key={selected.versionId} action={updateProcessMetadata} className="process-metadata-form">
          <input type="hidden" name="process_id" value={selected.id} />
          <input type="hidden" name="process_version_id" value={selected.versionId} />
          <div className="process-edit-notice"><strong>{editableVersion ? "Đang sửa bản nháp." : "Bản hiện tại được bảo toàn."}</strong><span>{editableVersion ? "Lưu sẽ cập nhật bản draft/rejected hiện có." : "Lưu sẽ tạo bản draft v+1, sao chép liên kết hiện có; APQC mapping sẽ cần xác minh lại."}</span></div>
          <fieldset className="process-edit-section"><legend>Tóm lược điều hành</legend>
            <label><span>1. Mục đích kinh doanh</span><textarea name="business_purpose" defaultValue={selected.businessPurpose} required maxLength={5000} /></label>
            <label><span>2. Phạm vi & điểm đầu–cuối</span><textarea name="scope_and_boundaries" defaultValue={selected.scopeAndBoundaries} required maxLength={5000} /></label>
            <label><span>3. Luồng nghiệp vụ chính</span><textarea name="process_at_a_glance" defaultValue={selected.summary} required maxLength={5000} /></label>
            <label><span>4. Ba quyết định trọng yếu</span><textarea name="critical_decision_points" defaultValue={selected.criticalDecisionPoints} required maxLength={5000} /></label>
            <label><span>5. Trách nhiệm & quy mô tác động</span><textarea name="accountability_and_impact" defaultValue={selected.accountabilityAndImpact} required maxLength={5000} /></label>
          </fieldset>
          <fieldset className="process-edit-section"><legend>Metadata cơ bản</legend>
            <div className="process-edit-grid"><label><span>Tên tiếng Việt</span><input name="name_vi" defaultValue={selected.name} required maxLength={255} /></label><label><span>Tên tiếng Anh</span><input name="name_en" defaultValue={selected.nameEn} maxLength={255} /></label></div>
            <label><span>Purpose</span><textarea name="purpose" defaultValue={selected.purpose} required maxLength={5000} /></label>
            <label><span>Mô tả</span><textarea name="description" defaultValue={selected.description} required maxLength={5000} /></label>
            <div className="process-edit-grid"><label><span>Phân loại truy cập</span><select name="access_level" defaultValue={selected.accessLevel}><option value="internal">internal</option><option value="limited">limited</option><option value="confidential">confidential</option><option value="highly_restricted">highly_restricted</option></select></label><label><span>Review due</span><input type="date" name="review_due_at" defaultValue={selected.reviewDueAt || ""} /></label></div>
          </fieldset>
          <fieldset className="process-edit-section"><legend>Luồng và vòng đời</legend>
            <div className="process-edit-grid"><label><span>Đầu vào</span><textarea name="scope_in" defaultValue={selected.scopeIn} required maxLength={3000} /></label><label><span>Đầu ra</span><textarea name="scope_out" defaultValue={selected.scopeOut} required maxLength={3000} /></label><label><span>Trigger</span><textarea name="trigger" defaultValue={selected.trigger} required maxLength={3000} /></label><label><span>Outcome</span><textarea name="outcome" defaultValue={selected.outcome} required maxLength={3000} /></label></div>
            <div className="process-edit-grid"><label><span>Hiệu lực từ</span><input type="date" name="valid_from" defaultValue={selected.validFrom || ""} /></label><label><span>Hiệu lực đến</span><input type="date" name="valid_until" defaultValue={selected.validUntil || ""} /></label></div>
            <label><span>Tóm tắt thay đổi</span><textarea name="change_summary" defaultValue={selected.changeSummary} required maxLength={2000} /></label>
          </fieldset>
          <div className="process-edit-actions"><button type="submit" className="primary-button">Lưu metadata</button><button type="button" className="text-button" onClick={() => setEditing(false)}>Hủy</button></div>
        </form> : null}
        {!canEdit ? <p className="process-readonly-note">Bạn đang ở chế độ xem. Chỉ Admin được chỉnh sửa metadata quy trình.</p> : null}
      </aside>
    </div> : null}
    <footer className="map-note"><span className="setup-check">i</span><span><strong>Level phản ánh dữ liệu hiện có.</strong> L0–L2 đã có process; L3–L4 sẽ tự hiển thị khi có subprocess, activity hoặc task.</span></footer>
  </WorkspaceShell>;
}
