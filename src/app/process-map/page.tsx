import { requireActiveAccount } from "@/lib/auth";
import ProcessMapClient, {
  type ProcessMapApqcMapping,
  type ProcessMapApplicability,
  type ProcessMapNode,
  type ProcessMapTag,
} from "./process-map-client";

type VersionRow = {
  id: string;
  version_number: number;
  status: string;
  name_vi: string;
  name_en: string | null;
  purpose: string;
  description: string;
  scope_in: string;
  scope_out: string;
  trigger: string;
  outcome: string;
  process_at_a_glance: string | null;
  business_purpose: string | null;
  scope_and_boundaries: string | null;
  critical_decision_points: string | null;
  accountability_and_impact: string | null;
  access_level: string;
  allowed_roles: string[];
  valid_from: string | null;
  valid_until: string | null;
  review_due_at: string | null;
  change_summary: string;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  submitted_by: string | null;
  approved_by: string | null;
  published_by: string | null;
  created_profile: ProfileRelation;
  updated_profile: ProfileRelation;
  submitted_profile: ProfileRelation;
  approved_profile: ProfileRelation;
  published_profile: ProfileRelation;
  superseded_version: { version_number: number } | Array<{ version_number: number }> | null;
  process_assignments: Array<{ assignment_role: string; profile_id: string; profiles: ProfileRelation }>;
  process_apqc_mappings: MappingRow[];
};

type ProfileRow = { display_name: string };
type ProfileRelation = ProfileRow | ProfileRow[] | null;
type MappingRow = {
  id: string;
  mapping_role: string;
  match_type: string;
  status: string;
  rationale: string;
  apqc_elements: { pcf_id: string; name: string } | Array<{ pcf_id: string; name: string }> | null;
};

type ProcessRow = {
  id: string;
  process_code: string;
  source_code: string | null;
  parent_process_id: string | null;
  level_type: string;
  display_order: number;
  process_versions: VersionRow[];
};

type RawTag = { code: string; label_vi: string; color: string };
type TagRow = { object_id: string; governance_tags: RawTag | RawTag[] | null };
type ApplicabilityRow = {
  object_id: string;
  dimension: string;
  free_text: string | null;
  vocabulary_values: { label_vi: string; label_en: string | null } | { label_vi: string; label_en: string | null }[] | null;
  systems: { name: string; code: string } | { name: string; code: string }[] | null;
  is_inherited: boolean;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] || null : value;
}

function actorDisplayName(profile: ProfileRelation, id: string | null | undefined) {
  const visibleProfile = firstRelation(profile);
  return visibleProfile?.display_name || (id ? "ID " + id.slice(0, 8) + "..." : "");
}

type PageProps = { searchParams: Promise<{ version?: string | string[] }> };

