"use client";

import Link from "next/link";
import { useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";

export type MatrixDocument={
  id:string|null;ref:number;code:string;title:string;department:string|null;
  documentType:string|null;validFrom:string|null;available:boolean;
};
export type MatrixEvidence={documentId:string|null;ref:number;evidence:string|null};
export type MatrixProcess={id:string;code:string;name:string;level:string};
export type MatrixFinding={
  id:string;code:string;title:string;description:string|null;impact:string|null;
  issueCode:string|null;issueType:string;groupCode:string;groupLabel:string;
  decisionPoint:string|null;proposedAction:string|null;ownerQuestion:string|null;
  ownerFeedback:string|null;evidenceStatus:string;status:string;statusLabel:string;
  severity:string;severityLabel:string;assignee:string;dueAt:string|null;
  actionSummary:string;actionProgress:number;evidence:MatrixEvidence[];
  relatedProcesses:MatrixProcess[];canEdit:boolean;
};

const evidenceLabels:Record<string,string>={candidate:"Mới ghi nhận",pending:"Chờ xác minh",validated:"Đã xác nhận",rejected:"Không hợp lệ"};
const dateLabel=(value:string|null)=>value?new Date(value+"T00:00:00").toLocaleDateString("vi-VN"):"Chưa xác định";

const defaultWidths={
  order:42,id:74,type:130,decision:82,problem:180,action:170,owner:120,ownerNote:104,related:190,content:350
};
type ColumnKey=keyof typeof defaultWidths;
const columnOrder=Object.keys(defaultWidths) as ColumnKey[];
const minimumWidths:Record<ColumnKey,number>={
  order:38,id:64,type:100,decision:68,problem:130,action:130,owner:96,ownerNote:84,related:145,content:230
};
const columnLabels:Record<ColumnKey,string>={
  order:"STT",id:"ID",type:"Loại lỗi",decision:"Điểm quyết định",problem:"Vấn đề",action:"Hướng xử lý",
  owner:"Xác nhận Owner",ownerNote:"Ý kiến Owner",related:"Quy trình / tài liệu liên quan",content:"Nội dung đối chiếu"
};

function LongText({value,empty="Chưa có nội dung"}:{value:string|null;empty?:string}){
  if(!value)return <span className="issue-matrix-empty">{empty}</span>;
  return <details className="issue-matrix-text"><summary>{value}</summary><p>{value}</p></details>;
}

function ResizeHandle({column,width,onResize}:{column:ColumnKey;width:number;onResize:(column:ColumnKey,width:number)=>void}){
  const setWidth=(next:number)=>onResize(column,Math.max(minimumWidths[column],next));
  const onPointerDown=(event:PointerEvent<HTMLButtonElement>)=>{
    event.preventDefault();
    const startX=event.clientX,startWidth=width;
    const move=(moveEvent:globalThis.PointerEvent)=>setWidth(startWidth+moveEvent.clientX-startX);
    const stop=()=>{window.removeEventListener("pointermove",move);window.removeEventListener("pointerup",stop);};
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",stop);
  };
  const onKeyDown=(event:KeyboardEvent<HTMLButtonElement>)=>{
    if(event.key!=="ArrowLeft"&&event.key!=="ArrowRight")return;
    event.preventDefault();
    setWidth(width+(event.key==="ArrowRight"?10:-10));
  };
  return <button type="button" className="matrix-resize-handle" onPointerDown={onPointerDown} onKeyDown={onKeyDown}
    aria-label={"Đổi độ rộng cột "+columnLabels[column]} title="Kéo hoặc dùng phím ← → để đổi độ rộng"/>;
}

export default function FindingIssueMatrix({findings,documents}:{findings:MatrixFinding[];documents:MatrixDocument[]}){
  const [view,setView]=useState<"matrix"|"list">("matrix");
  const [query,setQuery]=useState("");
  const [scope,setScope]=useState<"all"|"single"|"multi"|"missing">("all");
  const [collapsed,setCollapsed]=useState<Record<string,boolean>>({});
  const [widths,setWidths]=useState(defaultWidths);
  const setColumnWidth=(column:ColumnKey,width:number)=>setWidths(current=>({...current,[column]:width}));
  const tableWidth=columnOrder.reduce((sum,column)=>sum+widths[column],0);
  const visible=useMemo(()=>{
    const needle=query.trim().toLocaleLowerCase("vi");
    return findings.filter(f=>{
      const refs=new Set(f.evidence.map(e=>e.ref));
      const availableRefs=new Set(f.evidence.filter(e=>e.documentId).map(e=>e.ref));
      const missing=[...refs].some(ref=>!documents.find(d=>d.ref===ref)?.available);
      if(scope==="single"&&availableRefs.size!==1)return false;
      if(scope==="multi"&&availableRefs.size<2)return false;
      if(scope==="missing"&&!missing)return false;
      const evidenceText=f.evidence.map(item=>item.evidence).filter(Boolean).join(" ");
      const processText=f.relatedProcesses.map(item=>item.code+" "+item.name).join(" ");
      const sourceText=f.evidence.map(item=>documents.find(doc=>doc.ref===item.ref)?.title||"").join(" ");
      return !needle||[f.code,f.title,f.description,f.decisionPoint,f.proposedAction,f.ownerQuestion,f.issueCode,f.issueType,evidenceText,processText,sourceText]
        .some(value=>value?.toLocaleLowerCase("vi").includes(needle));
    });
  },[documents,findings,query,scope]);
  const groups=useMemo(()=>{
    const result=new Map<string,MatrixFinding[]>();
    for(const finding of visible){const key=finding.groupCode+" · "+finding.groupLabel;result.set(key,[...(result.get(key)||[]),finding]);}
    return [...result.entries()];
  },[visible]);
  const rowNumbers=useMemo(()=>new Map(groups.flatMap(([,items])=>items).map((finding,index)=>[finding.id,index+1] as const)),[groups]);

  return <section className="data-panel issue-register-panel">
    <div className="data-panel-heading issue-register-heading">
      <div><p className="section-kicker">ISSUE REGISTER · EVIDENCE VIEW</p><h2>{visible.length}/{findings.length} finding</h2></div>
      <div className="finding-view-tabs" aria-label="Kiểu hiển thị">
        <button type="button" className={view==="matrix"?"is-selected":""} onClick={()=>setView("matrix")}>Ma trận</button>
        <button type="button" className={view==="list"?"is-selected":""} onClick={()=>setView("list")}>Danh sách</button>
      </div>
    </div>
    <div className="issue-matrix-toolbar">
      <label><span>Tìm trong issue</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="ID, vấn đề, nguồn, nội dung đối chiếu…"/></label>
      <label><span>Phạm vi bằng chứng</span><select value={scope} onChange={event=>setScope(event.target.value as typeof scope)}>
        <option value="all">Tất cả issue</option><option value="multi">Từ 2 tài liệu</option><option value="single">Một tài liệu</option><option value="missing">Có nguồn chưa được cung cấp</option>
      </select></label>
      <div className="issue-matrix-key"><span><i className="has-evidence"/>Có bằng chứng</span><span><i className="missing-source"/>Thiếu nguồn</span><span className="matrix-resize-key">↔ Kéo mép cột để đổi kích thước</span></div>
    </div>
    <details className="issue-document-index">
      <summary><strong>Danh mục 14 nguồn đối chiếu</strong><span>{documents.filter(doc=>doc.available).length} nguồn đã tải · {documents.filter(doc=>!doc.available).length} nguồn chưa được cung cấp</span></summary>
      <div>{documents.map(doc=><article key={doc.ref} className={doc.available?"":"is-missing"}>
        <span className="issue-doc-ref">[{doc.ref}]</span><div><strong>{doc.title}</strong><small>{doc.documentType||"Chưa xác định loại"} · {doc.department||"Chưa xác định đơn vị"} · {dateLabel(doc.validFrom)}</small></div>
      </article>)}</div>
    </details>
    {!visible.length?<div className="state-message"><strong>Không có issue phù hợp</strong><span>Thử đổi từ khóa hoặc phạm vi bằng chứng.</span></div>:
    view==="matrix"?<div className="issue-matrix-scroll" tabIndex={0} aria-label="Ma trận finding và nội dung đối chiếu">
      <table className="issue-matrix-table" style={{width:tableWidth}}>
        <colgroup>{columnOrder.map(column=><col key={column} style={{width:widths[column]}}/>)}</colgroup>
        <thead><tr>
          {columnOrder.map(column=><th key={column} className={"matrix-col-"+column}>
            <span>{columnLabels[column]}</span><ResizeHandle column={column} width={widths[column]} onResize={setColumnWidth}/>
          </th>)}
        </tr></thead>
        <tbody>{groups.map(([group,items])=><FragmentGroup key={group} group={group} items={items} documents={documents} rowNumbers={rowNumbers} collapsed={!!collapsed[group]} onToggle={()=>setCollapsed(current=>({...current,[group]:!current[group]}))}/>)}</tbody>
      </table>
    </div>:<div className="finding-issue-list issue-list-view">{groups.map(([group,items])=><section key={group}>
      <header><strong>{group}</strong><span>{items.length} issue</span></header>
      {items.map(finding=><article key={finding.id} className="finding-issue-card">
        <div className="finding-issue-head"><div><span className="mono-code">{finding.code}</span><span className="status-badge">{finding.statusLabel}</span><h3><Link href={"/findings/"+finding.id}>{finding.title}</Link></h3></div><span className={"finding-severity-pill finding-severity-"+finding.severity}>{finding.severityLabel}</span></div>
        <p>{finding.description||"Chưa có mô tả vấn đề."}</p><div className="finding-issue-type">{finding.issueCode||"—"} · {finding.issueType}</div>
        <div className="issue-list-meta"><span><strong>Điểm quyết định</strong>{finding.decisionPoint||"Chưa có"}</span><span><strong>Hướng xử lý</strong>{finding.proposedAction||"Chưa đề xuất"}</span><span><strong>Owner</strong>{finding.ownerFeedback||finding.ownerQuestion||"Chờ xác nhận"}</span></div>
        <footer><span>{finding.evidence.length} nguồn được viện dẫn</span><span>{finding.actionSummary}</span><Link className="text-button" href={"/findings/"+finding.id+"#issue-metadata"}>{finding.canEdit?"Sửa issue →":"Xem chi tiết →"}</Link></footer>
      </article>)}</section>)}</div>}
  </section>;
}

function FragmentGroup({group,items,documents,rowNumbers,collapsed,onToggle}:{group:string;items:MatrixFinding[];documents:MatrixDocument[];rowNumbers:Map<string,number>;collapsed:boolean;onToggle:()=>void}){
  const documentMap=new Map(documents.map(document=>[document.ref,document]));
  return <>{<tr className="issue-group-row"><td colSpan={columnOrder.length}>
    <button type="button" onClick={onToggle} aria-expanded={!collapsed}><span>{collapsed?"▸":"▾"}</span>{group}<strong>{items.length} issue</strong></button>
  </td></tr>}
  {!collapsed&&items.map(finding=>{
    const evidence=[...finding.evidence].sort((a,b)=>a.ref-b.ref);
    return <tr key={finding.id}>
      <td className="matrix-col-order">{rowNumbers.get(finding.id)}</td>
      <td className="matrix-col-id"><Link href={"/findings/"+finding.id}>{finding.code}</Link><span className={"finding-severity-pill finding-severity-"+finding.severity}>{finding.severityLabel}</span><Link className="matrix-row-edit" href={"/findings/"+finding.id+"#issue-metadata"} aria-label={(finding.canEdit?"Sửa":"Xem")+" issue "+finding.code}>{finding.canEdit?"Sửa":"Xem"}</Link></td>
      <td className="matrix-col-type"><strong>{finding.issueCode||"—"}</strong><span>{finding.issueType}</span></td>
      <td className="matrix-col-decision"><LongText value={finding.decisionPoint||finding.title}/></td>
      <td className="matrix-col-problem"><LongText value={finding.description}/>{finding.impact&&<small className="issue-impact-note">Tác động: {finding.impact}</small>}</td>
      <td className="matrix-col-action"><LongText value={finding.proposedAction} empty="Chưa đề xuất action"/><small className="issue-action-note">{finding.actionSummary} · {finding.actionProgress}%</small></td>
      <td className="matrix-owner"><span className="status-badge">{evidenceLabels[finding.evidenceStatus]||finding.evidenceStatus}</span><LongText value={finding.ownerQuestion} empty="Chưa có câu hỏi Owner"/></td>
      <td className="matrix-col-ownerNote"><LongText value={finding.ownerFeedback} empty="Chờ ý kiến Owner"/><small>{finding.assignee} · {finding.dueAt?new Date(finding.dueAt).toLocaleDateString("vi-VN"):"Chưa đặt hạn"}</small></td>
      <td className="matrix-related"><div className="matrix-related-list">
        {finding.relatedProcesses.length?<div className="matrix-related-group"><strong>Quy trình</strong>{finding.relatedProcesses.map(process=><span key={process.id} className="matrix-related-item"><b>{process.code}</b>{process.name}<small>{process.level}</small></span>)}</div>:<span className="issue-matrix-empty">Chưa liên kết quy trình</span>}
        {evidence.length?<div className="matrix-related-group"><strong>Tài liệu có issue</strong>{evidence.map(item=>{const document=documentMap.get(item.ref);return <span key={item.ref} className={document?.available?"matrix-related-item":"matrix-related-item is-missing"} title={document?.title}><b>[{item.ref}]</b>{document?.title||"Nguồn chưa được cung cấp"}</span>})}</div>:<span className="issue-matrix-empty">Chưa liên kết tài liệu</span>}
      </div></td>
      <td className="matrix-content">{evidence.length?<div className="matrix-content-list">{evidence.map(item=>{const document=documentMap.get(item.ref);return <article key={item.ref} className={document?.available?"has-evidence":"missing-source"}><strong>[{item.ref}] {document?.title||"Nguồn chưa được cung cấp"}</strong><LongText value={item.evidence} empty={document?.available?"Có liên kết; chưa nhập trích dẫn":"Nguồn được viện dẫn nhưng chưa có file"}/></article>})}</div>:<span className="issue-matrix-empty">Chưa có nội dung đối chiếu</span>}</td>
    </tr>;
  })}</>;
}
