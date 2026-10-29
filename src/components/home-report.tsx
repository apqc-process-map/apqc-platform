import Link from "next/link";

export type HomeSummary = {
  from_date: string; to_date: string;
  new_documents: number; files_uploaded: number; documents_with_files: number;
  findings_found: number; findings_remedied: number;
  without_department: number; open_findings_now: number; overdue_actions_now: number;
  departments: { name: string; count: number }[];
  finding_statuses: { status: string; count: number }[];
  timeline: { date: string; documents: number; files: number; found: number; remedied: number }[];
};

type Interval = { label: string; documents: number; files: number; found: number; remedied: number };
const number = (value: number) => value.toLocaleString("vi-VN");
const shortDate = (iso: string) => iso && iso.length >= 10 ? `${iso.slice(8,10)}/${iso.slice(5,7)}` : iso;

function aggregatePeriods(rows: HomeSummary["timeline"]): Interval[] {
  if (!rows.length) return [];
  // For longer ranges, show a readable number of time buckets, preserving every total.
  const chunk = rows.length <= 14 ? 1 : Math.ceil(rows.length / 12);
  const periods: Interval[] = [];
  for (let i = 0; i < rows.length; i += chunk) {
    const portion = rows.slice(i, i + chunk);
    periods.push({
      label: chunk === 1 ? shortDate(portion[0].date)
        : `${shortDate(portion[0].date)}–${shortDate(portion[portion.length-1].date)}`,
      documents: portion.reduce((total, row) => total + row.documents, 0),
      files: portion.reduce((total, row) => total + row.files, 0),
      found: portion.reduce((total, row) => total + row.found, 0),
      remedied: portion.reduce((total, row) => total + row.remedied, 0),
    });
  }
  return periods;
}

function ActivityChart({rows,kind}: {rows:Interval[];kind:"documents"|"findings"}) {
  const documents = kind === "documents";
  const keys = documents ? ["documents","files"] as const : ["found","remedied"] as const;
  const max = Math.max(1, ...rows.flatMap(row => keys.map(key => row[key])));
  const empty = rows.every(row => keys.every(key => row[key] === 0));
  const names = documents ? ["Hồ sơ đăng ký","Tệp tải lên"] : ["Phát hiện","Khắc phục"];
  return <div className="home-trend-graph" role="img"
      aria-label={documents ? "Xu hướng đăng ký hồ sơ và tải tệp thực tế" : "Xu hướng phát hiện và khắc phục finding"}>
    <div className="home-trend-bars">
      {rows.map((entry, index) => <div className="home-trend-slot" key={`${entry.label}-${index}`}>
        <div className="home-trend-pair">
          {keys.map((key, j) => <span key={key} className={`home-trend-bar home-trend-bar-${j}`}
            style={{height: entry[key] > 0 ? `${Math.max(3,100*entry[key]/max)}%` : "0%"}}
            title={`${entry.label} · ${names[j]}: ${number(entry[key])}`} />)}
        </div>
        <span className="home-trend-day">{entry.label}</span>
      </div>)}
    </div>
    <div className="home-trend-legend">
      {names.map((label, index) => <span key={label}><i className={`home-trend-key ${index===0?"primary":"secondary"}`}/>{label}</span>)}
    </div>
    {empty && <p className="home-trend-empty">Không ghi nhận hoạt động trong kỳ này.</p>}
  </div>;
}

