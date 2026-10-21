"use client";

import { useMemo, useState } from "react";
import { saveRelationshipMetadata } from "@/app/actions";

export type RelationshipObjectOption = {
  key: string;
  type: string;
  code: string;
  label: string;
};

export type RelationshipTypeOption = {
  id: string;
  code: string;
  group: string;
  label: string;
  inverseLabel: string;
  directed: boolean;
  allowedSourceTypes: string[];
  allowedTargetTypes: string[];
};

export type EditableRelationship = {
  id: string;
  sourceKey: string;
  targetKey: string;
  relationshipTypeId: string;
  label: string;
  description: string;
  evidenceText: string;
  validFrom: string;
  validUntil: string;
  status: string;
};

type Props = {
  objects: RelationshipObjectOption[];
  types: RelationshipTypeOption[];
  existing?: EditableRelationship | null;
  role: string;
  startOpen?: boolean;
};

const objectTypeLabels: Record<string, string> = {
  process: "Quy trình",
  document: "Tài liệu",
  business_object: "Đối tượng nghiệp vụ",
  system: "Hệ thống",
  risk: "Rủi ro",
  kpi: "KPI",
  business_role: "Vai trò",
  finding: "Finding",
};

const groupLabels: Record<string, string> = {
  structure: "Cấu trúc",
  execution: "Thực thi",
  governance: "Quản trị",
  ownership: "Trách nhiệm",
  knowledge: "Kiến thức",
  impact: "Tác động",
  evidence: "Bằng chứng",
  lifecycle: "Vòng đời",
  delivery: "Bàn giao",
  general: "Liên quan chung",
};

function objectType(key: string) {
  return key.split(":", 1)[0] || "";
}

function supports(type: RelationshipTypeOption, sourceKey: string, targetKey: string) {
  const sourceType = objectType(sourceKey);
  const targetType = objectType(targetKey);
  const acceptsSource = !sourceType || !type.allowedSourceTypes.length || type.allowedSourceTypes.includes(sourceType);
  const acceptsTarget = !targetType || !type.allowedTargetTypes.length || type.allowedTargetTypes.includes(targetType);
  return acceptsSource && acceptsTarget;
}

