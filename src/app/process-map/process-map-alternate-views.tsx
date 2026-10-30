"use client";

import Link from "next/link";
import type { ProcessMapApqcNode, ProcessMapNode } from "./process-map-client";

export type ProcessMapView = "landscape" | "explorer" | "registry" | "coverage";

type Props = {
  view: Exclude<ProcessMapView, "landscape">;
  processes: ProcessMapNode[];
  apqcNodes: ProcessMapApqcNode[];
  selectedCategoryId: string;
  selectedGroupId: string;
  selectedProcessId: string;
  query: string;
  onSelect: (id: string) => void;
};

const STATUS_LABELS: Record<string, string> = {
  effective: "Đang hiệu lực",
  approved: "Đã duyệt",
  draft: "Bản nháp",
  rejected: "Từ chối",
};

function mappingFor(process: ProcessMapNode, groupId: string) {
  return process.apqcMappings.find((mapping) => mapping.ancestorLevel2Id === groupId) || process.apqcMappings[0];
}

function containsQuery(process: ProcessMapNode, query: string) {
  const term = query.trim().toLocaleLowerCase("vi");
  if (!term) return true;
  return [process.code, process.name, process.owner, process.status, process.tags.map((tag) => tag.label).join(" ")]
    .join(" ").toLocaleLowerCase("vi").includes(term);
}

