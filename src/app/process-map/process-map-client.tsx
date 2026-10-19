"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import WorkspaceShell from "@/components/workspace-shell";

export type ProcessMapNode = {
  id: string; parentId: string | null; code: string; name: string; level: string; status: string;
  owner: string; summary: string; mappingCount: number; displayOrder: number;
};

type Props = { nodes: ProcessMapNode[]; userName: string; role: string; errorMessage?: string };

export default function ProcessMapClient({ nodes, userName, role, errorMessage }: Props) {
  const roots = useMemo(() => nodes.filter((node) => !node.parentId || !nodes.some((candidate) => candidate.id === node.parentId)), [nodes]);
  const [selectedId, setSelectedId] = useState(roots[0]?.id || nodes[0]?.id || "");
  const [referenceMode, setReferenceMode] = useState(false);
  const [showAllDescendants, setShowAllDescendants] = useState(false);
  const [query, setQuery] = useState("");
  const [tableView, setTableView] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("selected");
    if (requested && nodes.some((node) => node.id === requested)) setSelectedId(requested);
  }, [nodes]);

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

  const descendants = useMemo(() => {
    if (!selected) return [];
    const found: ProcessMapNode[] = [];
    let frontier = [selected.id];
    while (frontier.length) {
      const next = nodes.filter((node) => node.parentId && frontier.includes(node.parentId));
      found.push(...next); frontier = next.map((node) => node.id);
    }
    return found;
  }, [nodes, selected]);

  const directChildren = nodes.filter((node) => node.parentId === selected?.id);
  const visibleScope = (showAllDescendants ? descendants : directChildren).filter((node) =>
    `${node.code} ${node.name} ${node.owner}`.toLocaleLowerCase("vi").includes(query.trim().toLocaleLowerCase("vi")),
  );

  return <WorkspaceShell active="/process-map" eyebrow="PROCESS LANDSCAPE" title="Process Map" description="Điều hướng hierarchy enterprise và xem nhanh ngữ cảnh của từng process." userName={userName} role={role}>
    <Link className="text-button" href="/" aria-label="Quay lại menu chính">← Quay lại menu chính</Link>
    <div className="map-actions"><button className={`mode-button${!referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(false)}>Enterprise</button><button className={`mode-button${referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(true)}>APQC Reference</button></div>
    {errorMessage ? <div className="state-message error-state"><strong>Không thể tải Process Map</strong><span>{errorMessage}</span></div> : null}
    {!errorMessage && !selected ? <div className="state-message"><strong>Chưa có process</strong><span>Tạo process metadata để bắt đầu hierarchy.</span></div> : null}
    {selected ? <div className="map-breadcrumb" aria-label="Breadcrumb">{path.map((item, index) => <button key={item.id} onClick={() => chooseNode(item.id)}>{item.name}{index < path.length - 1 && <span> / </span>}</button>)}</div> : null}
    {referenceMode ? <section className="reference-empty"><div className="reference-icon">◇</div><h2>APQC Reference View</h2><p>Tra cứu taxonomy APQC đã import và đối chiếu coverage với enterprise process. Hai mô hình được quản lý độc lập.</p><Link className="primary-button" href="/catalog">Mở APQC Catalog →</Link></section> : selected ? <div className="map-layout">
      <section className="map-column panel"><div className="panel-heading"><div><p className="section-kicker">ROOTS</p><h2>Value streams</h2></div><span className="count-chip">{roots.length} roots</span></div><div className="layer-list">{roots.map((node) => <button key={node.id} className={`layer-card${node.id === selected.id ? " selected" : ""}`} onClick={() => chooseNode(node.id)} title={node.summary}><span className="layer-code">{node.code}</span><strong>{node.name}</strong><small>{node.level} · {node.status}</small><span className="layer-arrow">→</span></button>)}</div></section>
      <section className="scope-column panel"><div className="panel-heading"><div><p className="section-kicker">PROCESS SCOPE</p><h2>{showAllDescendants ? "All descendants" : "Direct children"}</h2></div><span className="count-chip">{visibleScope.length} records</span></div><div className="scope-toolbar"><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Tìm process" placeholder="Tìm code, process hoặc owner…" /><button type="button" className="text-button" onClick={() => setShowAllDescendants((value) => !value)}>{showAllDescendants ? "Thu gọn" : "Mở toàn bộ"}</button><button type="button" className="text-button" onClick={() => setTableView((value) => !value)}>{tableView ? "Card view" : "Table view"}</button></div><div className={tableView ? "scope-list table-view" : "scope-list"}>{visibleScope.length ? visibleScope.map((node) => <button key={node.id} className={`scope-row${node.id === selected.id ? " selected" : ""}`} onClick={() => chooseNode(node.id)} title={node.summary}><span className="scope-code">{node.code}</span><span><strong>{node.name}</strong><small>{node.level} · {node.owner}</small></span><span className="status-badge">{node.status}</span></button>) : <div className="map-empty">Không có process phù hợp.<br /><span>Đổi bộ lọc hoặc chọn node khác.</span></div>}</div></section>
      <aside className="detail-panel"><p className="section-kicker">SELECTED PROCESS</p><span className="detail-code">{selected.code}</span><h2>{selected.name}</h2><span className="detail-level">{selected.level} · {selected.status}</span><div className="detail-block"><span>Executive summary</span><p>{selected.summary}</p></div><div className="detail-meta"><div><span>Owner</span><strong>{selected.owner}</strong></div><div><span>Children</span><strong>{directChildren.length}</strong></div><div><span>APQC mapping</span><strong>{selected.mappingCount}</strong></div></div></aside>
    </div> : null}
    <footer className="map-note"><span className="setup-check">i</span><span><strong>Dữ liệu demo có thể xóa.</strong> Các node hiện tại dùng để kiểm thử navigation và sẽ được thay bằng dữ liệu doanh nghiệp thật.</span></footer>
  </WorkspaceShell>;
}
