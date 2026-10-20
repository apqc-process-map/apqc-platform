"use client";

import { useMemo, useState } from "react";

export type RelationshipNetworkItem = {
  id: string;
  sourceKey: string;
  sourceLabel: string;
  sourceType: string;
  targetKey: string;
  targetLabel: string;
  targetType: string;
  typeLabel: string;
  inverseLabel: string;
  group: string;
  directed: boolean;
  status: string;
};

type Props = { items: RelationshipNetworkItem[] };

export default function RelationshipNetwork({ items }: Props) {
  const initialKey = items[0]?.sourceKey ?? "";
  const [centerKey, setCenterKey] = useState(initialKey);
  const [expanded, setExpanded] = useState(false);

  const objects = useMemo(() => {
    const unique = new Map<string, { key: string; label: string; type: string }>();
    for (const item of items) {
      unique.set(item.sourceKey, { key: item.sourceKey, label: item.sourceLabel, type: item.sourceType });
      unique.set(item.targetKey, { key: item.targetKey, label: item.targetLabel, type: item.targetType });
    }
    return [...unique.values()].sort((a, b) => a.label.localeCompare(b.label, "vi"));
  }, [items]);

  const direct = useMemo(
    () => items.filter((item) => item.sourceKey === centerKey || item.targetKey === centerKey),
    [centerKey, items],
  );

  const visible = useMemo(() => {
    if (!expanded) return direct;
    const neighboringKeys = new Set<string>([centerKey]);
    for (const item of direct) {
      neighboringKeys.add(item.sourceKey);
      neighboringKeys.add(item.targetKey);
    }
    return items.filter((item) => neighboringKeys.has(item.sourceKey) || neighboringKeys.has(item.targetKey));
  }, [centerKey, direct, expanded, items]);

  const center = objects.find((item) => item.key === centerKey) ?? objects[0];
  const inbound = visible.filter((item) => item.targetKey === centerKey || (expanded && item.targetKey !== centerKey && item.sourceKey !== centerKey));
  const outbound = visible.filter((item) => item.sourceKey === centerKey);

  if (!center) {
    return <div className="state-message network-empty"><strong>Chưa có connection</strong><span>Tạo relationship để bắt đầu network.</span></div>;
  }

  const relationButton = (item: RelationshipNetworkItem, side: "in" | "out") => {
    const nodeKey = side === "in" ? item.sourceKey : item.targetKey;
    const nodeLabel = side === "in" ? item.sourceLabel : item.targetLabel;
    const nodeType = side === "in" ? item.sourceType : item.targetType;
    const relationLabel = side === "in" ? item.inverseLabel : item.typeLabel;
    return <button key={`${item.id}-${side}`} className={`network-connection tone-${item.group} ${side === "in" ? "is-inbound" : "is-outbound"}`} onClick={() => setCenterKey(nodeKey)}>
      <span className={`legend-dot tone-${item.group}`} />
      <span><strong>{nodeLabel}</strong><small>{nodeType} · {relationLabel} · {item.status}</small></span>
    </button>;
  };

  return <div className="network-explorer">
    <div className="network-controls">
      <label>Đối tượng trung tâm
        <select value={center.key} onChange={(event) => setCenterKey(event.target.value)}>
          {objects.map((item) => <option value={item.key} key={item.key}>{item.label} · {item.type}</option>)}
        </select>
      </label>
      <button type="button" className="text-button" onClick={() => setExpanded((value) => !value)} aria-pressed={expanded}>
        {expanded ? "Thu gọn" : "Xem thêm liên kết"}
      </button>
    </div>
    <div className="network-board" aria-label={`Mạng quan hệ quanh ${center.label}`}>
      <section><p className="section-kicker">INBOUND</p>{inbound.length ? inbound.map((item) => relationButton(item, "in")) : <span className="network-placeholder">Không có quan hệ đến</span>}</section>
      <div className="network-center"><span>{center.type}</span><strong>{center.label}</strong><small>{direct.length} quan hệ trực tiếp</small></div>
      <section><p className="section-kicker">OUTBOUND</p>{outbound.length ? outbound.map((item) => relationButton(item, "out")) : <span className="network-placeholder">Không có quan hệ đi</span>}</section>
    </div>
  </div>;
}