export default function RelationshipMetadataForm({ objects, types, existing, role, startOpen = false }: Props) {
  const [sourceKey, setSourceKey] = useState(existing?.sourceKey || "");
  const [targetKey, setTargetKey] = useState(existing?.targetKey || "");
  const [relationshipTypeId, setRelationshipTypeId] = useState(existing?.relationshipTypeId || "");

  const typesForPair = useMemo(
    () => types.filter((type) => supports(type, sourceKey, targetKey)),
    [sourceKey, targetKey, types],
  );
  const selectedType = types.find((type) => type.id === relationshipTypeId);
  const source = objects.find((item) => item.key === sourceKey);
  const target = objects.find((item) => item.key === targetKey);

  function updateEndpoint(value: string, side: "source" | "target") {
    const nextSource = side === "source" ? value : sourceKey;
    const nextTarget = side === "target" ? value : targetKey;
    if (side === "source") setSourceKey(value);
    else setTargetKey(value);
    const currentType = types.find((type) => type.id === relationshipTypeId);
    if (currentType && !supports(currentType, nextSource, nextTarget)) setRelationshipTypeId("");
  }

  const optionsByType = Object.entries(
    objects.reduce<Record<string, RelationshipObjectOption[]>>((groups, item) => {
      (groups[item.type] ||= []).push(item);
      return groups;
    }, {}),
  );

  return <details className="data-panel relationship-metadata-panel" id="relationship-metadata" open={startOpen}>
    <summary className="relationship-metadata-summary">
      <span><span className="section-kicker">RELATIONSHIP METADATA</span><strong>{existing ? "Chỉnh sửa quan hệ" : "Tạo quan hệ mới"}</strong></span>
      <small>Nguồn · loại quan hệ · đích · bằng chứng · hiệu lực</small>
    </summary>
    <form action={saveRelationshipMetadata} className="relationship-metadata-form">
      {existing ? <input type="hidden" name="relationship_id" value={existing.id} /> : null}

      <fieldset>
        <legend>1. Định nghĩa liên kết</legend>
        <div className="relationship-metadata-grid relationship-definition-grid">
          <label>Nguồn
            <select name="source_key" required value={sourceKey} onChange={(event) => updateEndpoint(event.target.value, "source")}>
              <option value="">— Chọn đối tượng nguồn —</option>
              {optionsByType.map(([type, options]) => <optgroup key={type} label={objectTypeLabels[type] || type}>
                {options.map((item) => <option key={item.key} value={item.key}>{[item.code, item.label].filter(Boolean).join(" · ")}</option>)}
              </optgroup>)}
            </select>
          </label>
          <label>Loại quan hệ chuẩn
            <select name="relationship_type_id" required value={relationshipTypeId} onChange={(event) => setRelationshipTypeId(event.target.value)}>
              <option value="">— Chọn loại phù hợp —</option>
              {typesForPair.map((type) => <option key={type.id} value={type.id}>{groupLabels[type.group] || type.group} · {type.label}</option>)}
            </select>
            <small>{sourceKey && targetKey && !typesForPair.length ? "Không có loại quan hệ phù hợp với cặp đối tượng này." : "Danh sách tự lọc theo loại Nguồn và Đích."}</small>
          </label>
          <label>Đích
            <select name="target_key" required value={targetKey} onChange={(event) => updateEndpoint(event.target.value, "target")}>
              <option value="">— Chọn đối tượng đích —</option>
              {optionsByType.map(([type, options]) => <optgroup key={type} label={objectTypeLabels[type] || type}>
                {options.map((item) => <option key={item.key} value={item.key}>{[item.code, item.label].filter(Boolean).join(" · ")}</option>)}
              </optgroup>)}
            </select>
          </label>
        </div>
        <div className="relationship-direction-preview" aria-live="polite">
          <span className="source-dot" aria-hidden="true" />
          <strong>{source ? [source.code, source.label].filter(Boolean).join(" · ") : "Nguồn"}</strong>
          <span className="direction-line">{selectedType?.label || "Loại quan hệ"} <b aria-hidden="true">→</b></span>
          <strong>{target ? [target.code, target.label].filter(Boolean).join(" · ") : "Đích"}</strong>
        </div>
      </fieldset>

      <fieldset>
        <legend>2. Ngữ nghĩa & bằng chứng</legend>
        <div className="relationship-metadata-grid">
          <label>Nhãn hiển thị tùy chọn
            <input name="label" maxLength={255} defaultValue={existing?.label || ""} placeholder={selectedType?.label || "Mặc định dùng tên loại quan hệ"} />
          </label>
          <label className="relationship-field-wide">Mô tả nghiệp vụ
            <textarea name="description" rows={3} maxLength={3000} defaultValue={existing?.description || ""} placeholder="Giải thích tại sao hai đối tượng liên kết và liên kết được sử dụng như thế nào." />
          </label>
          <label className="relationship-field-wide">Bằng chứng / nguồn xác nhận
            <textarea name="evidence_text" rows={2} maxLength={3000} defaultValue={existing?.evidenceText || ""} placeholder="Biên bản, quyết định, tài liệu, ticket hoặc ghi chú xác minh." />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>3. Hiệu lực & workflow</legend>
        <div className="relationship-metadata-grid">
          <label>Hiệu lực từ<input name="valid_from" type="date" defaultValue={existing?.validFrom || ""} /></label>
          <label>Hiệu lực đến<input name="valid_until" type="date" defaultValue={existing?.validUntil || ""} /></label>
          {role === "admin" ? <label>Trạng thái
            <select name="status" defaultValue={existing?.status || "proposed"}>
              <option value="proposed">Đề xuất</option>
              <option value="verified">Đã xác minh</option>
              <option value="rejected">Từ chối</option>
            </select>
          </label> : <div className="relationship-proposal-note"><strong>Trạng thái khi lưu</strong><span>Đề xuất · Admin sẽ xác minh hoặc từ chối.</span></div>}
        </div>
      </fieldset>

      <div className="relationship-metadata-actions">
        <button className="primary-button" type="submit">{existing ? "Lưu metadata quan hệ" : "Tạo quan hệ"}</button>
        {existing ? <a className="text-button" href="/relationships">Hủy chỉnh sửa</a> : null}
        <small>Mã người tạo/cập nhật, thời điểm và người xác minh được hệ thống ghi tự động.</small>
      </div>
    </form>
  </details>;
}