export default function ProcessMapAlternateViews({ view, processes, apqcNodes, selectedCategoryId, selectedGroupId, selectedProcessId, query, onSelect }: Props) {
  const categories = apqcNodes.filter((node) => node.levelNumber === 1);
  const groups = apqcNodes.filter((node) => node.levelNumber === 2 && node.parentId === selectedCategoryId);
  const selectedCategory = categories.find((node) => node.id === selectedCategoryId) || categories[0];
  const selectedGroup = groups.find((node) => node.id === selectedGroupId) || groups[0];
  const filteredProcesses = processes.filter((process) => containsQuery(process, query));
  const groupProcesses = filteredProcesses.filter((process) => process.apqcMappings.some((mapping) => mapping.ancestorLevel2Id === selectedGroup?.id));
  const selectedProcess = processes.find((process) => process.id === selectedProcessId) || groupProcesses[0];

  if (view === "registry") return <section className="process-alt-panel process-registry-view" aria-label="Danh mục quy trình và tài liệu">
    <header className="process-alt-heading"><div><span>DOCUMENT REGISTRY</span><h2>Danh mục quy trình & tài liệu</h2><p>Tra cứu quy trình doanh nghiệp, APQC mapping, owner và tài liệu liên kết trong một bảng.</p></div><strong>{filteredProcesses.length} quy trình</strong></header>
    <div className="process-registry-scroll"><table><thead><tr><th>Mã quy trình</th><th>Tên quy trình</th><th>APQC liên kết</th><th>Owner</th><th>Trạng thái</th><th>Tài liệu</th></tr></thead><tbody>
      {filteredProcesses.map((process) => { const mapping = mappingFor(process, selectedGroupId); return <tr key={process.id} className={process.id === selectedProcessId ? "is-selected" : ""}>
        <td><button type="button" onClick={() => onSelect(process.id)}>{process.code}</button></td><td><strong>{process.name}</strong></td><td>{mapping ? <span>{mapping.pcfId}<small>{mapping.name}</small></span> : "—"}</td><td>{process.owner || "Chưa xác định"}</td><td><span className={`process-status-pill status-${process.status}`}>{STATUS_LABELS[process.status] || process.status}</span></td><td><b>{process.relatedDocuments.length}</b></td>
      </tr>; })}
    </tbody></table></div>
    {!filteredProcesses.length ? <div className="process-alt-empty">Không có quy trình phù hợp từ khóa.</div> : null}
  </section>;

  if (view === "coverage") return <div className="process-coverage-view">
    <section className="process-alt-panel"><header className="process-alt-heading"><div><span>COVERAGE ATLAS</span><h2>Độ phủ quy trình theo APQC</h2><p>So sánh số quy trình đã map và bằng chứng tài liệu theo từng APQC Category.</p></div></header>
      <div className="process-coverage-grid">{categories.map((category) => {
        const categoryProcesses = filteredProcesses.filter((process) => process.apqcMappings.some((mapping) => mapping.ancestorLevel1Id === category.id));
        const documented = categoryProcesses.filter((process) => process.relatedDocuments.length).length;
        return <button type="button" key={category.id} className={category.id === selectedCategoryId ? "active" : ""} onClick={() => onSelect(category.id)}>
          <span>APQC {category.hierarchyId}</span><strong>{category.name}</strong><div><b>{categoryProcesses.length}</b> quy trình <i>•</i> <b>{documented}</b> có tài liệu</div><em><i style={{ width: `${categoryProcesses.length ? Math.round(documented * 100 / categoryProcesses.length) : 0}%` }} /></em>
        </button>;
      })}</div>
    </section>
    <section className="process-alt-panel process-coverage-detail"><header className="process-alt-heading"><div><span>APQC {selectedCategory?.hierarchyId}</span><h2>{selectedCategory?.name}</h2><p>Chọn Process Group để xem các quy trình doanh nghiệp và tài liệu liên quan.</p></div></header>
      <div className="process-coverage-columns"><nav aria-label="APQC Process Group">{groups.map((group) => {
        const count = filteredProcesses.filter((process) => process.apqcMappings.some((mapping) => mapping.ancestorLevel2Id === group.id)).length;
        return <button type="button" key={group.id} className={group.id === selectedGroupId ? "active" : ""} onClick={() => onSelect(group.id)}><span>{group.hierarchyId}</span><strong>{group.name}</strong><small>{count} quy trình</small></button>;
      })}</nav><div className="process-coverage-processes">{groupProcesses.map((process) => <button type="button" key={process.id} className={process.id === selectedProcessId ? "active" : ""} onClick={() => onSelect(process.id)}><span>{process.code}</span><strong>{process.name}</strong><small>{process.relatedDocuments.length} tài liệu · {STATUS_LABELS[process.status] || process.status}</small></button>)}{!groupProcesses.length ? <div className="process-alt-empty">Chưa có quy trình doanh nghiệp phù hợp.</div> : null}</div></div>
    </section>
  </div>;

  return <section className="process-alt-panel process-explorer-view" aria-label="Khám phá APQC, quy trình và tài liệu">
    <header className="process-alt-heading"><div><span>VISUAL EXPLORER</span><h2>APQC → Quy trình doanh nghiệp → Tài liệu</h2><p>Đi từ phân loại tham chiếu đến quy trình thực tế và bằng chứng tài liệu đang liên kết.</p></div></header>
    <div className="process-explorer-columns">
      <section><header><span>01</span><div><b>Phân loại APQC</b><small>Category / Process Group</small></div></header><div className="process-explorer-scroll"><div className="process-explorer-category"><strong>APQC {selectedCategory?.hierarchyId}</strong><span>{selectedCategory?.name}</span></div>{groups.map((group) => <button type="button" key={group.id} className={group.id === selectedGroupId ? "active" : ""} onClick={() => onSelect(group.id)}><span>{group.hierarchyId}</span><strong>{group.name}</strong></button>)}</div></section>
      <section><header><span>02</span><div><b>Quy trình doanh nghiệp</b><small>{groupProcesses.length} quy trình đã map</small></div></header><div className="process-explorer-scroll">{groupProcesses.map((process) => <button type="button" key={process.id} className={process.id === selectedProcess?.id ? "active" : ""} onClick={() => onSelect(process.id)}><span>{process.code}</span><strong>{process.name}</strong><small>{process.relatedDocuments.length} tài liệu · {process.owner || "Chưa có owner"}</small></button>)}{!groupProcesses.length ? <div className="process-alt-empty">Chưa có quy trình phù hợp.</div> : null}</div></section>
      <section><header><span>03</span><div><b>Tài liệu theo quy trình</b><small>{selectedProcess?.relatedDocuments.length || 0} tài liệu</small></div></header><div className="process-explorer-scroll process-explorer-documents">{selectedProcess?.relatedDocuments.map((document) => <article key={document.versionId}><span>{document.code || `v${document.versionNumber}`}</span><strong>{document.title}</strong><small>{STATUS_LABELS[document.status] || document.status} · {document.files.length} file</small><Link href={`/documents?detail=${document.versionId}#document-metadata-detail`}>Xem metadata →</Link></article>)}{!selectedProcess?.relatedDocuments.length ? <div className="process-alt-empty">Quy trình này chưa có tài liệu liên kết.</div> : null}</div></section>
    </div>
  </section>;
}
