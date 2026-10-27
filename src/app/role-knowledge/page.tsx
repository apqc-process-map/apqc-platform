import { noteSlowPage } from "@/lib/page-perf";
import Form from "next/form";
import Link from "next/link";
import WorkspaceShell from "@/components/workspace-shell";
import { requireActiveAccount } from "@/lib/auth";

type RoleRow = { id: string; code: string; name: string; description: string | null };
type TypeRow = { id: string; code: string };
type RelationRow = { id: string; target_id: string; relationship_type_id: string; description: string | null; status: string };
type VersionRow = { id: string; title_vi: string; document_abstract: string | null; status: string; version_number: number };
type DocumentRow = { id: string; document_code: string; document_versions: VersionRow[] | null };

export default async function RoleKnowledgePage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role = "" } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  // Safe, post-response timing with no user or document identifiers.
  noteSlowPage("/role-knowledge");
  const [roleResult, typeResult, documentResult, relationshipResult] = await Promise.all([
    supabase.from("business_roles").select("id,code,name,description").eq("is_active", true).order("name"),
    supabase.from("relationship_types").select("id,code").in("code", ["role_must_know_document", "role_should_know_document", "role_not_applicable_document"]),
    supabase.from("documents").select("id,document_code,document_versions(id,title_vi,document_abstract,status,version_number)").is("archived_at", null),
    // Role-document links are limited to a small taxonomy; query alongside roles.
    supabase.from("object_relationships").select("id,source_id,target_id,relationship_type_id,description,status")
      .eq("source_type","business_role").eq("target_type","document").eq("status","verified").limit(300),
  ]);
  const roles = (roleResult.data || []) as RoleRow[];
  const selectedRole = roles.find((item) => item.id === role) || roles[0];
  const result = { data: (relationshipResult.data || []).filter(item => item.source_id === selectedRole?.id), error: relationshipResult.error };
  const types = new Map(((typeResult.data || []) as TypeRow[]).map((item) => [item.id, item.code]));
  const documents = new Map(((documentResult.data || []) as unknown as DocumentRow[]).map((document) => {
    const latest = [...(document.document_versions || [])].sort((a, b) => b.version_number - a.version_number)[0];
    return [document.id, { ...document, latest }];
  }));
  const items = ((result.data || []) as RelationRow[]).map((relation) => ({ relation, document: documents.get(relation.target_id), kind: types.get(relation.relationship_type_id) })).filter((item) => item.kind);
  const must = items.filter((item) => item.kind === "role_must_know_document");
  const should = items.filter((item) => item.kind === "role_should_know_document");
  const notApplicable = items.filter((item) => item.kind === "role_not_applicable_document");
  const loadError = roleResult.error || typeResult.error || documentResult.error || result.error;

  const bucket = (title: string, description: string, rows: typeof items, tone: string) => <section className={"knowledge-bucket " + tone}>
    <div className="knowledge-bucket-heading"><div><h2>{title}</h2><p>{description}</p></div><span>{rows.length}</span></div>
    {rows.length ? <div className="knowledge-document-list">{rows.map(({ relation, document }) => {
      if (!document?.latest) {
        return <article key={relation.id} className="knowledge-document-restricted"><div><span className="mono-code">TÀI LIỆU GIỚI HẠN</span><h3>Chưa có quyền xem metadata tài liệu</h3><p>Quan hệ kiến thức của chức danh đã tồn tại, nhưng RLS hoặc quyền tài liệu chưa cho phép tài khoản hiện tại xem chi tiết.</p><small>Liên hệ quản trị viên để đối soát quyền truy cập.</small></div><span className="knowledge-restriction-badge">Bị giới hạn</span></article>;
      }
      const latest = document.latest;
      return <article key={relation.id}><div><span className="mono-code">{document.document_code} · v{latest.version_number}</span><h3>{latest.title_vi}</h3><p>{relation.description || latest.document_abstract || "Chưa có diễn giải."}</p><small>Trạng thái: {latest.status}</small></div><Link className="text-button" href={"/documents?search=" + encodeURIComponent(document.document_code)}>Mở tài liệu</Link></article>;
    })}</div> : <div className="knowledge-empty">Chưa có tài liệu được gán cho nhóm này.</div>}
  </section>;

  return <WorkspaceShell active="/role-knowledge" eyebrow="KNOWLEDGE VIEW" title="Vai trò của tôi" description="Xem tài liệu cần biết, nên tham khảo và không áp dụng theo từng chức danh." userName={profile.display_name} role={profile.role}>
    <Form action="/role-knowledge" scroll={false} className="role-knowledge-filter"><label>Chức danh<select name="role" defaultValue={selectedRole?.id || ""}>{roles.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button type="submit">Xem vai trò</button></Form>
    {loadError ? <div className="state-message error-state"><strong>Không thể tải knowledge profile</strong><span>{loadError.message}</span></div> : selectedRole ? <>
      <section className="role-profile-summary"><div><span className="section-kicker">ROLE KNOWLEDGE PROFILE</span><h2>{selectedRole.name}</h2><p>{selectedRole.description || "Chưa có mô tả vai trò."}</p></div><div className="role-profile-counts"><span><b>{must.length}</b>Bắt buộc</span><span><b>{should.length}</b>Nên biết</span><span><b>{notApplicable.length}</b>Không áp dụng</span></div></section>
      <div className="knowledge-grid">{bucket("Bắt buộc phải biết", "Tài liệu cốt lõi phục vụ trách nhiệm của chức danh.", must, "must")}{bucket("Nên biết / tham chiếu", "Tài liệu hỗ trợ, dùng khi nghiệp vụ phát sinh.", should, "should")}{bucket("Không áp dụng", "Tài liệu đã được đánh giá là không thuộc phạm vi cần biết của chức danh. Không đồng nghĩa với hạn chế quyền truy cập.", notApplicable, "none")}</div>
      <div className="knowledge-security-note"><strong>Phạm vi kiến thức không phải quyền truy cập.</strong><span>Số lượng gồm mọi tài liệu đã gán cho chức danh; chi tiết chỉ hiển thị khi RLS và quyền Storage cho phép.</span></div>
    </> : <div className="knowledge-empty">Chưa có chức danh hoạt động.</div>}
  </WorkspaceShell>;
}
