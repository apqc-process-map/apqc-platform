"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { updateProcessMetadata } from "@/app/actions";
import WorkspaceShell from "@/components/workspace-shell";

export type ProcessMapTag = { code: string; label: string; color: string };
export type ProcessMapNode = {
  id: string; versionId: string; versionNumber: number; parentId: string | null; code: string; name: string; nameEn: string;
  level: string; status: string; owner: string; summary: string; purpose: string; description: string;
  scopeIn: string; scopeOut: string; trigger: string; outcome: string; changeSummary: string;
  validFrom: string | null; validUntil: string | null; mappingCount: number; displayOrder: number;
  businessPurpose: string; scopeAndBoundaries: string; criticalDecisionPoints: string;
  accountabilityAndImpact: string; accessLevel: string; reviewDueAt: string | null;
  tags: ProcessMapTag[]; applicability: string[]; systems: string[];
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

function detailText(value: string | null | undefined, fallback = "Chưa cập nhật") {
  return value?.trim() || fallback;
}

export default function ProcessMapClient({ nodes, userName, role, errorMessage }: Props) {
  const roots = useMemo(() => nodes.filter((node) => !node.parentId || !nodes.some((candidate) => candidate.id === node.parentId)), [nodes]);
  const [selectedId, setSelectedId] = useState(roots[0]?.id || nodes[0]?.id || "");
  const [referenceMode, setReferenceMode] = useState(false);
  const [query, setQuery] = useState("");
  const [activeLevels, setActiveLevels] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("selected");
    if (requested && nodes.some((node) => node.id === requested)) setSelectedId(requested);
  }, [nodes]);

  useEffect(() => {
    if (selectedId && !nodes.some((node) => node.id === selectedId)) setSelectedId(nodes[0]?.id || "");
  }, [nodes, selectedId]);

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
    window.history.replaceState(null, "", url);
  }

  function toggleLevel(level: string) {
    setActiveLevels((current) => current.includes(level) ? current.filter((item) => item !== level) : [...current, level]);
  }

  const selected = nodes.find((node) => node.id === selectedId) || roots[0] || nodes[0];
  const path = useMemo(() => {
    if (!selected) return [];
    const result: ProcessMapNode[] = [selected];
    let current = selected;
    const visited = new Set([current.id]);
    while (current.parentId) {
      const parent = nodes.find((node) => node.id === current.parentId);
      if (!parent || visited.has(parent.id)) break;
      result.unshift(parent);
      visited.add(parent.id);
      current = parent;
    }
    return result;
  }, [nodes, selected]);

  const directChildren = nodes.filter((node) => node.parentId === selected?.id);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleNodes = nodes.filter((node) => {
    const matchesLevel = !activeLevels.length || activeLevels.includes(node.level);
    const haystack = [node.code, node.name, node.nameEn, node.owner, node.level, node.summary, node.tags.map((tag) => tag.label).join(" ")].join(" ").toLocaleLowerCase("vi");
    return matchesLevel && (!normalizedQuery || haystack.includes(normalizedQuery));
  });
  const canEdit = role === "admin" && Boolean(selected?.versionId);
  const editableVersion = selected ? EDITABLE_STATUSES.has(selected.status) : false;

  return <WorkspaceShell active="/process-map" eyebrow="PROCESS LANDSCAPE" title="Process Map" description="Tìm kiếm, xem tổng quan và quản trị metadata quy trình theo L0–L4." userName={userName} role={role}>
    <Link className="text-button" href="/" aria-label="Quay lại menu chính">← Quay lại menu chính</Link>
    <div className="map-actions"><button className={`mode-button${!referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(false)}>Enterprise</button><button className={`mode-button${referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(true)}>APQC Reference</button></div>
    {errorMessage ? <div className="state-message error-state"><strong>Không thể tải Process Map</strong><span>{errorMessage}</span></div> : null}
    {!errorMessage && !selected ? <div className="state-message"><strong>Chưa có process</strong><span>Tạo process metadata để bắt đầu hierarchy.</span></div> : null}
    {selected ? <div className="map-breadcrumb" aria-label="Breadcrumb">{path.map((item, index) => <button key={item.id} onClick={() => chooseNode(item.id)}>{item.name}{index < path.length - 1 && <span> / </span>}</button>)}</div> : null}
    {referenceMode ? <section className="reference-empty"><div className="reference-icon">◇</div><h2>APQC Reference View</h2><p>Tra cứu taxonomy APQC đã import và đối chiếu coverage với enterprise process. Hai mô hình được quản lý độc lập.</p><Link className="primary-button" href="/catalog">Mở APQC Catalog →</Link></section> : selected ? <div className="map-layout value-chain-layout process-map-workspace">
      <section className="scope-column panel value-chain-panel">
        <div className="scope-toolbar value-chain-toolbar process-search-controls">
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Tìm process trên sơ đồ" placeholder="Tìm code, tên, owner, tag hoặc nội dung…" />
          <span className="count-chip" aria-live="polite">{visibleNodes.length} / {nodes.length}</span>
          <span className="value-chain-hint">Hover để xem nhanh · Click để mở chi tiết</span>
        </div>
        <div className="level-filter" aria-label="Lọc theo cấp độ">
          <button type="button" className={!activeLevels.length ? "active" : ""} onClick={() => setActiveLevels([])}>Tất cả cấp</button>
          {LEVEL_BANDS.map((band) => <button key={band.key} type="button" className={activeLevels.includes(band.types[0]) || (band.key === "L4" && activeLevels.includes("task")) ? "active" : ""} onClick={() => {
            const values = [...band.types];
            const allActive = values.every((value) => activeLevels.includes(value));
            setActiveLevels((current) => allActive ? current.filter((value) => !values.includes(value as never)) : [...new Set([...current, ...values])]);
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
                  const isPreviewed = previewId === node.id;
                  return <div className="process-block-shell" key={node.id} onMouseLeave={() => setPreviewId(null)}>
                    <button type="button" className={`process-block${node.id === selected.id ? " selected" : ""}`} onClick={() => chooseNode(node.id)} onMouseEnter={(event) => showPreview(node.id, event.currentTarget)} onFocus={(event) => showPreview(node.id, event.currentTarget)} onBlur={() => setPreviewId(null)} onKeyDown={(event) => { if (event.key === "Escape") setPreviewId(null); }} aria-pressed={node.id === selected.id} aria-describedby={isPreviewed ? tooltipId : undefined}>
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
        <div className="tag-list" aria-label="Tags">{selected.tags.length ? selected.tags.map((tag) => <span className="tag-chip" key={tag.code} style={{ borderColor: tag.color, color: tag.color }}>{tag.label}</span>) : <span className="detail-muted">Chưa gắn tag</span>}</div>
        <div className="process-overview-panel">
          <div className="detail-block"><span>Tổng quan khi hover</span><p>5 nội dung dưới đây là nội dung tooltip và có thể chỉnh sửa bởi Admin.</p></div>
          <dl className="process-overview-list">
            <div><dt>1. Mục đích kinh doanh</dt><dd>{selected.businessPurpose}</dd></div>
            <div><dt>2. Phạm vi & điểm đầu–cuối</dt><dd>{selected.scopeAndBoundaries}</dd></div>
            <div><dt>3. Luồng nghiệp vụ chính</dt><dd>{selected.summary}</dd></div>
            <div><dt>4. Ba quyết định trọng yếu</dt><dd>{selected.criticalDecisionPoints}</dd></div>
            <div><dt>5. Trách nhiệm & quy mô tác động</dt><dd>{selected.accountabilityAndImpact}</dd></div>
          </dl>
        </div>
        <div className="detail-meta"><div><span>Owner</span><strong>{selected.owner}</strong></div><div><span>Child</span><strong>{directChildren.length}</strong></div><div><span>APQC mapping</span><strong>{selected.mappingCount}</strong></div><div><span>Access</span><strong>{selected.accessLevel}</strong></div><div><span>Review due</span><strong>{selected.reviewDueAt || "Chưa đặt"}</strong></div><div><span>Systems</span><strong>{selected.systems.join(", ") || "Chưa gắn"}</strong></div></div>
        <div className="detail-copy-grid"><div className="detail-copy"><span>Purpose</span><p>{detailText(selected.purpose)}</p></div><div className="detail-copy"><span>Mô tả</span><p>{detailText(selected.description)}</p></div><div className="detail-copy"><span>Đầu vào / đầu ra</span><p>{detailText(selected.scopeIn)} → {detailText(selected.scopeOut)}</p></div><div className="detail-copy"><span>Trigger / outcome</span><p>{detailText(selected.trigger)} → {detailText(selected.outcome)}</p></div><div className="detail-copy"><span>Applicability</span><p>{selected.applicability.join(" · ") || "Chưa cấu hình"}</p></div></div>
        {editing && canEdit ? <form key={selected.versionId} action={updateProcessMetadata} className="process-metadata-form">
          <input type="hidden" name="process_id" value={selected.id} />
          <input type="hidden" name="process_version_id" value={selected.versionId} />
          <div className="process-edit-notice"><strong>{editableVersion ? "Đang sửa bản nháp." : "Bản hiện tại được bảo toàn."}</strong><span>{editableVersion ? "Lưu sẽ cập nhật bản draft/rejected hiện có." : "Lưu sẽ tạo bản draft v+1, sao chép liên kết hiện có; APQC mapping sẽ cần xác minh lại."}</span></div>
          <fieldset className="process-edit-section"><legend>Nội dung tooltip</legend>
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
