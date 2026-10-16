import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { getCurrentAccount } from "@/lib/auth";
export const instant = false;

export default async function Home() {
  const {supabase,user,profile}=await getCurrentAccount();
  if(!user||!profile) return <WorkspaceShell active="/" eyebrow="APQC PCF 8.0" title="Process Map" description="Không gian quản trị và khám phá quy trình doanh nghiệp."><section className="welcome-panel"><p className="section-kicker">SECURE WORKSPACE</p><h2>Đăng nhập để bắt đầu</h2><p>Catalog, documents, relationships và governance được bảo vệ bằng Supabase Auth và Row Level Security.</p><Link className="primary-button welcome-action" href="/login">Đăng nhập →</Link></section></WorkspaceShell>;

  const [elements,metrics,processes,documents,findings,reviews,notifications]=await Promise.all([
    supabase.from("apqc_elements").select("*",{count:"exact",head:true}),
    supabase.from("apqc_metrics").select("*",{count:"exact",head:true}),
    supabase.from("processes").select("*",{count:"exact",head:true}),
    supabase.from("documents").select("*",{count:"exact",head:true}),
    supabase.from("findings").select("*",{count:"exact",head:true}).not("status","in","(resolved,closed)"),
    supabase.from("review_requests").select("*",{count:"exact",head:true}).eq("status","open"),
    supabase.from("notifications").select("*",{count:"exact",head:true}).is("read_at",null),
  ]);
  const isAdmin=profile.role==="admin";
  return <WorkspaceShell active="/" eyebrow={isAdmin?"ADMIN CONTROL CENTER":"VIEWER HOME"} title={`Xin chào, ${profile.display_name}.`} description={isAdmin?"Theo dõi reference data, governance và các hàng đợi cần xử lý.":"Khám phá nội dung đã xuất bản và các thông báo dành cho bạn."} userName={profile.display_name} role={profile.role}>
    <div className="governance-grid"><article><span>APQC elements</span><strong>{elements.count?.toLocaleString("vi-VN")||0}</strong><small>{metrics.count?.toLocaleString("vi-VN")||0} metrics</small></article><article><span>Enterprise processes</span><strong>{processes.count||0}</strong><small>Process repository</small></article><article><span>Documents</span><strong>{documents.count||0}</strong><small>Private library</small></article><article><span>{isAdmin?"Open reviews":"Unread notifications"}</span><strong>{isAdmin?reviews.count||0:notifications.count||0}</strong><small>{findings.count||0} open findings</small></article></div>
    <section className="home-actions"><div><p className="section-kicker">QUICK ACCESS</p><h2>{isAdmin?"Governance workspace":"Knowledge workspace"}</h2><p>{isAdmin?"APQC baseline đã sẵn sàng. Tiếp tục review publication gates và findings.":"Duyệt Process Map, Catalog và Documents theo quyền Viewer."}</p></div><div><Link href="/catalog">Mở Catalog</Link><Link href="/findings">Xem Findings</Link>{isAdmin&&<Link href="/governance">Governance</Link>}</div></section>
  </WorkspaceShell>;
}
