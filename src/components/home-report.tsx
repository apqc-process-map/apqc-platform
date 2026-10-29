import Link from "next/link";

export type HomeSummary = {
  from_date:string; to_date:string;
  new_documents:number; files_uploaded:number; documents_with_files:number;
  findings_found:number; findings_remedied:number;
  without_department:number; open_findings_now:number; overdue_actions_now:number;
  departments:{name:string;count:number}[];
  finding_statuses:{status:string;count:number}[];
  timeline:{date:string;documents:number;files:number;found:number;remedied:number}[];
};
type Interval = { label:string; documents:number; files:number; found:number; remedied:number };
const n=(value:number)=>value.toLocaleString("vi-VN");
const d=(iso:string)=>iso&&iso.length>=10?`${iso.slice(8,10)}/${iso.slice(5,7)}`:iso;
const statuses:Record<string,string>={
  new:"Mới",open:"Đang mở",triage:"Đang phân loại",in_progress:"Đang xử lý",
  pending_decision:"Chờ quyết định",resolved:"Đã xử lý",closed:"Đã đóng",
};

function groupedTrend(rows:HomeSummary["timeline"]):Interval[]{
  if(!rows.length)return [];
  // Compact charts group long periods into up to twelve time buckets.
  const chunk=rows.length<=14?1:Math.ceil(rows.length/12);
  const list:Interval[]=[];
  for(let i=0;i<rows.length;i+=chunk){
    const slice=rows.slice(i,i+chunk);
    list.push({
      label:chunk===1?d(slice[0].date):`${d(slice[0].date)}–${d(slice[slice.length-1].date)}`,
      documents:slice.reduce((a,b)=>a+b.documents,0),
      files:slice.reduce((a,b)=>a+b.files,0),
      found:slice.reduce((a,b)=>a+b.found,0),
      remedied:slice.reduce((a,b)=>a+b.remedied,0),
    });
  }
  return list;
}
function Trends({rows,kind}:{rows:Interval[];kind:"documents"|"findings"}){
  const isDoc=kind==="documents";
  const keys=isDoc?["documents","files"] as const:["found","remedied"] as const;
  const max=Math.max(1,...rows.flatMap(row=>keys.map(key=>row[key])));
  return <div className="home-trend-graph" role="img" aria-label={isDoc?"Xu hướng hồ sơ mới và tệp tải lên":"Xu hướng finding phát hiện và khắc phục"}>
    <div className="home-trend-bars">{rows.map((entry,i)=><div className="home-trend-slot" key={`${entry.label}-${i}`}>
      <div className="home-trend-pair">
        {keys.map((key,j)=><span key={key} className={`home-trend-bar home-trend-bar-${j}`}
          style={{height:entry[key]>0?`${Math.max(3,100*entry[key]/max)}%`:"0%"}}
          title={`${entry.label} · ${key==="documents"?"Hồ sơ mới":key==="files"?"Tệp tải lên":key==="found"?"Finding phát hiện":"Finding khắc phục"}: ${n(entry[key])}`}/>)}
      </div>
      <span className="home-trend-day">{entry.label}</span>
    </div>)}</div>
    <div className="home-trend-legend"><span><i className="home-trend-key primary"/>{isDoc?"Hồ sơ mới":"Phát hiện"}</span><span><i className="home-trend-key secondary"/>{isDoc?"Tệp tải lên":"Khắc phục"}</span></div>
    {rows.every(row=>keys.every(key=>row[key]===0))&&<p className="home-trend-empty">Không phát sinh trong kỳ đã chọn.</p>}
  </div>;
}
export default function HomeReport({summary,from,to,error}:{
  summary:HomeSummary|null;from:string;to:string;error?:string;
}){
  const dates=`${d(from)}–${d(to)}/${to.slice(0,4)}`;
  const timeline=groupedTrend(summary?.timeline||[]);
  const departments=summary?.departments||[];
  const top=departments.slice(0,8);
  const rest=departments.slice(8).reduce((sum,item)=>sum+item.count,0);
  const maxDept=Math.max(1,...top.map(item=>item.count));
  const completeDept=summary?Math.max(0,summary.new_documents-summary.without_department):0;
  const watch=summary?[
    summary.open_findings_now>0?`${n(summary.open_findings_now)} finding chưa xử lý`:null,
    summary.new_documents>0&&summary.files_uploaded===0?"Hồ sơ tăng nhưng chưa có tệp tải lên trong kỳ":null,
    summary.without_department>0?`${n(summary.without_department)} hồ sơ mới thiếu đơn vị ban hành`:null,
  ].filter(Boolean):[];
  return <section className="home-insights" aria-labelledby="home-report-heading">
    <div className="executive-section-heading">
      <div><p className="section-kicker">02 / DIỄN BIẾN & ƯU TIÊN XỬ LÝ</p>
        <h2 id="home-report-heading">Điểm cần điều hành chú ý</h2>
        <p>Phân bổ theo đơn vị, tồn đọng hiện tại và xu hướng từ ${dates}.</p></div>
      <Link className="executive-catalog-note" href="/findings">Xem danh sách finding</Link>
    </div>
    {error||!summary?<div role="alert" className="home-insight-error">Không thể tải dữ liệu tổng quan: {error||"Không có dữ liệu trả về."}</div>:<>
      {watch.length>0&&<div className="executive-focus-line"><strong>ĐIỂM CẦN LƯU Ý</strong><span>{watch.join(" · ")}</span></div>}
      <div className="home-insight-panels secondary">
        <article className="home-insight-panel">
          <div className="home-panel-head"><h3>Đơn vị có hồ sơ mới</h3><Link href="/documents">Tra cứu tài liệu</Link></div>
          <p>Phân bổ {n(summary.new_documents)} hồ sơ trong kỳ. Tên đơn vị khác nhau về chữ hoa/thường được gộp.</p>
          {top.length?<div className="home-department-list">{top.map((row,i)=><div className="home-department-item" key={`${row.name}-${i}`}>
            <div className="home-department-heading"><span title={row.name}>{row.name}</span><strong>{n(row.count)}</strong></div>
            <div className="home-department-track"><span style={{width:`${100*row.count/maxDept}%`}}/></div>
          </div>)}
          {rest>0&&<div className="home-department-others">Các đơn vị còn lại: <strong>{n(rest)}</strong> hồ sơ</div>}</div>:
            <div className="home-empty">Chưa có hồ sơ mới trong kỳ.</div>}
        </article>
        <article className="home-insight-panel">
          <div className="home-panel-head"><h3>Tồn đọng và chất lượng dữ liệu</h3><Link href="/findings">Xử lý findings</Link></div>
          <div className="home-watch-grid">
            <div><strong>{n(summary.open_findings_now)}</strong><span>Finding chưa xử lý <em>(hiện tại)</em></span></div>
            <div><strong>{n(summary.overdue_actions_now)}</strong><span>Hành động khắc phục quá hạn <em>(hiện tại)</em></span></div>
            <div><strong>{n(summary.without_department)}</strong><span>Hồ sơ thiếu đơn vị ban hành <em>(trong kỳ)</em></span></div>
          </div>
          {summary.new_documents>0&&<p className="home-report-note">Chất lượng metadata: <strong>{n(completeDept)}/{n(summary.new_documents)}</strong> hồ sơ mới có đơn vị ban hành.</p>}
          <div className="home-finding-status">
            <strong>Trạng thái hiện tại của findings phát hiện trong kỳ</strong>
            {summary.finding_statuses.length?<div>{summary.finding_statuses.map(item=><span key={item.status}>{statuses[item.status]||item.status}: <b>{n(item.count)}</b></span>)}</div>:
              <small>Không có finding mới trong kỳ.</small>}
          </div>
        </article>
      </div>

      <div className="home-insight-panels">
        <article className="home-insight-panel">
          <div className="home-panel-head"><h3>Xu hướng tài liệu</h3><Link href="/documents">Xem thư viện</Link></div>
          <p>Hồ sơ tạo mới so với số tệp thực sự tải lên theo từng ngày hoặc cụm ngày.</p>
          <Trends kind="documents" rows={timeline}/>
        </article>
        <article className="home-insight-panel">
          <div className="home-panel-head"><h3>Xu hướng finding</h3><Link href="/findings">Xem findings</Link></div>
          <p>Finding phát hiện trong kỳ và finding hoàn tất khắc phục trong kỳ.</p>
          <Trends kind="findings" rows={timeline}/>
        </article>
      </div>
      <p className="home-report-footnote">Định nghĩa: “Hồ sơ mới” đếm tài liệu theo ngày tạo danh mục, kể cả hồ sơ chỉ có metadata; “Có tệp tải lên” đếm tài liệu duy nhất có tệp đính kèm được tải trong kỳ (một tài liệu có thể có nhiều tệp). “Đã khắc phục” chỉ đếm finding có quyết định cần hành động và đã xử lý xong/đóng, theo ngày giải quyết. Tồn đọng phản ánh trạng thái hiện tại, không phải số dư lịch sử. Các thống kê tuân theo RLS.</p>
    </>}
  </section>;
}
