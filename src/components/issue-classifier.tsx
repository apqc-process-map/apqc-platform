"use client";

import { useMemo, useState } from "react";

export type IssueTaxonomyItem={
  code:string;group_code:string;group_label_vi:string;type_label_vi:string;
  explanation_vi:string;decision_order:number;decision_question_vi:string;minimum_evidence_vi:string;
};

export default function IssueClassifier({items,defaultCode=""}:{items:IssueTaxonomyItem[];defaultCode?:string}){
  const initial=items.find(x=>x.code===defaultCode);
  const [group,setGroup]=useState(initial?.group_code||"");
  const [code,setCode]=useState(defaultCode);
  const [answers,setAnswers]=useState<Record<string,boolean>>({});
  const groups=useMemo(()=>Array.from(new Map(items.map(x=>[x.group_code,x.group_label_vi])).entries()),[items]);
  const types=items.filter(x=>x.group_code===group);
  const selected=items.find(x=>x.code===code);
  const recommended=items.slice().sort((a,b)=>a.decision_order-b.decision_order).find(x=>answers[x.code]);
  const chooseRecommendation=()=>{if(recommended){setGroup(recommended.group_code);setCode(recommended.code)}};
  return <div className="issue-classifier finding-full">
    <div className="issue-classifier-fields">
      <label>Nhóm vấn đề<select value={group} onChange={e=>{setGroup(e.target.value);setCode("")}} required>
        <option value="">Chọn nhóm</option>{groups.map(([value,label])=><option key={value} value={value}>{value}. {label}</option>)}
      </select></label>
      <label>Loại lỗi chuẩn hóa<select name="primary_issue_code" value={code} onChange={e=>setCode(e.target.value)} required disabled={!group}>
        <option value="">Chọn loại lỗi</option>{types.map(x=><option key={x.code} value={x.code}>{x.code} · {x.type_label_vi}</option>)}
      </select></label>
      <aside className="issue-explanation" aria-live="polite"><strong>Diễn giải</strong>
        <p>{selected?.explanation_vi||"Chọn loại lỗi để xem định nghĩa chuẩn."}</p>
        {selected&&<small>Bằng chứng tối thiểu: {selected.minimum_evidence_vi}</small>}
      </aside>
    </div>
    <details className="issue-decision-tree">
      <summary><span>Cây quyết định B → C → A → D</span><small>Trả lời từ trên xuống; câu “Có” đầu tiên là mã đề xuất.</small></summary>
      <div className="issue-tree-flow">{items.slice().sort((a,b)=>a.decision_order-b.decision_order).map((item,index)=><div className="issue-tree-node" key={item.code}>
        <span className="issue-tree-index">{index+1}</span><div><strong>{item.code} · {item.type_label_vi}</strong><p>{item.decision_question_vi}</p></div>
        <label className="issue-tree-answer"><input type="checkbox" checked={!!answers[item.code]} onChange={e=>setAnswers(current=>({...current,[item.code]:e.target.checked}))}/> Có</label>
      </div>)}</div>
      <div className="issue-recommendation"><div><small>Kết quả chẩn đoán</small><strong>{recommended?`${recommended.code} · ${recommended.type_label_vi}`:"Chưa có câu trả lời Có — xem xét ngoài taxonomy, không tự tạo mã mới."}</strong></div>
        {recommended&&<button type="button" className="text-button" onClick={chooseRecommendation}>Dùng mã đề xuất</button>}
      </div>
    </details>
  </div>;
}
