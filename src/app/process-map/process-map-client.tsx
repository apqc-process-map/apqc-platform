"use client";

import { useMemo, useState } from "react";

type ProcessNode = { id: string; code: string; name: string; level: string; status: string; owner: string; summary: string; children?: string[] };

const nodes: Record<string, ProcessNode> = {
  root: { id: "root", code: "VC-01", name: "Quản trị chuỗi giá trị", level: "Value Chain", status: "Draft", owner: "Chưa phân công", summary: "Khung demo cho enterprise landscape. Dữ liệu thật sẽ được nhập sau khi mẫu doanh nghiệp được phê duyệt.", children: ["sales", "operations"] },
  sales: { id: "sales", code: "PROC-000001", name: "Quản lý bán hàng", level: "Process", status: "Draft", owner: "Chưa phân công", summary: "Quản lý các hoạt động từ lập kế hoạch bán hàng đến theo dõi kết quả kinh doanh.", children: ["order"] },
  operations: { id: "operations", code: "PROC-000002", name: "Vận hành chuỗi cung ứng", level: "Process", status: "Draft", owner: "Chưa phân công", summary: "Điều phối các hoạt động cung ứng và thực hiện đơn hàng.", children: ["inventory"] },
  order: { id: "order", code: "SUB-000001", name: "Xử lý đơn hàng", level: "Subprocess", status: "Draft", owner: "Chưa phân công", summary: "Tiếp nhận, kiểm tra và xác nhận đơn hàng theo chính sách hiện hành." },
  inventory: { id: "inventory", code: "SUB-000002", name: "Quản lý tồn kho", level: "Subprocess", status: "Draft", owner: "Chưa phân công", summary: "Theo dõi số lượng, vị trí và tình trạng hàng hóa trong kho." },
};

export default function ProcessMapClient() {
  const [selectedId, setSelectedId] = useState("root");
  const [referenceMode, setReferenceMode] = useState(false);
  const selected = nodes[selectedId];
  const path = useMemo(() => {
    const result: ProcessNode[] = [];
    let current = nodes.root;
    result.push(current);
    while (current.id !== selectedId) {
      const next = Object.values(nodes).find((candidate) => candidate.children?.includes(selectedId) || candidate.id === selectedId);
      if (!next || result.some((item) => item.id === next.id)) break;
      result.push(next);
      current = next;
    }
    if (result.at(-1)?.id !== selectedId) result.push(selected);
    return result;
  }, [selectedId, selected]);
  const children = selected.children?.map((id) => nodes[id]) ?? [];
  const scope = Object.values(nodes).filter((node) => node.id !== "root");

  return <main className="map-page"><header className="map-header"><div><p className="eyebrow accent">PROCESS LANDSCAPE</p><h1>Process Map</h1><p>Điều hướng hierarchy enterprise và xem nhanh ngữ cảnh của từng process.</p></div><div className="map-actions"><button className={`mode-button${!referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(false)}>Enterprise</button><button className={`mode-button${referenceMode ? " active" : ""}`} onClick={() => setReferenceMode(true)}>APQC Reference</button></div></header><div className="map-breadcrumb" aria-label="Breadcrumb">{path.map((item, index) => <button key={item.id} onClick={() => setSelectedId(item.id)}>{item.name}{index < path.length - 1 && <span> / </span>}</button>)}</div>{referenceMode ? <section className="reference-empty"><div className="reference-icon">◇</div><h2>APQC Reference View</h2><p>Chế độ coverage sẽ hiển thị sau khi APQC workbook được import. Enterprise process vẫn được lưu độc lập với APQC taxonomy.</p><button className="text-button" onClick={() => setReferenceMode(false)}>Quay lại Enterprise view →</button></section> : <div className="map-layout"><section className="map-column panel"><div className="panel-heading"><div><p className="section-kicker">HIERARCHY</p><h2>Selected layer</h2></div><span className="count-chip">{children.length} direct</span></div><div className="layer-list">{children.length ? children.map((node) => <button key={node.id} className={`layer-card${node.id === selectedId ? " selected" : ""}`} onClick={() => setSelectedId(node.id)}><span className="layer-code">{node.code}</span><strong>{node.name}</strong><small>{node.level} · {node.status}</small><span className="layer-arrow">→</span></button>) : <div className="map-empty">Không còn child layer.<br /><span>Đây là node cuối trong hierarchy.</span></div>}</div></section><section className="scope-column panel"><div className="panel-heading"><div><p className="section-kicker">PROCESS SCOPE</p><h2>Descendants in scope</h2></div><span className="count-chip">{scope.length} demo</span></div><div className="scope-toolbar"><input aria-label="Search processes" placeholder="Tìm process trong scope…" /><button className="text-button">Table view</button></div><div className="scope-list">{scope.map((node) => <button key={node.id} className={`scope-row${node.id === selectedId ? " selected" : ""}`} onClick={() => setSelectedId(node.id)}><span className="scope-code">{node.code}</span><span><strong>{node.name}</strong><small>{node.level}</small></span><span className="status-badge">{node.status}</span></button>)}</div></section><aside className="detail-panel"><p className="section-kicker">SELECTED PROCESS</p><span className="detail-code">{selected.code}</span><h2>{selected.name}</h2><span className="detail-level">{selected.level} · {selected.status}</span><div className="detail-block"><span>Executive summary</span><p>{selected.summary}</p></div><div className="detail-meta"><div><span>Owner</span><strong>{selected.owner}</strong></div><div><span>Children</span><strong>{selected.children?.length ?? 0}</strong></div><div><span>APQC mapping</span><strong>Not mapped</strong></div></div><button className="primary-button detail-button">Open full detail →</button></aside></div>}<footer className="map-note"><span className="setup-check">i</span><span><strong>Demo data.</strong> Các node hiện tại là synthetic fixtures để kiểm tra navigation; không đại diện cho enterprise process thực tế.</span></footer></main>;
}
