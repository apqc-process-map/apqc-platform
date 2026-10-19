"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import WorkspaceShell from "@/components/workspace-shell";

export type ProcessMapTag = { code: string; label: string; color: string };
export type ProcessMapNode = {
  id: string; parentId: string | null; code: string; name: string; level: string; status: string;
  owner: string; summary: string; mappingCount: number; displayOrder: number;
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

export default function ProcessMapClient({ nodes, userName, role, errorMessage }: Props) {
  const roots = useMemo(() => nodes.filter((node) => !node.parentId || !nodes.some((candidate) => candidate.id === node.parentId)), [nodes]);
  const [selectedId, setSelectedId] = useState(roots[0]?.id || nodes[0]?.id || "");
  const [referenceMode, setReferenceMode] = useState(false);
  const [query, setQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("selected");
    if (requested && nodes.some((node) => node.id === requested)) setSelectedId(requested);
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
    const url = new URL(window.location.href);
    url.searchParams.set("selected", id);
    window.history.replaceState(null, "", url);
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
      result.unshift(parent); visited.add(parent.id); current = parent;
    }
    return result;
  }, [nodes, selected]);

  const directChildren = nodes.filter((node) => node.parentId === selected?.id);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleNodes = nodes.filter((node) =>
    !normalizedQuery || `${node.code} ${node.name} ${node.owner} ${node.level}`.toLocaleLowerCase("vi").includes(normalizedQuery),
  );

  return <WorkspaceShell active="/process-map" eyebrow="PROCESS LANDSCAPE" title="Process Map" description="Điều hướng hierarchy enterprise và xem nhanh ngữ cảnh của từng process." userName={userName} role={role}>
    <Link className="text-button" href="/" aria-label="Quay lại menu chính">← Quay lại menu chính</Link>
    <div className="map-actions"><button className={`mode-button${!referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(false)}>Enterprise</button><button className={`mode-button${referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(true)}>APQC Reference</button></div>
    {errorMessage ? <div className="state-message error-state"><strong>Không thể tải Process Map</strong><span>{errorMessage}</span></div> : null}
    {!errorMessage && !selected ? <div className="state-message"><strong>Chưa có process</strong><span>Tạo process metadata để bắt đầu hierarchy.</span></div> : null}
    {selected ? <div className="map-breadcrumb" aria-label="Breadcrumb">{path.map((item, index) => <button key={item.id} onClick={() => chooseNode(item.id)}>{item.name}{index < path.length - 1 && <span> / </span>}</button>)}</div> : null}
    {referenceMode ? <section className="reference-empty"><div className="reference-icon">◇</div><h2>APQC Reference View</h2><p>Tra cứu taxonomy APQC đã import và đối chiếu coverage với enterprise process. Hai mô hình được quản lý độc lập.</p><Link className="primary-button" href="/catalog">Mở APQC Catalog →</Link></section> : selected ? <div className="map-layout value-chain-layout">
      <section className="map-column panel"><div className="panel-heading"><div><p className="section-kicker">ROOTS</p><h2>Value streams</h2></div><span className="count-chip">{roots.length} roots</span></div><div className="layer-list">{roots.map((node) => <button key={node.id} className={`layer-card${node.id === selected.id ? " selected" : ""}`} onClick={() => chooseNode(node.id)} title={node.summary}><span className="layer-code">{node.code}</span><strong>{node.name}</strong><small>{node.level} · {node.status}</small><span className="layer-arrow">→</span></button>)}</div></section>
      <section className="scope-column panel value-chain-panel"><div className="scope-toolbar value-chain-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Tìm process trên sơ đồ" placeholder="Tìm code, process hoặc owner…" /><span className="value-chain-hint">Hover hoặc focus để xem tổng quan</span><span className="count-chip">{visibleNodes.length} process</span></div><div className="value-chain-scroll"><div className="value-chain-map" aria-label="Sơ đồ process theo cấp độ L0 đến L4">
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
                    <small>Nhấn Esc để đóng · Click để chọn process</small>
                  </div> : null}
                </div>;
              }) : <div className="process-level-empty">{allBandNodes.length ? "Không có process phù hợp bộ lọc." : `Chưa có dữ liệu ${band.key}.`}</div>}
            </div>
          </section>;
        })}
        <div className="value-chain-legend" aria-label="Chú thích level"><span className="legend-l0">L0 Value chain</span><span className="legend-l1">L1 E2E</span><span className="legend-l2">L2 Process</span><span className="legend-l3">L3 Subprocess</span><span className="legend-l4">L4 Activity / Task</span></div>
      </div></div></section>
      <aside className="detail-panel"><p className="section-kicker">SELECTED PROCESS</p><span className="detail-code">{selected.code}</span><h2>{selected.name}</h2><span className="detail-level">{selected.level} · {selected.status}</span><div className="tag-list" aria-label="Tags">{selected.tags.length ? selected.tags.map((tag) => <span className="tag-chip" key={tag.code} style={{ borderColor: tag.color, color: tag.color }}>{tag.label}</span>) : <span className="detail-muted">Chưa gắn tag</span>}</div><div className="detail-block"><span>Mục đích kinh doanh</span><p>{selected.businessPurpose}</p></div><div className="detail-meta"><div><span>Owner</span><strong>{selected.owner}</strong></div><div><span>Child</span><strong>{directChildren.length}</strong></div><div><span>APQC mapping</span><strong>{selected.mappingCount}</strong></div><div><span>Access</span><strong>{selected.accessLevel}</strong></div><div><span>Review due</span><strong>{selected.reviewDueAt || "Chưa đặt"}</strong></div><div><span>Systems</span><strong>{selected.systems.join(", ") || "Chưa gắn"}</strong></div></div><div className="detail-copy-grid"><div className="detail-copy"><span>Phạm vi & ranh giới</span><p>{selected.scopeAndBoundaries}</p></div><div className="detail-copy"><span>Điểm quyết định</span><p>{selected.criticalDecisionPoints}</p></div><div className="detail-copy"><span>Trách nhiệm & tác động</span><p>{selected.accountabilityAndImpact}</p></div><div className="detail-copy"><span>Applicability</span><p>{selected.applicability.join(" · ") || "Chưa cấu hình"}</p></div></div></aside>
    </div> : null}
    <footer className="map-note"><span className="setup-check">i</span><span><strong>Level phản ánh dữ liệu hiện có.</strong> L0–L2 đã có process; L3–L4 sẽ tự hiển thị khi có subprocess, activity hoặc task.</span></footer>
  </WorkspaceShell>;
}
