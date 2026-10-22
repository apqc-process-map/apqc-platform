"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type MatrixDocument={
  id:string|null;ref:number;code:string;title:string;department:string|null;
  documentType:string|null;validFrom:string|null;available:boolean;
};
export type MatrixEvidence={documentId:string|null;ref:number;evidence:string|null};
export type MatrixFinding={
  id:string;code:string;title:string;description:string|null;impact:string|null;
  issueCode:string|null;issueType:string;groupCode:string;groupLabel:string;
  decisionPoint:string|null;proposedAction:string|null;ownerQuestion:string|null;
  ownerFeedback:string|null;evidenceStatus:string;status:string;statusLabel:string;
  severity:string;severityLabel:string;assignee:string;dueAt:string|null;
  actionSummary:string;actionProgress:number;evidence:MatrixEvidence[];
};

const evidenceLabels:Record<string,string>={candidate:"Mới ghi nhận",pending:"Chờ xác minh",validated:"Đã xác nhận",rejected:"Không hợp lệ"};
const dateLabel=(value:string|null)=>value?new Date(value+"T00:00:00").toLocaleDateString("vi-VN"):"Chưa xác định";

function LongText({value,empty="Chưa có nội dung"}:{value:string|null;empty?:string}){
  if(!value)return <span className="issue-matrix-empty">{empty}</span>;
  return <details className="issue-matrix-text"><summary>{value}</summary><p>{value}</p></details>;
}

export default function FindingIssueMatrix({findings,documents}:{findings:MatrixFinding[];documents:MatrixDocument[]}){
  const [view,setView]=useState<"matrix"|"list">("matrix");
  const [query,setQuery]=useState("");
  const [scope,setScope]=useState<"all"|"single"|"multi"|"missing">("all");
  const [collapsed,setCollapsed]=useState<Record<string,boolean>>({});
  const visible=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase("vi");
    return findings.filter(f=>{
      const refs=new Set(f.evidence.map(e=>e.ref));
      const availableRefs=new Set(f.evidence.filter(e=>e.documentId).map(e=>e.ref));
      const missing=[...refs].some(ref=>!documents.find(d=>d.ref===ref)?.available);
      if(scope==="single"&&availableRefs.size!==1)return false;
      if(scope==="multi"&&availableRefs.size<2)return false;
      if(scope==="missing"&&!missing)return false;
      return !needle||[f.code,f.title,f.description,f.decisionPoint,f.proposedAction,f.ownerQuestion,f.issueCode,f.issueType]
        .some(value=>value?.toLocaleLowerCase("vi").includes(needle));
    });
  },[documents,findings,query,scope]);
  const groups=useMemo(()=>{
    const result=new Map<string,MatrixFinding[]>();
    for(const finding of visible){const key=`${finding.groupCode} · ${finding.groupLabel}`;result.set(key,[...(result.get(key)||[]),finding]);}
    return [...result.entries()];
  },[visible]);

  return <section className="data-panel issue-register-panel">
    <div className="data-panel-heading issue-register-heading">
      <div><p className="section-kicker">ISSUE REGISTER · EXCEL MATRIX</p><h2>{visible.length}/{findings.length} finding</h2></div>
      <div className="finding-view-tabs" aria-label="Kiểu hiển thị">
        <button type="button" className={view==="matrix"?"is-selected":""} onClick={()=>setView("matrix")}>Ma trận</button>
        <button type="button" className={view==="list"?"is-selected":""} onClick={()=>setView("list")}>Danh sách</button>
      </div>
    </div>
    <div className="issue-matrix-toolbar">
      <label><span>Tìm trong issue</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="ID, vấn đề, điểm quyết định, hướng xử lý…"/></label>
      <label><span>Phạm vi bằng chứng</span><select value={scope} onChange={event=>setScope(event.target.value as typeof scope)}>
        <option value="all">Tất cả issue</option><option value="multi">Từ 2 tài liệu</option><option value="single">Một tài liệu</option><option value="missing">Có nguồn chưa được cung cấp</option>
      </select></label>
      <div className="issue-matrix-key"><span><i className="has-evidence"/>Có bằng chứng</span><span><i className="missing-source"/>Thiếu nguồn</span><span><i/>Chưa đánh giá</span></div>
    </div>
    <details className="issue-document-index">
      <summary><strong>Danh mục 14 nguồn đối chiếu</strong><span>{documents.filter(doc=>doc.available).length} nguồn đã tải · {documents.filter(doc=>!doc.available).length} nguồn chưa được cung cấp</span></summary>
      <div>{documents.map(doc=><article key={doc.ref} className={doc.available?"":"is-missing"}>
        <span className="issue-doc-ref">[{doc.ref}]</span><div><strong>{doc.title}</strong><small>{doc.documentType||"Chưa xác định loại"} · {doc.department||"Chưa xác định đơn vị"} · {dateLabel(doc.validFrom)}</small></div>
      </article>)}</div>
    </details>
    {!visible.length?<div className="state-message"><strong>Không có issue phù hợp</strong><span>Thử đổi từ khóa hoặc phạm vi bằng chứng.</span></div>:
    view==="matrix"?<div className="issue-matrix-scroll" tabIndex={0} aria-label="Ma trận finding và tài liệu">
      <table className="issue-matrix-table">
        <thead><tr>
          <th className="matrix-sticky matrix-col-id">ID</th><th className="matrix-sticky matrix-col-type">Loại lỗi chuẩn hóa</th>
          <th className="matrix-sticky matrix-col-decision">Điểm quyết định</th><th className="matrix-sticky matrix-col-problem">Vấn đề</th><th className="matrix-sticky matrix-col-action">Hướng xử lý</th>
          <th className="matrix-owner">Xác nhận Owner</th><th className="matrix-owner-note">Ý kiến / điều chỉnh Owner</th>
          {documents.map(doc=><th key={doc.ref} className={doc.available?"matrix-doc-head":"matrix-doc-head is-missing"} title={doc.title}>
            <span>[{doc.ref}] · {doc.documentType||"Nguồn"}</span><strong>{doc.title}</strong><small>{doc.department||"Chưa rõ đơn vị"}<br/>{dateLabel(doc.validFrom)}</small>
          </th>)}
        </tr></thead>
        <tbody>{groups.map(([group,items])=><FragmentGroup key={group} group={group} items={items} documents={documents} collapsed={!!collapsed[group]} onToggle={()=>setCollapsed(current=>({...current,[group]:!current[group]}))}/>)}</tbody>
      </table>
    </div>:<div className="finding-issue-list issue-list-view">{groups.map(([group,items])=><section key={group}>
      <header><strong>{group}</strong><span>{items.length} issue</span></header>
      {items.map(finding=><article key={finding.id} className="finding-issue-card">
        <div className="finding-issue-head"><div><span className="mono-code">{finding.code}</span><span className="status-badge">{finding.statusLabel}</span><h3><Link href={`/findings/${finding.id}`}>{finding.title}</Link></h3></div><span className={`finding-severity-pill finding-severity-${finding.severity}`}>{finding.severityLabel}</span></div>
        <p>{finding.description||"Chưa có mô tả vấn đề."}</p><div className="finding-issue-type">{finding.issueCode||"—"} · {finding.issueType}</div>
        <div className="issue-list-meta"><span><strong>Điểm quyết định</strong>{finding.decisionPoint||"Chưa có"}</span><span><strong>Hướng xử lý</strong>{finding.proposedAction||"Chưa đề xuất"}</span><span><strong>Owner</strong>{finding.ownerFeedback||finding.ownerQuestion||"Chờ xác nhận"}</span></div>
        <footer><span>{finding.evidence.length} nguồn được viện dẫn</span><span>{finding.actionSummary}</span><Link className="text-button" href={`/findings/${finding.id}`}>Xem chi tiết →</Link></footer>
      </article>)}</section>)}</div>}
  </section>;
}

