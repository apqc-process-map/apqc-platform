import Link from "next/link";
import Form from "next/form";
import type { HomeSummary } from "@/components/home-report";
import type { HomeHierarchySummary } from "@/components/home-apqc-explorer";

const num=(value:number)=>value.toLocaleString("vi-VN");
const day=(date:string)=>date.slice(8,10)+"/"+date.slice(5,7)+"/"+date.slice(0,4);
type Period="7d"|"30d"|"90d"|"custom";

export default function HomeExecutiveHeader({
  roleLabel,period,from,to,today,summary,hierarchy,processCount,documentCount,queueCount,queueLabel,queueHref
}:{
  roleLabel:string;period:Period;from:string;to:string;today:string;
  summary:HomeSummary|null;hierarchy:HomeHierarchySummary|null;
  processCount:number;documentCount:number;
  queueCount:number;queueLabel:string;queueHref:string;
}){
  const headline=[
    {label:"Hồ sơ tài liệu mới",value:summary?.new_documents,description:"Được tạo trong kỳ · có thể chưa có tệp",href:"/documents"},
    {label:"Tài liệu có tệp tải lên",value:summary?.documents_with_files,description:`${summary?num(summary.files_uploaded):"—"} tệp thực tế trong kỳ`,href:"/documents"},
    {label:"Finding phát hiện",value:summary?.findings_found,description:"Finding tài liệu được tạo trong kỳ",href:"/findings"},
    {label:"Finding đã khắc phục",value:summary?.findings_remedied,description:"Đã xử lý/đóng và có yêu cầu khắc phục",href:"/findings"},
  ];
  return <div className="executive-shell">
    <div className="executive-command">
      <div className="executive-heading">
        <p className="executive-eyebrow"><span>{roleLabel}</span><span className="executive-eyebrow-divider">/</span> GÓC NHÌN ĐIỀU HÀNH</p>
        <h1>Tổng quan quản trị quy trình & tài liệu</h1>
        <p>Diễn biến trong kỳ, mức độ gắn tài liệu vào APQC và việc cần ưu tiên xử lý.</p>
      </div>
      <Form action="/" scroll={false} className="executive-period-form">
        <label>Khung thời gian
          <select name="period" defaultValue={period}>
            <option value="7d">7 ngày gần nhất</option><option value="30d">30 ngày gần nhất</option>
            <option value="90d">90 ngày gần nhất</option><option value="custom">Khoảng tùy chọn</option>
          </select>
        </label>
        <label>Từ ngày<input name="from" type="date" defaultValue={from} max={today}/></label>
        <label>Đến ngày<input name="to" type="date" defaultValue={to} max={today}/></label>
        <button type="submit">Áp dụng</button>
      </Form>
    </div>
    <div className="executive-scope-strip">
      <div className="executive-scope-context"><strong>TOÀN BỘ DANH MỤC</strong><small>Không phụ thuộc bộ lọc ngày</small></div>
      <Link href="/process-map"><b>{num(hierarchy?.total_l1??0)}</b> APQC L1 <span>/</span> <b>{num(hierarchy?.total_l2??0)}</b> L2 <span>/</span> <b>{num(hierarchy?.total_l3??0)}</b> L3</Link>
      <Link href="/process-map"><b>{num(processCount)}</b> quy trình nội bộ</Link>
      <Link href="/documents"><b>{num(documentCount)}</b> hồ sơ tài liệu</Link>
      <Link href={queueHref}><b>{num(queueCount)}</b> {queueLabel}</Link>
    </div>
    <div className="executive-kpi-topline">
      <strong>01 <span>/</span> KẾT QUẢ TRONG KỲ</strong>
      <span>{day(from)} – {day(to)} · GMT+7 · theo quyền truy cập</span>
    </div>
    <div className="executive-kpi-grid">
      {headline.map((metric,index)=><Link href={metric.href} className="executive-kpi" key={metric.label}>
        <span className="executive-kpi-label"><i>{String(index+1).padStart(2,"0")}</i>{metric.label}</span>
        <strong>{metric.value==null?"—":num(metric.value)}</strong>
        <small>{metric.description}</small>
      </Link>)}
    </div>
  </div>;
}