export default function HomeReport({summary,from,to,error}:{
  summary:HomeSummary|null;from:string;to:string;error?:string;
}) {
  const periods = aggregatePeriods(summary?.timeline || []);
  const departments = summary?.departments || [];
  const top = departments.slice(0, 5);
  const remaining = departments.slice(5).reduce((sum, row) => sum + row.count, 0);
  const maxDepartment = Math.max(1, ...top.map(row => row.count));
  const shareOfTop = summary?.new_documents
    ? Math.round(100 * top.slice(0, 3).reduce((sum, row) => sum + row.count, 0) / summary.new_documents)
    : null;

  return <section className="home-insights" aria-labelledby="home-report-heading">
    <div className="executive-section-heading">
      <div>
        <p className="section-kicker">02 / HOẠT ĐỘNG TÀI LIỆU</p>
        <h2 id="home-report-heading">Biến động tài liệu và nguồn ban hành</h2>
        <p>Phát sinh trong kỳ được chọn · từ {shortDate(from)} đến {shortDate(to)} ({to.slice(0,4)})</p>
      </div>
      <Link className="executive-catalog-note" href="/documents">Mở thư viện tài liệu</Link>
    </div>
    {error || !summary ? <div role="alert" className="home-insight-error">
      Không thể tải báo cáo trong kỳ: {error || "Không có dữ liệu trả về."}
    </div> : <>
      <div className="home-ceo-primary-grid">
        <article className="home-insight-panel">
          <div className="home-panel-head"><h3>Xu hướng ghi nhận tài liệu</h3></div>
          <p>So sánh hồ sơ mới trên danh mục với số tệp thực tế được tải lên.</p>
          <ActivityChart rows={periods} kind="documents"/>
          {summary.new_documents>0 && summary.files_uploaded===0 &&
            <p className="home-ceo-source-note">
              <strong>Lưu ý về dữ liệu:</strong> Hồ sơ mới trong kỳ chưa phát sinh tệp tải lên.
              Số hồ sơ đăng ký không đồng nghĩa với số tài liệu đã upload.
            </p>}
        </article>
        <article className="home-insight-panel">
          <div className="home-panel-head"><h3>Đơn vị ban hành hồ sơ mới</h3>
            <span className="home-ceo-panel-context">Top 5 trong kỳ</span>
          </div>
          <p>{shareOfTop===null
            ? "Không có hồ sơ phát sinh trong kỳ."
            : `3 đơn vị đứng đầu chiếm ${shareOfTop}% hồ sơ mới ghi nhận.`}</p>
          {top.length>0 ? <div className="home-department-list">
            {top.map((row,index)=><div className="home-department-item" key={`${row.name}-${index}`}>
              <div className="home-department-heading">
                <span title={row.name}>{row.name}</span><strong>{number(row.count)}</strong>
              </div>
              <div className="home-department-track">
                <span style={{width:`${100*row.count/maxDepartment}%`}}/>
              </div>
            </div>)}
            {remaining>0&&<div className="home-department-others">
              Các đơn vị khác: <strong>{number(remaining)}</strong> hồ sơ
            </div>}
          </div> : <div className="home-empty">Chưa có hồ sơ mới trong kỳ.</div>}
          {summary.without_department>0 && <p className="home-ceo-department-caveat">
            {number(summary.without_department)} hồ sơ chưa có đơn vị ban hành.
          </p>}
        </article>
      </div>
      <div className="executive-section-heading home-ceo-finding-heading">
        <div>
          <p className="section-kicker">03 / THEO DÕI FINDING</p>
          <h2>Phát hiện và kết quả khắc phục</h2>
          <p>Chỉ báo thay đổi trong kỳ; chi tiết finding và action xem tại Tab 06.</p>
        </div>
        <Link className="executive-catalog-note" href="/findings">Xem chi tiết Finding & Action</Link>
      </div>
      <article className="home-insight-panel home-ceo-finding-panel">
        <ActivityChart rows={periods} kind="findings"/>
        <p className="home-ceo-finding-caption">
          Tồn đọng hiện tại: <strong>{number(summary.open_findings_now)}</strong> finding
          <span className="home-ceo-caption-divider">·</span>
          Hành động quá hạn: <strong>{number(summary.overdue_actions_now)}</strong>.
          <span className="home-ceo-period-note">Đây là số dư hiện tại, không phải số phát hiện trong kỳ.</span>
        </p>
      </article>
      <p className="home-report-footnote">
        Nguồn: hồ sơ tài liệu, tệp tải lên và finding có quyền truy cập. Hồ sơ mới tính theo ngày tạo metadata;
        tệp tải lên theo thời điểm lưu tệp; finding phát hiện/khắc phục theo ngày tương ứng.
        Số tồn đọng là trạng thái hiện tại. Không suy diễn tỷ lệ tuân thủ hoặc mức độ hoàn thiện quy trình từ các số liệu này.
      </p>
    </>}
  </section>;
}
