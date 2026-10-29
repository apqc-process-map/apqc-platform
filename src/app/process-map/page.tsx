import { requireActiveAccount } from "@/lib/auth";
import ProcessMapClient, {
  type ProcessMapApqcNode,
  type ProcessMapApqcMapping,
  type ProcessMapRelatedDocument,
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
  supersedes_version_id: string | null;
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
  apqc_elements: ApqcElementRow | ApqcElementRow[] | null;
};

type ApqcElementRow = {
  id: string;
  pcf_id: string;
  hierarchy_id: string;
  level_number: number;
  name: string;
  description: string;
  parent_id: string | null;
  display_order: number;
};

type DocumentVersionRelation = {
  id: string;
  title_vi: string;
  version_number: number;
  status: string;
  documents: { document_code: string; archived_at: string | null } | { document_code: string; archived_at: string | null }[] | null;
  replaced_at: string | null;
  document_files: Array<{ id: string; original_file_name: string; mime_type: string }> | null;
};
type DocumentProcessLinkRow = {
  process_id: string;
  link_role: string;
  document_versions: DocumentVersionRelation | DocumentVersionRelation[] | null;
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
    .select("id,process_code,source_code,parent_process_id,level_type,display_order,process_versions(id,version_number,status,name_vi,name_en,purpose,description,scope_in,scope_out,trigger,outcome,process_at_a_glance,business_purpose,scope_and_boundaries,critical_decision_points,accountability_and_impact,access_level,allowed_roles,valid_from,valid_until,review_due_at,change_summary,created_at,updated_at,submitted_at,approved_at,published_at,created_by,updated_by,submitted_by,approved_by,published_by,supersedes_version_id,created_profile:profiles!process_versions_created_by_fkey(display_name),updated_profile:profiles!process_versions_updated_by_fkey(display_name),submitted_profile:profiles!process_versions_submitted_by_fkey(display_name),approved_profile:profiles!process_versions_approved_by_fkey(display_name),published_profile:profiles!process_versions_published_by_fkey(display_name),process_assignments(assignment_role,profile_id,profiles(display_name)),process_apqc_mappings(id,mapping_role,match_type,status,rationale,apqc_elements(id,pcf_id,hierarchy_id,level_number,name,description,parent_id,display_order))))")
    .is("archived_at", null)
    .order("display_order");

  const processes = (data || []) as unknown as ProcessRow[];
  const versionIds = processes.flatMap((process) => process.process_versions || []).map((version) => version.id);
  const versionNumberById = new Map(
    processes.flatMap((process) => process.process_versions || []).map((version) => [version.id, version.version_number]),
  );
  // Fetch file metadata through document-version RLS; never expose private Storage keys to the browser.
  const [tagResult, applicabilityResult, relatedDocumentsResult, apqcResult] = await Promise.all([
    versionIds.length
      ? supabase.from("object_tags").select("object_id,governance_tags(code,label_vi,color)").eq("object_type", "process_version").in("object_id", versionIds)
      : Promise.resolve({ data: [], error: null }),
    versionIds.length
      ? supabase.from("object_applicability").select("object_id,dimension,free_text,is_inherited,vocabulary_values(label_vi,label_en),systems(name,code)").eq("object_type", "process_version").in("object_id", versionIds)
      : Promise.resolve({ data: [], error: null }),
    processes.length
      ? supabase.from("document_process_links")
          .select("process_id,link_role,document_versions!inner(id,title_vi,version_number,status,replaced_at,documents(document_code,archived_at),document_files(id,original_file_name,mime_type))")
          .in("process_id", processes.map((process) => process.id))
      : Promise.resolve({ data: [], error: null }),
    supabase.from("apqc_elements")
      .select("id,pcf_id,hierarchy_id,level_number,name,description,parent_id,display_order,apqc_frameworks!inner(is_active)")
      .eq("apqc_frameworks.is_active", true)
      .lte("level_number", 3)
      .order("display_order"),
  ]);

  const apqcElements = (apqcResult.data || []) as ApqcElementRow[];
  const apqcById = new Map(apqcElements.map((element) => [element.id, element]));
  function ancestorAtLevel(element: ApqcElementRow, targetLevel: number) {
    let current: ApqcElementRow | undefined = element;
    while (current && current.level_number > targetLevel && current.parent_id) current = apqcById.get(current.parent_id);
    return current?.level_number === targetLevel ? current : undefined;
  }

  const apqcNodes: ProcessMapApqcNode[] = apqcElements
    .filter((element) => element.level_number <= 2)
    .map((element) => ({
      id: element.id,
      pcfId: element.pcf_id,
      hierarchyId: element.hierarchy_id,
      levelNumber: element.level_number,
      name: element.name,
      description: element.description,
      parentId: element.parent_id,
      displayOrder: element.display_order,
    }));

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

  const documentsByProcess = new Map<string, ProcessMapRelatedDocument[]>();
  for (const row of (relatedDocumentsResult.data || []) as unknown as DocumentProcessLinkRow[]) {
    const version = firstRelation(row.document_versions);
    if (!version || version.replaced_at || firstRelation(version.documents)?.archived_at) continue;
    const related = documentsByProcess.get(row.process_id) || [];
    if (related.some((item) => item.versionId === version.id)) continue;
    const documentIdentity = firstRelation(version.documents);
    related.push({
      versionId: version.id,
      code: documentIdentity?.document_code || "",
      title: version.title_vi,
      versionNumber: version.version_number,
      status: version.status,
      role: row.link_role,
      files: (version.document_files || []).map((file) => ({
        id: file.id, name: file.original_file_name, mimeType: file.mime_type,
      })),
    });
    documentsByProcess.set(row.process_id, related);
  }
  for (const items of documentsByProcess.values()) {
    items.sort((a, b) => Number(b.role === "primary") - Number(a.role === "primary") || a.title.localeCompare(b.title, "vi"));
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
      return element && apqcById.has(element.id) ? [{
        pcfId: element.pcf_id,
        name: element.name,
        role: mapping.mapping_role,
        matchType: mapping.match_type,
        status: mapping.status,
        rationale: mapping.rationale,
        apqcLevel: element.level_number,
        ancestorLevel1Id: ancestorAtLevel(element, 1)?.id || null,
        ancestorLevel2Id: ancestorAtLevel(element, 2)?.id || null,
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
      relatedDocuments: documentsByProcess.get(process.id) || [],
      supersedesVersionNumber: version?.supersedes_version_id ? versionNumberById.get(version.supersedes_version_id) || null : null,
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

  const supplementalError = tagResult.error?.message || applicabilityResult.error?.message || relatedDocumentsResult.error?.message || apqcResult.error?.message;
  return <ProcessMapClient nodes={nodes} apqcNodes={apqcNodes} userName={profile.display_name} role={profile.role} errorMessage={error?.message || supplementalError} />;
}
