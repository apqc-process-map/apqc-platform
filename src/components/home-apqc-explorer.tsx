"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

type L1 = {id:string;code:string;name:string;total_l2:number;total_l3:number;mapped_l3:number;documents:number};
type L2 = {id:string;parent_id:string;code:string;name:string;total_l3:number;mapped_l3:number;documents:number};
type L3 = {id:string;parent_id:string;code:string;name:string;documents:number};
export type HomeHierarchySummary = {
  framework:string;framework_version:string;
  total_l1:number;total_l2:number;total_l3:number;mapped_l3:number;mapped_documents:number;
  level1:L1[];level2:L2[];level3:L3[];
};
const num=(v:number)=>v.toLocaleString("vi-VN");
const vietnameseL1:Record<string,string>={
  "1":"Chiến lược & định hướng","2":"Sản phẩm & dịch vụ",
  "3":"Tiếp thị & bán hàng","4":"Chuỗi cung ứng","5":"Cung cấp dịch vụ",
  "6":"Dịch vụ khách hàng","7":"Nhân sự","8":"Công nghệ thông tin",
  "9":"Tài chính","10":"Tài sản & cơ sở vật chất","11":"Rủi ro & tuân thủ",
  "12":"Quan hệ đối ngoại","13":"Năng lực doanh nghiệp",
};
const l1Name=(row:L1)=>vietnameseL1[row.code.split(".")[0]]||row.name;
export default function HomeApqcExplorer({data,error}:{data:HomeHierarchySummary|null;error?:string}){
  const [selectedL1,setSelectedL1]=useState<string>(()=>data?.level1.find(v=>v.documents>0)?.id||data?.level1[0]?.id||"");
  const [selectedL2,setSelectedL2]=useState<string>("");
  const l1Rows=data?.level1||[];
  const activeL1=l1Rows.find(v=>v.id===selectedL1)||l1Rows[0];
  const l2Rows=useMemo(
    ()=>[...(data?.level2||[])].filter(v=>v.parent_id===activeL1?.id).sort((a,b)=>b.documents-a.documents||a.code.localeCompare(b.code,"en",{numeric:true})),
    [data,activeL1?.id]
  );
  const activeL2=l2Rows.find(v=>v.id===selectedL2)||l2Rows[0];
  const l3Rows=useMemo(
    ()=>[...(data?.level3||[])].filter(v=>v.parent_id===activeL2?.id).sort((a,b)=>b.documents-a.documents||a.code.localeCompare(b.code,"en",{numeric:true})),
    [data,activeL2?.id]
  );
  const percentage=data?.total_l3?Math.round(1000*data.mapped_l3/data.total_l3)/10:0;
  return <section className="executive-coverage" aria-labelledby="home-coverage-title">
    <div className="executive-section-heading">
      <div><p className="section-kicker">02 / PHÂN BỔ DANH MỤC THEO APQC</p>
        <h2 id="home-coverage-title">L1 → L2 → L3: độ phủ gắn tài liệu</h2>
        <p>Chọn một nhóm L1, sau đó chọn L2 để xem quy trình L3 và số hồ sơ đã gắn.</p></div>
      <div className="executive-catalog-note">Toàn bộ kho · không theo kỳ</div>
    </div>
    {!data||error?<div role="status" className="home-insight-error">Chưa tải được phân cấp APQC: {error||"Không có dữ liệu."}</div>:<>
      <div className="executive-coverage-metrics">
        <div><b>{num(data.total_l1)}</b><span>Danh mục L1</span></div>
        <div><b>{num(data.total_l2)}</b><span>Nhóm L2</span></div>
        <div><b>{num(data.total_l3)}</b><span>Quy trình L3</span></div>
        <div><b>{num(data.mapped_l3)}<small> / {num(data.total_l3)}</small></b><span>L3 có gắn tài liệu · {percentage}%</span></div>
        <div><b>{num(data.mapped_documents)}</b><span>Hồ sơ đã map APQC</span></div>
      </div>
      <div className="executive-hierarchy">
        <div className="executive-hierarchy-pane">
          <div className="executive-hierarchy-pane-title"><strong>L1 · Danh mục</strong><span>{num(l1Rows.length)} nhóm</span></div>
          <div className="executive-hierarchy-rows">{l1Rows.map(row=><button type="button" key={row.id}
            className={`executive-hierarchy-choice ${activeL1?.id===row.id?"is-selected":""}`}
            aria-pressed={activeL1?.id===row.id} onClick={()=>{setSelectedL1(row.id);setSelectedL2("");}}>
            <span className="executive-hierarchy-choice-main"><b>{row.code}</b><span title={row.name}>{l1Name(row)}</span></span>
            <small>{num(row.mapped_l3)}/{num(row.total_l3)} L3 · {num(row.documents)} hồ sơ</small>
          </button>)}</div>
        </div>
        <div className="executive-hierarchy-pane">
          <div className="executive-hierarchy-pane-title"><strong>L2 · Nhóm quy trình</strong><span>{num(l2Rows.length)} nhóm</span></div>
          <div className="executive-hierarchy-rows">{l2Rows.length?l2Rows.map(row=><button type="button" key={row.id}
            className={`executive-hierarchy-choice ${activeL2?.id===row.id?"is-selected":""}`}
            aria-pressed={activeL2?.id===row.id} onClick={()=>setSelectedL2(row.id)}>
            <span className="executive-hierarchy-choice-main"><b>{row.code}</b><span>{row.name}</span></span>
            <small>{num(row.mapped_l3)}/{num(row.total_l3)} L3 · {num(row.documents)} hồ sơ</small>
          </button>):<p className="executive-hierarchy-empty">Không có nhóm L2.</p>}</div>
        </div>
        <div className="executive-hierarchy-pane">
          <div className="executive-hierarchy-pane-title"><strong>L3 · Quy trình</strong><span>{num(l3Rows.length)} quy trình</span></div>
          <div className="executive-hierarchy-rows">{l3Rows.length?l3Rows.map(row=><Link key={row.id}
            className="executive-hierarchy-choice executive-hierarchy-leaf" href={`/catalog/apqc/${row.id}`}>
            <span className="executive-hierarchy-choice-main"><b>{row.code}</b><span>{row.name}</span></span>
            <small>{row.documents?`${num(row.documents)} hồ sơ đã map`:"Chưa gắn tài liệu"}</small>
          </Link>):<p className="executive-hierarchy-empty">Không có quy trình L3.</p>}</div>
        </div>
      </div>
      <div className="executive-hierarchy-footer">
        <p>Chỉ số mô tả <strong>phân bổ liên kết tài liệu</strong>, không phải tỷ lệ tuân thủ, hoàn thiện quy trình hay hiệu quả vận hành. Nguồn: APQC PNJ interpretation, hồ sơ được phép xem.</p>
        <Link href="/process-map">Mở Process Map</Link>
      </div>
    </>}
  </section>;
}