export default async function ProcessMapPage({ searchParams }: PageProps) {
  const requestedVersion = (await searchParams).version;
  const requestedVersionId = typeof requestedVersion === "string" ? requestedVersion : "";
  const { supabase, profile } = await requireActiveAccount();
  const { data, error } = await supabase
    .from("processes")
    .select("id,process_code,source_code,parent_process_id,level_type,display_order,process_versions(id,version_number,status,name_vi,name_en,purpose,description,scope_in,scope_out,trigger,outcome,process_at_a_glance,business_purpose,scope_and_boundaries,critical_decision_points,accountability_and_impact,access_level,allowed_roles,valid_from,valid_until,review_due_at,change_summary,created_at,updated_at,submitted_at,approved_at,published_at,created_by,updated_by,submitted_by,approved_by,published_by,created_profile:profiles!process_versions_created_by_fkey(display_name),updated_profile:profiles!process_versions_updated_by_fkey(display_name),submitted_profile:profiles!process_versions_submitted_by_fkey(display_name),approved_profile:profiles!process_versions_approved_by_fkey(display_name),published_profile:profiles!process_versions_published_by_fkey(display_name),superseded_version:process_versions!process_versions_supersedes_version_id_fkey(version_number),process_assignments(assignment_role,profile_id,profiles(display_name)),process_apqc_mappings(id,mapping_role,match_type,status,rationale,apqc_elements(pcf_id,name))))")
    .is("archived_at", null)
    .order("display_order");

  const processes = (data || []) as unknown as ProcessRow[];
  const versionIds = processes.flatMap((process) => process.process_versions || []).map((version) => version.id);
  const [tagResult, applicabilityResult] = versionIds.length ? await Promise.all([
    supabase.from("object_tags").select("object_id,governance_tags(code,label_vi,color)").eq("object_type", "process_version").in("object_id", versionIds),
    supabase.from("object_applicability").select("object_id,dimension,free_text,is_inherited,vocabulary_values(label_vi,label_en),systems(name,code)").eq("object_type", "process_version").in("object_id", versionIds),
  ]) : [{ data: [], error: null }, { data: [], error: null }];

  const tagsByVersion = new Map<string, ProcessMapTag[]>();
  for (const row of (tagResult.data || []) as unknown as TagRow[]) {
    const tag = firstRelation(row.governance_tags);
    if (!tag) continue;
    tagsByVersion.set(row.object_id, [...(tagsByVersion.get(row.object_id) || []), { code: tag.code, label: tag.label_vi, color: tag.color }]);
  }

  const applicabilityByVersion = new Map<string, ProcessMapApplicability[]>();
  const systemsByVersion = new Map<string, string[]>();
  for (const row of (applicabilityResult.data || []) as unknown as ApplicabilityRow[]) {
    const value = firstRelation(row.vocabulary_values);
    const system = firstRelation(row.systems);
    const label = value?.label_vi || system?.name || row.free_text || row.dimension;
    applicabilityByVersion.set(row.object_id, [...(applicabilityByVersion.get(row.object_id) || []), {
      dimension: row.dimension,
      label,
      isInherited: row.is_inherited,
    }]);
    if (system) systemsByVersion.set(row.object_id, [...(systemsByVersion.get(row.object_id) || []), system.name]);
  }

  const nodes: ProcessMapNode[] = processes.map((process) => {
    const versions = [...(process.process_versions || [])].sort((a, b) => {
      if (a.status === "effective" && b.status !== "effective") return -1;
      if (b.status === "effective" && a.status !== "effective") return 1;
      return b.version_number - a.version_number;
    });
    const version = (requestedVersionId ? versions.find((candidate) => candidate.id === requestedVersionId) : undefined) || versions[0];
    const assignments = (version?.process_assignments || []).flatMap((assignment) => {
      const assignedProfile = firstRelation(assignment.profiles);
      return [{ role: assignment.assignment_role, profileName: assignedProfile?.display_name || "ID " + assignment.profile_id.slice(0, 8) + "..." }];
    });
    const owner = assignments.find((assignment) => assignment.role === "owner")?.profileName || "";
    const apqcMappings: ProcessMapApqcMapping[] = (version?.process_apqc_mappings || []).flatMap((mapping) => {
      const element = firstRelation(mapping.apqc_elements);
      return element ? [{
        pcfId: element.pcf_id,
        name: element.name,
        role: mapping.mapping_role,
        matchType: mapping.match_type,
        status: mapping.status,
        rationale: mapping.rationale,
      }] : [];
    });
    return {
      id: process.id,
      versionId: version?.id || "",
      versionNumber: version?.version_number || 0,
      parentId: process.parent_process_id,
      code: process.process_code,
      sourceCode: process.source_code || "",
      name: version?.name_vi || process.process_code,
      nameEn: version?.name_en || "",
      level: process.level_type,
      status: version?.status || "draft",
      owner,
      summary: version?.process_at_a_glance || "",
      purpose: version?.purpose || "",
      description: version?.description || "",
      scopeIn: version?.scope_in || "",
      scopeOut: version?.scope_out || "",
      trigger: version?.trigger || "",
      outcome: version?.outcome || "",
      changeSummary: version?.change_summary || "",
      validFrom: version?.valid_from || null,
      validUntil: version?.valid_until || null,
      mappingCount: apqcMappings.length,
      displayOrder: process.display_order,
      businessPurpose: version?.business_purpose || "",
      scopeAndBoundaries: version?.scope_and_boundaries || "",
      criticalDecisionPoints: version?.critical_decision_points || "",
      accountabilityAndImpact: version?.accountability_and_impact || "",
      accessLevel: version?.access_level || "internal",
      allowedRoles: version?.allowed_roles || [],
      reviewDueAt: version?.review_due_at || null,
      tags: version ? tagsByVersion.get(version.id) || [] : [],
      assignments,
      applicability: version ? applicabilityByVersion.get(version.id) || [] : [],
      systems: version ? systemsByVersion.get(version.id) || [] : [],
      apqcMappings,
      supersedesVersionNumber: firstRelation(version?.superseded_version || null)?.version_number || null,
      createdAt: version?.created_at || null,
      createdBy: actorDisplayName(version?.created_profile || null, version?.created_by),
      updatedAt: version?.updated_at || null,
      updatedBy: actorDisplayName(version?.updated_profile || null, version?.updated_by),
      submittedAt: version?.submitted_at || null,
      submittedBy: actorDisplayName(version?.submitted_profile || null, version?.submitted_by),
      approvedAt: version?.approved_at || null,
      approvedBy: actorDisplayName(version?.approved_profile || null, version?.approved_by),
      publishedAt: version?.published_at || null,
      publishedBy: actorDisplayName(version?.published_profile || null, version?.published_by),
    };
  });

  const supplementalError = tagResult.error?.message || applicabilityResult.error?.message;
  return <ProcessMapClient nodes={nodes} userName={profile.display_name} role={profile.role} errorMessage={error?.message || supplementalError} />;
}
