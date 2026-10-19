import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

export default async function ApqcDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile } = await requireActiveAccount();
  const { data: element, error } = await supabase.from("apqc_elements").select("id,pcf_id,hierarchy_id,level_number,name,description,parent_id,framework_id").eq("id", id).maybeSingle();
  if (error || !element) return <WorkspaceShell active="/catalog" eyebrow="APQC REFERENCE" title="Không tìm thấy APQC element" description="Bản ghi tham chiếu không tồn tại hoặc bạn không có quyền xem." userName={profile.display_name} role={profile.role}><Link className="text-button" href="/catalog?type=apqc">← Quay lại Catalog</Link></WorkspaceShell>;
  const [{ data: parent }, { data: metrics }] = await Promise.all([
    element.parent_id ? supabase.from("apqc_elements").select("id,pcf_id,name").eq("id", element.parent_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from("apqc_metrics").select("id,metric_code,name,definition").eq("framework_id", element.framework_id).eq("pcf_id", element.pcf_id).order("metric_code")
  ]);
  return <WorkspaceShell active="/catalog" eyebrow="APQC REFERENCE" title={element.name} description="Chi tiết APQC PCF v8.0 và các metric liên quan." userName={profile.display_name} role={profile.role}>
    <Link className="text-button" href="/catalog?type=apqc">← Quay lại Catalog</Link>
    <section className="reference-detail-panel"><div className="reference-detail-head"><div><span className="mono-code">{element.pcf_id}</span><h2>{element.name}</h2><p>{element.description || "Chưa có mô tả trong nguồn APQC."}</p></div><span className="status-badge">Level {element.level_number}</span></div>
      <dl className="reference-meta"><div><dt>Hierarchy ID</dt><dd>{element.hierarchy_id}</dd></div><div><dt>Parent</dt><dd>{parent ? <Link href={`/catalog/apqc/${parent.id}`}>{parent.pcf_id} · {parent.name}</Link> : "Root"}</dd></div><div><dt>Metrics</dt><dd>{metrics?.length || 0}</dd></div></dl>
    </section>
    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">REFERENCE METRICS</p><h2>{metrics?.length || 0} metrics</h2></div></div>{metrics?.length ? <div className="metric-list">{metrics.map((metric) => <article key={metric.id}><span className="mono-code">{metric.metric_code || "Metric"}</span><h3>{metric.name}</h3><p>{metric.definition || "Chưa có định nghĩa."}</p></article>)}</div> : <div className="state-message"><strong>Chưa có metric</strong><span>Element này chưa có metric được import.</span></div>}</section>
  </WorkspaceShell>;
}