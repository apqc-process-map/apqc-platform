"use client";

import { useEffect, useMemo, useState } from "react";

export type RelationshipNetworkItem = {
  id: string;
  sourceKey: string;
  sourceCode: string;
  sourceLabel: string;
  sourceType: string;
  targetKey: string;
  targetCode: string;
  targetLabel: string;
  targetType: string;
  typeLabel: string;
  inverseLabel: string;
  group: string;
  directed: boolean;
  status: string;
};

type Props = { items: RelationshipNetworkItem[]; initialCenterKey?: string };
type NetworkObject = { key: string; code: string; label: string; type: string };

const objectTypeLabels: Record<string, string> = {
  process: "Quy trình",
  document: "Tài liệu",
  system: "Hệ thống",
  risk: "Rủi ro",
  kpi: "KPI",
  business_role: "Vai trò",
  business_object: "Đối tượng nghiệp vụ",
  finding: "Finding",
};

function objectTypeLabel(type: string) {
  return objectTypeLabels[type] || type;
}

export default function RelationshipNetwork({ items, initialCenterKey }: Props) {
  const requestedCenter = initialCenterKey && items.some((item) => item.sourceKey === initialCenterKey || item.targetKey === initialCenterKey) ? initialCenterKey : "";
  const initialKey = requestedCenter || items[0]?.sourceKey || "";
  const [centerKey, setCenterKey] = useState(initialKey);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (requestedCenter) setCenterKey(requestedCenter);
  }, [requestedCenter]);

  const objects = useMemo(() => {
    const unique = new Map<string, NetworkObject>();
    for (const item of items) {
      unique.set(item.sourceKey, { key: item.sourceKey, code: item.sourceCode, label: item.sourceLabel, type: item.sourceType });
      unique.set(item.targetKey, { key: item.targetKey, code: item.targetCode, label: item.targetLabel, type: item.targetType });
    }
    return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [items]);

  const direct = useMemo(
    () => items.filter((item) => item.sourceKey === centerKey || item.targetKey === centerKey),
    [centerKey, items],
  );

  const secondary = useMemo(() => {
    if (!expanded) return [];
    const neighboringKeys = new Set<string>();
    for (const item of direct) {
      neighboringKeys.add(item.sourceKey);
      neighboringKeys.add(item.targetKey);
    }
    return items.filter((item) =>
      item.sourceKey !== centerKey &&
      item.targetKey !== centerKey &&
      (neighboringKeys.has(item.sourceKey) || neighboringKeys.has(item.targetKey)),
    );
  }, [centerKey, direct, expanded, items]);

  const center = objects.find((item) => item.key === centerKey) ?? objects[0];
  const inbound = direct.filter((item) => item.targetKey === centerKey);
  const outbound = direct.filter((item) => item.sourceKey === centerKey);

  if (!center) {
    return <div className="state-message network-empty"><strong>Chưa có liên kết</strong><span>Tạo quan hệ để bắt đầu mạng liên kết.</span></div>;
  }

  const relationButton = (item: RelationshipNetworkItem, side: "in" | "out") => {
    const nodeKey = side === "in" ? item.sourceKey : item.targetKey;
    const nodeCode = side === "in" ? item.sourceCode : item.targetCode;
    const nodeLabel = side === "in" ? item.sourceLabel : item.targetLabel;
    const nodeType = side === "in" ? item.sourceType : item.targetType;
    const directionLabel = item.typeLabel;
    return <button
      key={`${item.id}-${side}`}
      className={`network-node-card tone-${item.group} ${side === "in" ? "is-inbound" : "is-outbound"}`}
      onClick={() => setCenterKey(nodeKey)}
      aria-label={`${nodeCode ? nodeCode + ". " : ""}${nodeLabel}. ${directionLabel}`}
    >
      <span className="network-node-code">{nodeCode || objectTypeLabel(nodeType)}</span>
      <strong>{nodeLabel}</strong>
      <small>{objectTypeLabel(nodeType)} · {item.status}</small>
      <span className="network-edge-line" aria-hidden="true"><span className="network-edge-label">{directionLabel}</span></span>
    </button>;
  };

  return <div className="network-explorer relationship-network-v2">
    <div className="network-controls relationship-network-controls">
      <label>Đối tượng trung tâm
        <select value={center.key} onChange={(event) => setCenterKey(event.target.value)}>
          {objects.map((item) => <option value={item.key} key={item.key}>{[item.code, item.label, objectTypeLabel(item.type)].filter(Boolean).join(" · ")}</option>)}
        </select>
      </label>
      <div className="network-control-actions">
        <span>Đường nối thể hiện quan hệ trực tiếp</span>
        <button type="button" className="text-button" onClick={() => setExpanded((value) => !value)} aria-pressed={expanded}>
          {expanded ? "Thu gọn" : "Xem thêm liên kết"}
        </button>
      </div>
    </div>

    <div className="relationship-network-board" aria-label={`Mạng quan hệ quanh ${center.label}`}>
      <section className="network-lane network-lane-inbound">
        <div className="network-lane-heading"><span>INBOUND</span><small>Đến đối tượng trung tâm</small></div>
        <div className="network-lane-list">{inbound.length ? inbound.map((item) => relationButton(item, "in")) : <span className="network-placeholder">Không có quan hệ đến</span>}</div>
      </section>

      <div className="network-center-card">
        <span className="network-center-type">{objectTypeLabel(center.type)}</span>
        <strong className="network-center-code">{center.code || "CHƯA CÓ MÃ"}</strong>
        <span className="network-center-name">{center.label}</span>
        <small>{direct.length} quan hệ trực tiếp</small>
      </div>

      <section className="network-lane network-lane-outbound">
        <div className="network-lane-heading"><span>OUTBOUND</span><small>Từ đối tượng trung tâm</small></div>
        <div className="network-lane-list">{outbound.length ? outbound.map((item) => relationButton(item, "out")) : <span className="network-placeholder">Không có quan hệ đi</span>}</div>
      </section>
    </div>

    {secondary.length ? <section className="network-secondary">
      <div className="network-secondary-heading"><div><span className="section-kicker">LIÊN KẾT LÂN CẬN</span><strong>Các quan hệ mở rộng</strong></div><span>{secondary.length}</span></div>
      <div className="network-secondary-list">{secondary.map((item) => <button key={item.id} onClick={() => setCenterKey(item.sourceKey)}>
        <span className="network-secondary-code">{item.sourceCode || objectTypeLabel(item.sourceType)}</span>
        <strong>{item.sourceLabel}</strong>
        <span className="network-secondary-relation">{item.typeLabel}</span>
        <span className="network-secondary-code">{item.targetCode || objectTypeLabel(item.targetType)}</span>
        <strong>{item.targetLabel}</strong>
      </button>)}</div>
    </section> : null}
  </div>;
}
