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

function containsQuery(process: ProcessMapNode, query: string) {
  const term = query.trim().toLocaleLowerCase("vi");
  if (!term) return true;
  return [process.code, process.name, process.owner, process.status, process.tags.map((tag) => tag.label).join(" ")]
    .join(" ").toLocaleLowerCase("vi").includes(term);
}
function apqcLevelLabel(level: number) {
  if (level === 1) return "L0 · Category";
  if (level === 2) return "L1 · Process Group";
  return "L2 · Process";
}

function processMapsToNode(process: ProcessMapNode, node: ProcessMapApqcNode) {
  return process.apqcMappings.some((mapping) => {
    if (node.levelNumber === 1) return mapping.ancestorLevel1Id === node.id;
    if (node.levelNumber === 2) return mapping.ancestorLevel2Id === node.id;
    return mapping.apqcElementId === node.id;
  });
}

export default function ProcessMapAlternateViews({ view, processes, apqcNodes, selectedCategoryId, selectedGroupId, selectedProcessId, query, onSelect }: Props) {
  const categories = apqcNodes.filter((node) => node.levelNumber === 1);
  const groups = apqcNodes.filter((node) => node.levelNumber === 2 && node.parentId === selectedCategoryId);
  const selectedCategory = categories.find((node) => node.id === selectedCategoryId) || categories[0];
  const selectedGroup = groups.find((node) => node.id === selectedGroupId) || groups[0];
  const filteredProcesses = processes.filter((process) => containsQuery(process, query));
  const groupProcesses = filteredProcesses.filter((process) => process.apqcMappings.some((mapping) => mapping.ancestorLevel2Id === selectedGroup?.id));
  const selectedProcess = processes.find((process) => process.id === selectedProcessId) || groupProcesses[0];

  if (view === "registry") {
    const term = query.trim().toLocaleLowerCase("vi");
    const registryNodes = apqcNodes.filter((node) => node.levelNumber <= 3).filter((node) => {
      if (!term) return true;
      const mappedNames = processes.filter((process) => processMapsToNode(process, node)).map((process) => `${process.code} ${process.name}`).join(" ");
      return [node.hierarchyId, node.pcfId, node.name, node.description, mappedNames].join(" ").toLocaleLowerCase("vi").includes(term);
    });
    return <section className="process-alt-panel process-registry-view" aria-label="Danh mục khung tham chiếu APQC">
      <header className="process-alt-heading"><div><span>APQC FRAMEWORK REGISTRY</span><h2>Danh mục khung tham chiếu APQC</h2><p>Mỗi dòng là một node APQC L0–L2; quy trình và tài liệu chỉ được dùng để đo độ phủ mapping.</p></div><strong>{registryNodes.length} node APQC</strong></header>
      <div className="process-registry-scroll"><table><thead><tr><th>Cấp APQC</th><th>Mã APQC</th><th>Tên chuẩn APQC</th><th>PCF ID</th><th>Quy trình map</th><th>Có tài liệu</th><th>Độ phủ</th></tr></thead><tbody>
        {registryNodes.map((node) => {
          const mappedProcesses = processes.filter((process) => processMapsToNode(process, node));
          const documentedProcesses = mappedProcesses.filter((process) => process.relatedDocuments.length > 0);
          const coverage = documentedProcesses.length ? "direct" : mappedProcesses.length ? "descendant" : "none";
          return <tr key={node.id} className={node.id === selectedProcessId ? "is-selected" : ""}>
            <td><span className="apqc-level-pill">{apqcLevelLabel(node.levelNumber)}</span></td>
            <td><Link href={`/catalog/apqc/${node.id}`}>APQC {node.hierarchyId}</Link></td>
            <td><strong>{node.name}</strong></td>
            <td><code>{node.pcfId}</code></td>
            <td><b>{mappedProcesses.length}</b></td>
            <td><b>{documentedProcesses.length}</b></td>
            <td><span className={`registry-coverage ${coverage}`}><i aria-hidden="true" />{coverage === "direct" ? "Có tài liệu" : coverage === "descendant" ? "Có dữ liệu cấp dưới" : "Chưa liên kết"}</span></td>
          </tr>;
        })}
      </tbody></table></div>
      {!registryNodes.length ? <div className="process-alt-empty">Không có node APQC phù hợp từ khóa.</div> : null}
    </section>;
  }
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
