import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import HomeReport, { type HomeSummary } from "@/components/home-report";
import { getCurrentAccount } from "@/lib/auth";

export const instant = false;

type HomePeriod="7d"|"30d"|"90d"|"custom";
const DAY=86_400_000;
const vietnamDay=()=>Math.floor((Date.now()+7*60*60*1000)/DAY);
const isoFromDay=(day:number)=>new Date(day*DAY).toISOString().slice(0,10);
const parseIsoDay=(value:string|undefined)=>{
  if(!value||!/^\d{4}-\d{2}-\d{2}$/.test(value))return null;
  const t=Date.parse(value+"T00:00:00Z");
  if(!Number.isFinite(t)||isoFromDay(Math.floor(t/DAY))!==value)return null;
  return Math.floor(t/DAY);
};
export default async function Home({searchParams}:{searchParams:Promise<{period?:string;from?:string;to?:string}>}) {
  const {supabase,user,profile}=await getCurrentAccount();
  if(!user||!profile) return <WorkspaceShell active="/" eyebrow="APQC PCF 8.0" title="Process Map" description="Không gian quản trị và khám phá quy trình doanh nghiệp."><section className="welcome-panel"><p className="section-kicker">SECURE WORKSPACE</p><h2>Đăng nhập để bắt đầu</h2><p>Catalog, documents, relationships và governance được bảo vệ bằng Supabase Auth và Row Level Security.</p><Link className="primary-button welcome-action" href="/login">Đăng nhập →</Link></section></WorkspaceShell>;

  const params=await searchParams;
  const day=vietnamDay(),today=isoFromDay(day);
  let period:HomePeriod=params.period==="30d"||params.period==="90d"||params.period==="custom"?params.period:"7d";
  let fromDay=day-(period==="30d"?29:period==="90d"?89:6);
  let toDay=day;
  let warning="";
  if(period==="custom"){
    const start=parseIsoDay(params.from),end=parseIsoDay(params.to);
    if(start!==null&&end!==null&&start<=end&&end<=day&&(end-start)<=365){
      fromDay=start;toDay=end;
    }else{
      period="7d";fromDay=day-6;toDay=day;
      warning="Khoảng ngày tùy chọn không hợp lệ (tối đa 366 ngày, không vượt ngày hôm nay). Đã trở về 7 ngày gần nhất.";
    }
  }
  const from=isoFromDay(fromDay),to=isoFromDay(toDay);
  const [elements,metrics,processes,documents,findings,reviews,notifications,ownedDrafts,assignedFindings,report]=await Promise.all([
    supabase.from("apqc_elements").select("id",{count:"exact",head:true}),
    supabase.from("apqc_metrics").select("id",{count:"exact",head:true}),
    supabase.from("processes").select("id",{count:"exact",head:true}),
    supabase.from("documents").select("id",{count:"exact",head:true}),
    supabase.from("findings").select("id",{count:"exact",head:true}).not("status","in","(resolved,closed)"),
    supabase.from("review_requests").select("id",{count:"exact",head:true}).eq("status","open"),
    supabase.from("notifications").select("id",{count:"exact",head:true}).is("read_at",null),
    supabase.from("process_versions").select("id",{count:"exact",head:true}).eq("created_by",profile.id).in("status",["draft","rejected"]),
    supabase.from("findings").select("id",{count:"exact",head:true}).eq("assignee_id",profile.id).not("status","in","(resolved,closed)"),
    supabase.rpc("home_document_finding_summary",{p_from_date:from,p_to_date:to}),
  ]);
  const isAdmin=profile.role==="admin";
  const isEditor=profile.role==="editor";
  const workspaceLabel=isAdmin?"ADMIN CONTROL CENTER":isEditor?"EDITOR WORKSPACE":"VIEWER HOME";
  const description=isAdmin?"Theo dõi reference data, governance và các hàng đợi cần xử lý.":isEditor?"Tiếp tục bản nháp, finding được giao và các action cần xử lý.":"Khám phá nội dung đã xuất bản và Action Log dành cho bạn.";
  return <WorkspaceShell active="/" eyebrow={workspaceLabel} title="Tổng quan" description={description} userName={profile.display_name} role={profile.role}>
    {warning&&<div className="home-insight-error" role="alert">{warning}</div>}
    <HomeReport summary={report.error?null:report.data as HomeSummary|null} period={period} from={from} to={to} today={today} error={report.error?.message}/>    
    <section className="home-reference">
      <div className="home-reference-heading"><div><p className="section-kicker">DỮ LIỆU NỀN & CÔNG VIỆC</p><h2>Quy mô kho dữ liệu hiện tại</h2></div><span>Chỉ số tích lũy · không phụ thuộc bộ lọc thời gian</span></div>
    <div className="governance-grid">
      <Link href="/catalog?type=apqc"><span>Quy trình tham chiếu APQC</span><strong>{elements.count?.toLocaleString("vi-VN")||0}</strong><small>{metrics.count?.toLocaleString("vi-VN")||0} chỉ số</small></Link>
      <Link href="/process-map"><span>Quy trình doanh nghiệp</span><strong>{processes.count||0}</strong><small>Kho quy trình</small></Link>
      <Link href="/documents"><span>Tổng hồ sơ tài liệu</span><strong>{documents.count||0}</strong><small>Kho tài liệu theo quyền</small></Link>
      <Link href={isAdmin?"/governance":isEditor?"/findings?assigned=me":"/notifications"}><span>{isAdmin?"Yêu cầu chờ duyệt":isEditor?"Finding được giao":"Thông báo chưa đọc"}</span><strong>{isAdmin?reviews.count||0:isEditor?assignedFindings.count||0:notifications.count||0}</strong><small>{findings.count||0} finding đang mở</small></Link>
    </div></section>
    {isEditor ? <section className="editor-home-queue"><div><p className="section-kicker">CÔNG VIỆC CỦA TÔI</p><h2>Công việc đang xử lý</h2><p>Bản nháp do bạn tạo và finding được giao được tổng hợp theo quyền RLS hiện tại.</p></div><div><Link href="/catalog?type=enterprise&status=draft"><strong>{ownedDrafts.count||0}</strong><span>Bản nháp của tôi</span></Link><Link href="/findings?assigned=me"><strong>{assignedFindings.count||0}</strong><span>Finding được giao</span></Link><Link href="/notifications"><strong>{notifications.count||0}</strong><span>Action chưa đọc</span></Link></div></section> : null}
    <section className="home-actions"><div><p className="section-kicker">TRUY CẬP NHANH</p><h2>{isAdmin?"Quản trị tài liệu & quy trình":isEditor?"Biên tập & xử lý":"Tra cứu tri thức"}</h2><p>{isAdmin?"APQC baseline đã sẵn sàng. Tiếp tục review publication gates và findings.":isEditor?"Quản lý draft, documents, relationships và findings trong phạm vi được giao.":"Duyệt Process Map, Catalog và Documents theo quyền Viewer."}</p></div><div><Link href="/catalog">Mở Catalog</Link><Link href="/findings">Xem Findings</Link>{isEditor&&<Link href="/documents">Documents</Link>}{isAdmin&&<Link href="/governance">Governance</Link>}</div></section>
  </WorkspaceShell>;
}
