import { requireActiveAccount } from "@/lib/auth";
import ProcessMapClient, { type ProcessMapNode } from "./process-map-client";

export default async function ProcessMapPage() {
  const { supabase, profile } = await requireActiveAccount();
  const { data, error } = await supabase
    .from("processes")
    .select("id,process_code,parent_process_id,level_type,display_order,process_versions(id,version_number,status,name_vi,purpose,description,process_at_a_glance,process_assignments(assignment_role,profiles(display_name)),process_apqc_mappings(id))")
    .is("archived_at", null)
    .order("display_order");

  const nodes: ProcessMapNode[] = ((data || []) as unknown as Array<{
    id: string;
    process_code: string;
    parent_process_id: string | null;
    level_type: string;
    display_order: number;
    process_versions: Array<{
      id: string;
      version_number: number;
      status: string;
      name_vi: string;
      purpose: string;
      description: string;
      process_at_a_glance: string | null;
      process_assignments: Array<{ assignment_role: string; profiles: { display_name: string } | null }>;
      process_apqc_mappings: Array<{ id: string }>;
    }>;
  }>).map((process) => {
    const versions = [...(process.process_versions || [])].sort((a, b) => {
      if (a.status === "effective" && b.status !== "effective") return -1;
      if (b.status === "effective" && a.status !== "effective") return 1;
      return b.version_number - a.version_number;
    });
    const version = versions[0];
    const owner = version?.process_assignments?.find((assignment) => assignment.assignment_role === "owner")?.profiles?.display_name;
    return {
      id: process.id,
      parentId: process.parent_process_id,
      code: process.process_code,
      name: version?.name_vi || process.process_code,
      level: process.level_type,
      status: version?.status || "draft",
      owner: owner || "Chưa phân công",
      summary: version?.process_at_a_glance || version?.purpose || version?.description || "Chưa có mô tả.",
      mappingCount: version?.process_apqc_mappings?.length || 0,
      displayOrder: process.display_order,
    };
  });

  return <ProcessMapClient nodes={nodes} userName={profile.display_name} role={profile.role} errorMessage={error?.message} />;
}
