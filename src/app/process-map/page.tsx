import { requireActiveAccount } from "@/lib/auth";
import ProcessMapClient, { type ProcessMapNode, type ProcessMapTag } from "./process-map-client";

type VersionRow = {
  id: string;
  version_number: number;
  status: string;
  name_vi: string;
  purpose: string;
  description: string;
  process_at_a_glance: string | null;
  business_purpose: string | null;
  scope_and_boundaries: string | null;
  critical_decision_points: string | null;
  accountability_and_impact: string | null;
  access_level: string;
  review_due_at: string | null;
  process_assignments: Array<{ assignment_role: string; profiles: { display_name: string } | null }>;
  process_apqc_mappings: Array<{ id: string }>;
};

type ProcessRow = {
  id: string;
  process_code: string;
  parent_process_id: string | null;
  level_type: string;
  display_order: number;
  process_versions: VersionRow[];
};

type TagRow = { object_id: string; governance_tags: ProcessMapTag | ProcessMapTag[] | null };
type ApplicabilityRow = {
  object_id: string;
  dimension: string;
  free_text: string | null;
  vocabulary_values: { label_vi: string; label_en: string | null } | { label_vi: string; label_en: string | null }[] | null;
  systems: { name: string; code: string } | { name: string; code: string }[] | null;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] || null : value;
}

export default async function ProcessMapPage() {
  const { supabase, profile } = await requireActiveAccount();
  const { data, error } = await supabase
    .from("processes")
    .select("id,process_code,parent_process_id,level_type,display_order,process_versions(id,version_number,status,name_vi,purpose,description,process_at_a_glance,business_purpose,scope_and_boundaries,critical_decision_points,accountability_and_impact,access_level,review_due_at,process_assignments(assignment_role,profiles(display_name)),process_apqc_mappings(id))")
    .is("archived_at", null)
    .order("display_order");

  const processes = (data || []) as unknown as ProcessRow[];
  const versionIds = processes.flatMap((process) => process.process_versions || []).map((version) => version.id);
  const [tagResult, applicabilityResult] = versionIds.length ? await Promise.all([
    supabase.from("object_tags").select("object_id,governance_tags(code,label_vi,color)").eq("object_type", "process_version").in("object_id", versionIds),
    supabase.from("object_applicability").select("object_id,dimension,free_text,vocabulary_values(label_vi,label_en),systems(name,code)").eq("object_type", "process_version").in("object_id", versionIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }];

  const tagsByVersion = new Map<string, ProcessMapTag[]>();
  for (const row of (tagResult.data || []) as unknown as TagRow[]) {
    const tag = firstRelation(row.governance_tags);
    if (!tag) continue;
    tagsByVersion.set(row.object_id, [...(tagsByVersion.get(row.object_id) || []), { code: tag.code, label: tag.label_vi, color: tag.color }]);
  }

  const applicabilityByVersion = new Map<string, string[]>();
  const systemsByVersion = new Map<string, string[]>();
  for (const row of (applicabilityResult.data || []) as unknown as ApplicabilityRow[]) {
    const value = firstRelation(row.vocabulary_values);
    const system = firstRelation(row.systems);
    const label = value?.label_vi || system?.name || row.free_text || row.dimension;
    applicabilityByVersion.set(row.object_id, [...(applicabilityByVersion.get(row.object_id) || []), label]);
    if (system) systemsByVersion.set(row.object_id, [...(systemsByVersion.get(row.object_id) || []), system.name]);
  }

  const nodes: ProcessMapNode[] = processes.map((process) => {
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
      businessPurpose: version?.business_purpose || version?.purpose || "Chưa có mục đích kinh doanh.",
      scopeAndBoundaries: version?.scope_and_boundaries || "Chưa mô tả phạm vi.",
      criticalDecisionPoints: version?.critical_decision_points || "Chưa mô tả điểm quyết định.",
      accountabilityAndImpact: version?.accountability_and_impact || "Chưa mô tả trách nhiệm và tác động.",
      accessLevel: version?.access_level || "internal",
      reviewDueAt: version?.review_due_at,
      tags: version ? tagsByVersion.get(version.id) || [] : [],
      applicability: version ? applicabilityByVersion.get(version.id) || [] : [],
      systems: version ? systemsByVersion.get(version.id) || [] : [],
    };
  });

  const supplementalError = tagResult.error?.message || applicabilityResult.error?.message;
  return <ProcessMapClient nodes={nodes} userName={profile.display_name} role={profile.role} errorMessage={error?.message || supplementalError} />;
}
