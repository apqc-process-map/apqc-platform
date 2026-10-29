import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { getCurrentAccount } from "@/lib/auth";

export const instant = false;

export default async function Home() {
  const {supabase,user,profile}=await getCurrentAccount();
  if(!user||!profile) return <WorkspaceShell active="/" eyebrow="APQC PCF 8.0" title="Process Map" description="Không gian quản trị và khám phá quy trình doanh nghiệp."><section className="welcome-panel"><p className="section-kicker">SECURE WORKSPACE</p><h2>Đăng nhập để bắt đầu</h2><p>Catalog, documents, relationships và governance được bảo vệ bằng Supabase Auth và Row Level Security.</p><Link className="primary-button welcome-action" href="/login">Đăng nhập →</Link></section></WorkspaceShell>;

  const [elements,metrics,processes,documents,findings,reviews,notifications,ownedDrafts,assignedFindings]=await Promise.all([
    supabase.from("apqc_elements").select("id,apqc_frameworks!inner(is_active)",{count:"exact",head:true}).eq("apqc_frameworks.is_active",true),
    supabase.from("apqc_metrics").select("id,apqc_frameworks!inner(is_active)",{count:"exact",head:true}).eq("apqc_frameworks.is_active",true),
    supabase.from("processes").select("id",{count:"exact",head:true}),
    supabase.from("documents").select("id",{count:"exact",head:true}).is("archived_at",null),
    supabase.from("findings").select("id",{count:"exact",head:true}).not("status","in","(resolved,closed)"),
    supabase.from("review_requests").select("id",{count:"exact",head:true}).eq("status","open"),
    supabase.from("notifications").select("id",{count:"exact",head:true}).is("read_at",null),
    supabase.from("process_versions").select("id",{count:"exact",head:true}).eq("created_by",profile.id).in("status",["draft","rejected"]),
    supabase.from("findings").select("id",{count:"exact",head:true}).eq("assignee_id",profile.id).not("status","in","(resolved,closed)"),
  ]);
  const isAdmin=profile.role==="admin";
  const isEditor=profile.role==="editor";
  const workspaceLabel=isAdmin?"ADMIN CONTROL CENTER":isEditor?"EDITOR WORKSPACE":"VIEWER HOME";
  const description=isAdmin?"Theo dõi reference data, governance và các hàng đợi cần xử lý.":isEditor?"Tiếp tục bản nháp, finding được giao và các action cần xử lý.":"Khám phá nội dung đã xuất bản và Action Log dành cho bạn.";
  return <WorkspaceShell active="/" eyebrow={workspaceLabel} title={`Xin chào, ${profile.display_name}.`} description={description} userName={profile.display_name} role={profile.role}>
    <div className="governance-grid">
      <Link href="/catalog?type=apqc"><span>APQC elements</span><strong>{elements.count?.toLocaleString("vi-VN")||0}</strong><small>{metrics.count?.toLocaleString("vi-VN")||0} metrics</small></Link>
      <Link href="/process-map"><span>Enterprise processes</span><strong>{processes.count||0}</strong><small>Process repository</small></Link>
      <Link href="/documents"><span>Documents</span><strong>{documents.count||0}</strong><small>Private library</small></Link>
      <Link href={isAdmin?"/governance":isEditor?"/findings?assigned=me":"/notifications"}><span>{isAdmin?"Open reviews":isEditor?"My assigned findings":"Unread actions"}</span><strong>{isAdmin?reviews.count||0:isEditor?assignedFindings.count||0:notifications.count||0}</strong><small>{findings.count||0} open findings</small></Link>
    </div>
    {isEditor ? <section className="editor-home-queue"><div><p className="section-kicker">MY WORK</p><h2>Công việc đang xử lý</h2><p>Bản nháp do bạn tạo và finding được giao được tổng hợp theo quyền RLS hiện tại.</p></div><div><Link href="/catalog?type=enterprise&status=draft"><strong>{ownedDrafts.count||0}</strong><span>Bản nháp của tôi</span></Link><Link href="/findings?assigned=me"><strong>{assignedFindings.count||0}</strong><span>Finding được giao</span></Link><Link href="/notifications"><strong>{notifications.count||0}</strong><span>Action chưa đọc</span></Link></div></section> : null}
    <section className="home-actions"><div><p className="section-kicker">QUICK ACCESS</p><h2>{isAdmin?"Governance workspace":isEditor?"Authoring workspace":"Knowledge workspace"}</h2><p>{isAdmin?"APQC baseline đã sẵn sàng. Tiếp tục review publication gates và findings.":isEditor?"Quản lý draft, documents, relationships và findings trong phạm vi được giao.":"Duyệt Process Map, Catalog và Documents theo quyền Viewer."}</p></div><div><Link href="/catalog">Mở Catalog</Link><Link href="/findings">Xem Findings</Link>{isEditor&&<Link href="/documents">Documents</Link>}{isAdmin&&<Link href="/governance">Governance</Link>}</div></section>
  </WorkspaceShell>;
}