function FragmentGroup({group,items,documents,collapsed,onToggle}:{group:string;items:MatrixFinding[];documents:MatrixDocument[];collapsed:boolean;onToggle:()=>void}){
  return <>{<tr className="issue-group-row"><td colSpan={7+documents.length}>
    <button type="button" onClick={onToggle} aria-expanded={!collapsed}><span>{collapsed?"▸":"▾"}</span>{group}<strong>{items.length} issue</strong></button>
  </td></tr>}
  {!collapsed&&items.map(finding=>{
    const evidenceMap=new Map(finding.evidence.map(item=>[item.ref,item]));
    return <tr key={finding.id}>
      <td className="matrix-sticky matrix-col-id"><Link href={`/findings/${finding.id}`}>{finding.code}</Link><span className={`finding-severity-pill finding-severity-${finding.severity}`}>{finding.severityLabel}</span></td>
      <td className="matrix-sticky matrix-col-type"><strong>{finding.issueCode||"—"}</strong><span>{finding.issueType}</span></td>
      <td className="matrix-sticky matrix-col-decision"><LongText value={finding.decisionPoint||finding.title}/></td>
      <td className="matrix-sticky matrix-col-problem"><LongText value={finding.description}/>{finding.impact&&<small className="issue-impact-note">Tác động: {finding.impact}</small>}</td>
      <td className="matrix-sticky matrix-col-action"><LongText value={finding.proposedAction} empty="Chưa đề xuất action"/><small className="issue-action-note">{finding.actionSummary} · {finding.actionProgress}%</small></td>
      <td className="matrix-owner"><span className="status-badge">{evidenceLabels[finding.evidenceStatus]||finding.evidenceStatus}</span><LongText value={finding.ownerQuestion} empty="Chưa có câu hỏi Owner"/></td>
      <td className="matrix-owner-note"><LongText value={finding.ownerFeedback} empty="Chờ ý kiến Owner"/><small>{finding.assignee} · {finding.dueAt?new Date(finding.dueAt).toLocaleDateString("vi-VN"):"Chưa đặt hạn"}</small></td>
      {documents.map(doc=>{const evidence=evidenceMap.get(doc.ref);const referenced=Boolean(evidence);return <td key={doc.ref} className={`matrix-evidence ${referenced?(doc.available?"has-evidence":"missing-source"):""}`}>
        {referenced?<><span className="matrix-evidence-mark">{doc.available?"●":"!"} [{doc.ref}]</span><LongText value={evidence?.evidence||null} empty={doc.available?"Có liên kết; chưa nhập trích dẫn":"Nguồn được viện dẫn nhưng chưa có file"}/></>:<span className="issue-matrix-empty">Chưa đánh giá</span>}
      </td>})}
    </tr>;
  })}</>;
}
