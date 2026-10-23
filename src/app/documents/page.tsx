import Link from "next/link";
import Form from "next/form";
import WorkspaceShell from "@/components/workspace-shell";
import DocumentIntake from "@/components/document-intake";
import DocumentFileUploader from "@/components/document-file-uploader";
import { acknowledgeReadingAssignment, updateDocumentLifecycle } from "@/app/actions";
import { requireActiveAccount } from "@/lib/auth";
import { getServerTimestamp } from "@/lib/server-time";
import MetadataCard from "@/components/metadata-card";
import { buildDocumentMetadataGroups, documentRequiredKeys } from "@/lib/metadata-schema";
import {
  documentGroupOptions, documentStatusOptions, documentLanguageOptions,
  documentAccessOptions, documentRiskOptions, documentDate, documentOptionLabel,
} from "@/lib/document-display";

export const instant = false;

const statuses = documentStatusOptions;
const documentGroups = documentGroupOptions;
const sortOptions = [
  ["updated_desc", "Cập nhật mới nhất"],
  ["updated_asc", "Cập nhật cũ nhất"],
  ["title_asc", "Tên A → Z"],
  ["title_desc", "Tên Z → A"],
  ["review_asc", "Hạn rà soát gần nhất"],
  ["valid_from_desc", "Hiệu lực mới nhất"],
] as const;

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; type?: string; group?: string; language?: string; access?: string; risk?: string; owner?: string; sort?: string; preset?: string; group_by?: string; related_q?: string; process?: string; detail?: string; read_q?: string; read_status?: string; compare?: string; preview?: string; edit?: string; created?: string; updated?: string }> }) {
  const { q = "", status = "all", type = "all", group = "all", language = "all", access = "all", risk = "all", owner = "all", sort = "updated_desc", preset = "all", group_by = "none", related_q = "", process = "all", detail, read_q = "", read_status = "pending", compare, preview, edit, created, updated } = await searchParams;
  const { supabase, profile } = await requireActiveAccount();
  const requestNow=await getServerTimestamp();
  let query = supabase.from("document_versions").select("id, document_id, version_number, status, title_vi, title_en, document_group, language, document_abstract, change_summary, valid_from, valid_until, review_due_at, access_level, risk_rating, issuing_department, applicability_note, keywords, legal_reference, retention_note, created_at, updated_at, owner_id, designated_approver_id, created_by, document_type_value_id, vocabulary_values(label_vi), documents(document_code), document_files(id, original_file_name, mime_type, size_bytes)").limit(100);
  if (q.trim()) query = query.or(`title_vi.ilike.%${q.trim()}%,title_en.ilike.%${q.trim()}%,document_abstract.ilike.%${q.trim()}%,keywords.ilike.%${q.trim()}%,issuing_department.ilike.%${q.trim()}%`);
  if (status !== "all") query = query.eq("status", status);
  if (type !== "all") query = query.eq("document_type_value_id", type);
  if (group !== "all") query = query.ilike("document_group", group);
  if (language !== "all") query = query.eq("language", language);
  if (access !== "all") query = query.eq("access_level", access);
  if (risk !== "all") query = query.eq("risk_rating", risk);
  if (owner !== "all") query = query.eq("owner_id", owner);
  if (preset === "effective") query = query.eq("status", "effective");
  if (preset === "review_due") query = query.not("review_due_at", "is", null).lte("review_due_at", new Date(requestNow + 30 * 86400000).toISOString().slice(0, 10));
  if (sort === "updated_asc") query = query.order("updated_at", { ascending: true });
  else if (sort === "title_asc") query = query.order("title_vi", { ascending: true });
  else if (sort === "title_desc") query = query.order("title_vi", { ascending: false });
  else if (sort === "review_asc") query = query.order("review_due_at", { ascending: true, nullsFirst: false });
  else if (sort === "valid_from_desc") query = query.order("valid_from", { ascending: false, nullsFirst: false });
  else query = query.order("updated_at", { ascending: false });
  const canEdit = profile.role === "admin" || profile.role === "editor";
  const scopeDimensions = ["legal_entity","department","location","channel","product_service","employee_audience"];
  // Kick off the document list and the independent metadata/reading lists in one round trip wave.
  const [versionResult, processRows, peopleRows, typeRows, scopeRows, tagRows, editingResult, linkedRows, appliedRows, markedRows, assignmentResult, roleRows] = await Promise.all([
    query,
    supabase.from("processes").select("id,process_code,process_versions(name_vi)").order("display_order").limit(150),
    supabase.from("profiles").select("id,display_name,role").eq("is_active",true).order("display_name"),
    supabase.from("vocabulary_values").select("id,label_vi,document_group_code,vocabularies!inner(code)").eq("vocabularies.code","document_type").eq("is_active",true).order("display_order"),
    canEdit ? supabase.from("vocabulary_values").select("id,label_vi,vocabularies!inner(code)").in("vocabularies.code",scopeDimensions).eq("is_active",true).order("display_order") : Promise.resolve({data: []}),
    canEdit ? supabase.from("governance_tags").select("id,label_vi").eq("is_active",true).order("label_vi") : Promise.resolve({data: []}),
    canEdit && edit ? supabase.from("document_versions").select("id,document_id,title_vi,title_en,document_group,language,document_abstract,change_summary,valid_from,valid_until,review_due_at,issuing_department,applicability_note,keywords,owner_id,designated_approver_id,document_type_value_id,risk_rating,legal_reference,retention_note,access_level,status,created_by").eq("id",edit).maybeSingle() : Promise.resolve({data:null}),
    canEdit && edit ? supabase.from("document_process_links").select("process_id,link_role").eq("document_version_id",edit).eq("link_role","primary").limit(1) : Promise.resolve({data: []}),
    canEdit && edit ? supabase.from("object_applicability").select("dimension,vocabulary_value_id").eq("object_type","document_version").eq("object_id",edit) : Promise.resolve({data: []}),
    canEdit && edit ? supabase.from("object_tags").select("tag_id").eq("object_type","document_version").eq("object_id",edit) : Promise.resolve({data: []}),
    supabase.from("reading_assignments").select("id,object_id,required,assigned_at,due_at,reading_acknowledgments(acknowledged_at)").eq("profile_id",profile.id).eq("object_type","document_version").order("due_at",{ascending:true,nullsFirst:false}),
    supabase.from("business_roles").select("id,name").eq("is_active",true).order("name"),
  ]);
  const { data: versions, error } = versionResult;
  const versionIds = (versions || []).map((item) => item.id);
  const selected = compare ? (versions || []).find((item) => item.id === compare) : null;
  const previous = selected ? (versions || []).filter((item) => item.document_id === selected.document_id && item.version_number < selected.version_number).sort((a, b) => b.version_number - a.version_number)[0] : null;
  const files = (versions || []).flatMap((item) => ((item.document_files as unknown as { id: string; original_file_name: string; mime_type: string; size_bytes: number }[]) || []).map((file) => ({ ...file, versionTitle: item.title_vi })));
  const previewFile = preview ? files.find((file) => file.id === preview) : null;
  const availableProcesses = ((processRows.data||[]) as unknown as {id:string;process_code:string;process_versions:{name_vi:string}[]|null}[]).map(row=>({id:row.id,label:row.process_code+" · "+(row.process_versions?.[0]?.name_vi || "Quy trình")}));
  const people = (peopleRows.data||[]) as {id:string;display_name:string;role:string}[];
  const availablePeople = people.map(row=>({id:row.id,label:row.display_name}));
  const availableApprovers = people.filter(row=>row.role==="admin").map(row=>({id:row.id,label:row.display_name}));
  const availableTypes = ((typeRows.data||[]) as {id:string;label_vi:string;document_group_code:string|null}[]).map(row=>({id:row.id,label:row.label_vi,group:row.document_group_code||"other"}));
  const availableScopeOptions:Record<string,{id:string;label:string}[]> = Object.fromEntries(scopeDimensions.map(d=>[d,[]]));
  for (const row of ((scopeRows.data||[]) as unknown as {id:string;label_vi:string;vocabularies:{code:string}|{code:string}[]}[])) {
    const vocab = Array.isArray(row.vocabularies)?row.vocabularies[0]:row.vocabularies;
    if (vocab?.code&&availableScopeOptions[vocab.code]) availableScopeOptions[vocab.code].push({id:row.id,label:row.label_vi});
  }
  const availableTags = ((tagRows.data||[]) as {id:string;label_vi:string}[]).map(row=>({id:row.id,label:row.label_vi}));
  const businessRoles = ((roleRows.data||[]) as {id:string;name:string}[]).map(row=>({id:row.id,label:row.name}));
  const roleNames = new Map(businessRoles.map(role=>[role.id,role.label]));
  const audienceTypeCodes = ["role_must_know_document","role_should_know_document","role_not_applicable_document"];
  const documentIds=[...new Set([...(versions||[]).map(item=>item.document_id),editingResult.data?.document_id].filter((id):id is string=>Boolean(id)))];
  const knowledgeRows= documentIds.length ? await supabase.from("object_relationships")
    .select("source_id,target_id,relationship_types!inner(code)")
    .eq("source_type","business_role").eq("target_type","document").eq("status","verified")
    .in("target_id",documentIds).in("relationship_types.code",audienceTypeCodes) : {data:[],error:null};
  type KnowledgeLevel="must"|"should"|"none";
  type KnowledgeRelation={source_id:string;target_id:string;relationship_types:{code:string}|{code:string}[]};
  const codeToLevel:Record<string,KnowledgeLevel>={
    role_must_know_document:"must",role_should_know_document:"should",role_not_applicable_document:"none"
  };
  const selectedByDocument:Record<string,Record<string,KnowledgeLevel>>={};
  for(const relation of (knowledgeRows.data||[]) as unknown as KnowledgeRelation[]){
    const rt=Array.isArray(relation.relationship_types)?relation.relationship_types[0]:relation.relationship_types;
    const level=codeToLevel[rt?.code];
    if(level && roleNames.has(relation.source_id))
      (selectedByDocument[relation.target_id]||={})[relation.source_id]=level;
  }
  const editingDocument = editingResult.data && ["draft","rejected"].includes(editingResult.data.status)
    && (profile.role==="admin" || editingResult.data.created_by===profile.id || editingResult.data.owner_id===profile.id)
    ? editingResult.data : null;
  const currentScope:Record<string,string[]> = {};
  for(const row of ((appliedRows.data||[]) as {dimension:string;vocabulary_value_id:string|null}[])){
    if(!row.vocabulary_value_id)continue;
    (currentScope[row.dimension] ||= []).push(row.vocabulary_value_id);
  }
  const currentTags = ((markedRows.data||[]) as {tag_id:string}[]).map(row=>row.tag_id);
  const primaryProcessId = ((linkedRows.data||[]) as {process_id:string}[])[0]?.process_id||null;
  type ReadingAssignment={id:string;object_id:string;required:boolean;assigned_at:string;due_at:string|null;reading_acknowledgments:{acknowledged_at:string}[]|null};
  type AssignedVersion={id:string;version_number:number;title_vi:string;document_abstract:string|null;keywords:string|null;issuing_department:string|null;valid_from:string|null;vocabulary_values:{label_vi:string}|null;documents:{document_code:string}|null;document_files:{id:string;original_file_name:string;mime_type:string}[]|null};
  const assignments=(assignmentResult.data||[]) as unknown as ReadingAssignment[];
  const assignedVersionIds=assignments.map(item=>item.object_id);
  const assignedVersionsResult=assignedVersionIds.length?await supabase.from("document_versions").select("id,version_number,title_vi,document_abstract,keywords,issuing_department,valid_from,vocabulary_values(label_vi),documents(document_code),document_files(id,original_file_name,mime_type)").in("id",assignedVersionIds):{data:[],error:null};
  const assignedVersions=new Map(((assignedVersionsResult.data||[]) as unknown as AssignedVersion[]).map(item=>[item.id,item]));
  const [allProcessLinksResult, allApplicabilityResult, allTagsResult] = versionIds.length ? await Promise.all([
    supabase.from("document_process_links").select("document_version_id,process_id,link_role").in("document_version_id",versionIds),
    supabase.from("object_applicability").select("object_id,dimension,free_text,is_inherited,vocabulary_values(label_vi),systems(name)").eq("object_type","document_version").in("object_id",versionIds),
    supabase.from("object_tags").select("object_id,governance_tags(code,label_vi)").eq("object_type","document_version").in("object_id",versionIds),
  ]) : [{data:[]},{data:[]},{data:[]}];
  type ProcessLinkRow={document_version_id:string;process_id:string;link_role:string};
  type ApplicabilityViewRow={object_id:string;dimension:string;free_text:string|null;is_inherited:boolean;vocabulary_values:{label_vi:string}|{label_vi:string}[]|null;systems:{name:string}|{name:string}[]|null};
  type TagViewRow={object_id:string;governance_tags:{code:string;label_vi:string}|{code:string;label_vi:string}[]|null};
  const processLabelById=new Map(availableProcesses.map(item=>[item.id,item.label]));
  const processLinksByVersion=new Map<string,ProcessLinkRow[]>();
  for(const row of (allProcessLinksResult.data||[]) as ProcessLinkRow[]) processLinksByVersion.set(row.document_version_id,[...(processLinksByVersion.get(row.document_version_id)||[]),row]);
  const applicabilityByVersion=new Map<string,string[]>();
  const inheritedApplicabilityByVersion=new Set<string>();
  for(const row of (allApplicabilityResult.data||[]) as unknown as ApplicabilityViewRow[]){
    const vocabulary=Array.isArray(row.vocabulary_values)?row.vocabulary_values[0]:row.vocabulary_values;
    const system=Array.isArray(row.systems)?row.systems[0]:row.systems;
    const label=vocabulary?.label_vi||system?.name||row.free_text||row.dimension;
    applicabilityByVersion.set(row.object_id,[...(applicabilityByVersion.get(row.object_id)||[]),label]);
    if(row.is_inherited) inheritedApplicabilityByVersion.add(row.object_id);
  }
  const tagsByVersion=new Map<string,string[]>();
  for(const row of (allTagsResult.data||[]) as unknown as TagViewRow[]){
    const tag=Array.isArray(row.governance_tags)?row.governance_tags[0]:row.governance_tags;
    if(tag) tagsByVersion.set(row.object_id,[...(tagsByVersion.get(row.object_id)||[]),tag.code+" · "+tag.label_vi]);
  }
  const knowledgeByDocument=new Map<string,string[]>();
  for(const [documentId,entries] of Object.entries(selectedByDocument)){
    knowledgeByDocument.set(documentId,Object.entries(entries).map(([roleId,level])=>(roleNames.get(roleId)||"Chức danh")+" · "+({must:"Phải biết",should:"Nên biết",none:"Không áp dụng"} as const)[level]));
  }
  type DocumentVersion=NonNullable<typeof versions>[number];
  const contextTerms=(item:DocumentVersion)=>[
    ...(processLinksByVersion.get(item.id)||[]).map(link=>processLabelById.get(link.process_id)||""),
    ...(applicabilityByVersion.get(item.id)||[]),
    ...(tagsByVersion.get(item.id)||[]),
    ...(knowledgeByDocument.get(item.document_id)||[]),
  ].filter(Boolean);
  const hasRequiredMetadata=(item:DocumentVersion)=>{
    const keys=documentRequiredKeys(item.document_group);
    const values:Record<string,unknown>={
      documentCode:(item.documents as unknown as {document_code:string}|null)?.document_code,
      documentType:item.document_type_value_id,documentGroup:item.document_group,version:item.version_number,status:item.status,
      titleVi:item.title_vi,language:item.language,abstract:item.document_abstract,changeSummary:item.change_summary,
      owner:item.owner_id,issuingDepartment:item.issuing_department,accessLevel:item.access_level,reviewDue:item.review_due_at,
      primaryProcess:(processLinksByVersion.get(item.id)||[]).find(link=>link.link_role==="primary")?.process_id,
      applicability:applicabilityByVersion.get(item.id),files:(item.document_files as unknown as unknown[])||[],
      validFrom:item.valid_from,validUntil:item.valid_until,legalReference:item.legal_reference,riskRating:item.risk_rating,
      createdAt:item.created_at,updatedAt:item.updated_at,
    };
    return [...keys].every(key=>Array.isArray(values[key])?values[key].length>0:Boolean(values[key]));
  };
  const relatedNeedle=related_q.trim().toLocaleLowerCase("vi");
  const displayVersions=(versions||[]).filter(item=>{
    if(process!=="all"&&!(processLinksByVersion.get(item.id)||[]).some(link=>link.process_id===process))return false;
    if(preset==="linked_process"&&!(processLinksByVersion.get(item.id)||[]).length)return false;
    if(preset==="missing_metadata"&&hasRequiredMetadata(item))return false;
    if(relatedNeedle&&!contextTerms(item).some(value=>value.toLocaleLowerCase("vi").includes(relatedNeedle)))return false;
    return true;
  });
  const viewReason=(item:(typeof displayVersions)[number])=>{
    const reasons:string[]=[];
    if(preset==="effective")reasons.push("Đang hiệu lực");
    if(preset==="review_due")reasons.push("Sắp đến hạn rà soát");
    if(preset==="missing_metadata")reasons.push("Thiếu metadata bắt buộc theo Class");
    if(preset==="linked_process")reasons.push("Đã liên kết với Business Process");
    if(relatedNeedle)reasons.push(...contextTerms(item).filter(value=>value.toLocaleLowerCase("vi").includes(relatedNeedle)).slice(0,2));
    return reasons.length?reasons:["Khớp bộ lọc thư viện hiện tại"];
  };
  const groupLabel=(item:(typeof displayVersions)[number])=>{
    if(group_by==="type")return (item.vocabulary_values as unknown as {label_vi:string}|null)?.label_vi||"Chưa phân loại";
    if(group_by==="process"){const primary=(processLinksByVersion.get(item.id)||[]).find(link=>link.link_role==="primary");return primary?processLabelById.get(primary.process_id)||"Quy trình khác":"Chưa gắn quy trình";}
    if(group_by==="status")return documentOptionLabel(statuses,item.status);
    if(group_by==="owner")return availablePeople.find(person=>person.id===item.owner_id)?.label||"Chưa có chủ sở hữu";
    return "Tất cả tài liệu";
  };
  if(group_by!=="none")displayVersions.sort((a,b)=>groupLabel(a).localeCompare(groupLabel(b),"vi")||a.title_vi.localeCompare(b.title_vi,"vi"));
  const detailItem=detail?(versions||[]).find(item=>item.id===detail):null;
  const now=requestNow;
  const readingItems=assignments.map(assignment=>({assignment,version:assignedVersions.get(assignment.object_id)})).filter(item=>item.version).filter(({assignment,version})=>{
    const acknowledged=Boolean(assignment.reading_acknowledgments?.length);
    const overdue=!acknowledged&&Boolean(assignment.due_at)&&new Date(assignment.due_at as string).getTime()<now;
    if(read_status==="pending"&&acknowledged)return false;
    if(read_status==="overdue"&&!overdue)return false;
    if(read_status==="completed"&&!acknowledged)return false;
    if(read_status==="required"&&!assignment.required)return false;
    const needle=read_q.trim().toLocaleLowerCase("vi");
    return !needle||[version?.title_vi,version?.documents?.document_code,version?.document_abstract,version?.keywords,version?.issuing_department].some(value=>value?.toLocaleLowerCase("vi").includes(needle));
  });

  const comparisonRows = selected ? [
    ["Tiêu đề tiếng Việt", previous?.title_vi, selected.title_vi],
    ["Tiêu đề tiếng Anh", previous?.title_en, selected.title_en],
    ["Nhóm tài liệu", documentOptionLabel(documentGroups, previous?.document_group), documentOptionLabel(documentGroups, selected.document_group)],
    ["Ngôn ngữ", documentOptionLabel(documentLanguageOptions, previous?.language), documentOptionLabel(documentLanguageOptions, selected.language)],
    ["Mức độ truy cập", documentOptionLabel(documentAccessOptions, previous?.access_level), documentOptionLabel(documentAccessOptions, selected.access_level)],
    ["Mức độ rủi ro", documentOptionLabel(documentRiskOptions, previous?.risk_rating), documentOptionLabel(documentRiskOptions, selected.risk_rating)],
    ["Đơn vị ban hành", previous?.issuing_department, selected.issuing_department],
    ["Từ khóa", previous?.keywords, selected.keywords],
    ["Căn cứ ban hành", previous?.legal_reference, selected.legal_reference],
    ["Lưu trữ", previous?.retention_note, selected.retention_note],
    ["Tóm tắt", previous?.document_abstract, selected.document_abstract],
    ["Thay đổi", previous?.change_summary, selected.change_summary],
    ["Hiệu lực từ", documentDate(previous?.valid_from), documentDate(selected.valid_from)],
    ["Hiệu lực đến", documentDate(previous?.valid_until), documentDate(selected.valid_until)],
    ["Hạn rà soát", documentDate(previous?.review_due_at), documentDate(selected.review_due_at)],
    ["Trạng thái", documentOptionLabel(statuses,previous?.status), documentOptionLabel(statuses,selected.status)],
  ] : [];

  const detailDocument=detailItem?.documents as unknown as {document_code:string}|null;
  const detailType=detailItem?.vocabulary_values as unknown as {label_vi:string}|null;
  const detailPrimary=detailItem?(processLinksByVersion.get(detailItem.id)||[]).find(link=>link.link_role==="primary"):null;
  const detailFiles=detailItem?((detailItem.document_files as unknown as {original_file_name:string}[])||[]):[];
  const detailKnowledge=detailItem?knowledgeByDocument.get(detailItem.document_id)||[]:[];
  const detailGroups=detailItem?buildDocumentMetadataGroups({
    documentCode:detailDocument?.document_code,documentType:detailType?.label_vi,documentGroup:documentOptionLabel(documentGroups,detailItem.document_group),
    version:"v"+detailItem.version_number,status:documentOptionLabel(statuses,detailItem.status),titleVi:detailItem.title_vi,titleEn:detailItem.title_en,
    language:documentOptionLabel(documentLanguageOptions,detailItem.language),abstract:detailItem.document_abstract,keywords:detailItem.keywords,
    changeSummary:detailItem.change_summary,owner:availablePeople.find(person=>person.id===detailItem.owner_id)?.label,
    approver:availablePeople.find(person=>person.id===detailItem.designated_approver_id)?.label,issuingDepartment:detailItem.issuing_department,
    accessLevel:documentOptionLabel(documentAccessOptions,detailItem.access_level),riskRating:documentOptionLabel(documentRiskOptions,detailItem.risk_rating),
    legalReference:detailItem.legal_reference,retentionNote:detailItem.retention_note,
    primaryProcess:detailPrimary?processLabelById.get(detailPrimary.process_id):null,applicability:applicabilityByVersion.get(detailItem.id),
    applicabilityNote:detailItem.applicability_note,tags:tagsByVersion.get(detailItem.id),knowledgeAudience:detailKnowledge,
    relatedObjects:contextTerms(detailItem),validFrom:documentDate(detailItem.valid_from),validUntil:documentDate(detailItem.valid_until),
    reviewDue:documentDate(detailItem.review_due_at),files:detailFiles.map(file=>file.original_file_name),
    createdAt:detailItem.created_at?new Date(detailItem.created_at).toLocaleString("vi-VN"):null,
    updatedAt:detailItem.updated_at?new Date(detailItem.updated_at).toLocaleString("vi-VN"):null,
  },detailItem.document_group):[];
  return <WorkspaceShell active="/documents" eyebrow="QUẢN LÝ TÀI LIỆU" title="Tài liệu" description="Tìm tài liệu áp dụng cho công việc và theo dõi các tài liệu bạn phải đọc." userName={profile.display_name} role={profile.role}>
    {(created || updated) && <div className="state-message" role="status"><strong>{created ? "Đã tạo bản nháp tài liệu." : "Đã cập nhật thông tin tài liệu."}</strong><span>Thông tin đã lưu trong Supabase.</span></div>}
    {canEdit && <DocumentIntake key={editingDocument?.id||"new"} processes={availableProcesses} people={availablePeople} approvers={availableApprovers} types={availableTypes} businessRoles={businessRoles} canManageKnowledge={profile.role==="admin"} selectedKnowledge={editingDocument?selectedByDocument[editingDocument.document_id]||{}:{}} scopeOptions={availableScopeOptions} tags={availableTags} existing={editingDocument} primaryProcessId={editingDocument?primaryProcessId:null} selectedScopes={editingDocument?currentScope:{}} selectedTags={editingDocument?currentTags:[]}/>}
    <section className="reading-panel" aria-labelledby="required-reading-title">
      <div className="document-library-controls-heading"><div><p className="section-kicker">DÀNH CHO TÔI</p><h2 id="required-reading-title">Tài liệu cần đọc của tôi</h2><p className="reading-panel-intro">Danh sách được giao trực tiếp cho tài khoản của bạn. Ưu tiên tài liệu quá hạn và chưa xác nhận.</p></div><span className="count-chip">{readingItems.length} tài liệu</span></div>
      <Form action="/documents" scroll={false} className="reading-filter-form"><label>Tìm trong tài liệu được giao<input name="read_q" defaultValue={read_q} placeholder="Mã, tên, từ khóa, đơn vị ban hành…" /></label><label>Trạng thái<select name="read_status" defaultValue={read_status}><option value="pending">Chưa xác nhận</option><option value="overdue">Quá hạn</option><option value="completed">Đã xác nhận</option><option value="required">Tất cả bắt buộc đọc</option><option value="all">Tất cả được giao</option></select></label><button type="submit">Lọc danh sách</button><Link className="text-button" href="/documents?read_status=all" scroll={false}>Xóa bộ lọc</Link></Form>
      {!readingItems.length?<div className="reading-empty"><strong>Không có tài liệu phù hợp.</strong><span>{assignments.length?"Hãy thử đổi từ khóa hoặc trạng thái lọc.":"Hiện chưa có tài liệu nào được giao cho tài khoản của bạn."}</span></div>:<div className="reading-list">{readingItems.map(({assignment,version})=>{if(!version)return null;const acknowledgedAt=assignment.reading_acknowledgments?.[0]?.acknowledged_at;const overdue=!acknowledgedAt&&Boolean(assignment.due_at)&&new Date(assignment.due_at as string).getTime()<now;const firstFile=version.document_files?.[0];return <article key={assignment.id} className={overdue?"overdue":""}><div><span className="mono-code">{version.documents?.document_code||"—"} · v{version.version_number}</span><h3>{version.title_vi}</h3><p>{version.document_abstract||"Chưa có tóm tắt."}</p><div className="reading-metadata"><span>{assignment.required?"Bắt buộc đọc":"Tham khảo"}</span>{version.vocabulary_values?.label_vi&&<span>Loại: {version.vocabulary_values.label_vi}</span>}{version.issuing_department&&<span>Ban hành: {version.issuing_department}</span>}{version.valid_from&&<span>Hiệu lực: {documentDate(version.valid_from)}</span>}<span>Giao ngày: {new Date(assignment.assigned_at).toLocaleDateString("vi-VN")}</span><span>Hạn đọc: {assignment.due_at?new Date(assignment.due_at).toLocaleDateString("vi-VN"):"Không đặt hạn"}</span></div></div><div className="reading-actions"><span className={`reading-status ${acknowledgedAt?"done":overdue?"late":"pending"}`}>{acknowledgedAt?`Đã xác nhận ${new Date(acknowledgedAt).toLocaleDateString("vi-VN")}`:overdue?"Quá hạn":"Chưa xác nhận"}</span>{firstFile?(firstFile.mime_type==="application/pdf"||firstFile.mime_type.startsWith("image/")?<Link className="text-button" href={`/documents?preview=${firstFile.id}`} scroll={false}>Mở tài liệu</Link>:<a className="text-button" href={`/documents/files/${firstFile.id}`}>Mở tài liệu</a>):<span className="missing-file">Chưa có file</span>}{!acknowledgedAt&&<form action={acknowledgeReadingAssignment}><input type="hidden" name="assignment_id" value={assignment.id}/><button type="submit" className="primary-button">Xác nhận đã đọc</button></form>}</div></article>})}</div>}
    </section>

    <section className="document-library-controls" aria-labelledby="document-library-filter-title">
      <div className="document-library-controls-heading">
        <div><p className="section-kicker">THƯ VIỆN TÀI LIỆU</p><h2 id="document-library-filter-title">Tìm, lọc và sắp xếp</h2></div>
        <Link className="text-button" href="/documents" scroll={false}>Xóa bộ lọc</Link>
      </div>
      <nav className="document-view-presets" aria-label="View tài liệu">
        {[["all","Tất cả"],["effective","Đang hiệu lực"],["review_due","Sắp rà soát"],["missing_metadata","Thiếu metadata"],["linked_process","Đã gắn quy trình"]].map(([value,label])=><Link key={value} className={preset===value?"active":""} href={"/documents?preset="+value}>{label}</Link>)}
      </nav>
      <Form action="/documents" scroll={false} className="document-filter-form">
        <input type="hidden" name="preset" value={preset}/>
        <label className="document-filter-search">Tìm qua đối tượng liên quan
          <input name="related_q" defaultValue={related_q} placeholder="Quy trình, chức danh, phạm vi, tag…"/>
        </label>
        <label>Quy trình liên kết<select name="process" defaultValue={process}><option value="all">Tất cả quy trình</option>{availableProcesses.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Nhóm View theo<select name="group_by" defaultValue={group_by}><option value="none">Không nhóm</option><option value="type">Loại tài liệu</option><option value="process">Business Process</option><option value="status">Trạng thái</option><option value="owner">Chủ sở hữu</option></select></label>
        <label className="document-filter-search">Tìm kiếm
          <input name="q" defaultValue={q} placeholder="Tên, tóm tắt, từ khóa, đơn vị ban hành…" />
        </label>
        <label>Trạng thái<select name="status" defaultValue={status}><option value="all">Tất cả</option>{statuses.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Loại tài liệu<select name="type" defaultValue={type}><option value="all">Tất cả</option>{availableTypes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Nhóm tài liệu<select name="group" defaultValue={group}><option value="all">Tất cả</option>{documentGroups.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Ngôn ngữ<select name="language" defaultValue={language}><option value="all">Tất cả</option>{documentLanguageOptions.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Mức độ truy cập<select name="access" defaultValue={access}><option value="all">Tất cả</option>{documentAccessOptions.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Mức độ rủi ro<select name="risk" defaultValue={risk}><option value="all">Tất cả</option>{documentRiskOptions.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label>Chủ sở hữu<select name="owner" defaultValue={owner}><option value="all">Tất cả</option>{availablePeople.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Sắp xếp<select name="sort" defaultValue={sort}>{sortOptions.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <button type="submit">Áp dụng</button>
      </Form>
    </section>

    {canEdit && (versions||[]).some(item=>["draft","rejected"].includes(item.status)) &&
      <DocumentFileUploader versions={(versions||[]).filter(item=>["draft","rejected"].includes(item.status)).map(item=>({
        id:item.id,label:item.title_vi+" · v"+item.version_number
      }))}/>}
    
    {detailItem ? <section className="data-panel document-metadata-detail" id="document-metadata-detail"><div className="data-panel-heading"><div><p className="section-kicker">METADATA CARD</p><h2>{detailItem.title_vi}</h2><p>Hiển thị toàn bộ property áp dụng theo Class; trường bắt buộc còn thiếu được đánh dấu rõ.</p></div><Link className="text-button" href="/documents" scroll={false}>Đóng chi tiết</Link></div><MetadataCard objectType="Document" className={detailType?.label_vi||"Chưa phân loại"} groups={detailGroups} testId="document-metadata-card"/></section> : null}
    {previewFile ? <section className="data-panel document-preview-panel"><div className="data-panel-heading"><div><p className="section-kicker">XEM TÀI LIỆU</p><h2>{previewFile.original_file_name}</h2></div><Link className="text-button" href="/documents" scroll={false}>Đóng preview</Link></div>{previewFile.mime_type === "application/pdf" ? <iframe title={`Preview ${previewFile.original_file_name}`} src={`/documents/files/${previewFile.id}`} /> : previewFile.mime_type.startsWith("image/") ? <img src={`/documents/files/${previewFile.id}`} alt={previewFile.original_file_name} /> : <div className="state-message"><strong>Tệp Word, Excel hoặc PowerPoint chưa hỗ trợ xem trực tiếp an toàn trên trình duyệt.</strong><a className="primary-button" href={`/documents/files/${previewFile.id}`}>Tải file</a></div>}</section> : null}

    {selected ? <section className="compare-panel"><div className="data-panel-heading"><div><p className="section-kicker">SO SÁNH PHIÊN BẢN</p><h2>{selected.title_vi}</h2></div><Link href="/documents" scroll={false}>Đóng so sánh</Link></div><div className="comparison-table" role="table" aria-label="So sánh thông tin tài liệu"><div className="comparison-row heading" role="row"><strong>Trường</strong><strong>{previous ? `v${previous.version_number}` : "Phiên bản trước"}</strong><strong>v{selected.version_number}</strong></div>{comparisonRows.map(([label, oldValue, newValue]) => <div className={`comparison-row${String(oldValue || "") !== String(newValue || "") ? " changed" : ""}`} role="row" key={label}><span>{label}</span><span>{oldValue || "—"}</span><span>{newValue || "—"}</span></div>)}</div></section> : null}

    <section className="data-panel"><div className="data-panel-heading"><div><p className="section-kicker">DANH SÁCH TÀI LIỆU</p><h2>{displayVersions.length} phiên bản</h2></div><span className="count-chip">25 MB / file</span></div>{error ? <div className="state-message error-state"><strong>Không thể tải tài liệu</strong><span>{error.message}</span></div> : !displayVersions.length ? <div className="state-message"><strong>Chưa có tài liệu</strong><span>Người có quyền biên tập có thể tạo bản nháp và tải tài liệu lên kho lưu trữ nội bộ.</span></div> : <div className="document-grid">{displayVersions.map((item) => { const document = item.documents as unknown as { document_code: string } | null; const docType = item.vocabulary_values as unknown as {label_vi:string}|null; const itemFiles = (item.document_files as unknown as { id: string; original_file_name: string; mime_type: string; size_bytes: number }[]) || []; return <article className="document-card" key={item.id}><div className="document-icon">{itemFiles[0]?.mime_type.includes("pdf") ? "PDF" : itemFiles[0] ? "FILE" : "META"}</div><div><span className="mono-code">{document?.document_code || "—"} · v{item.version_number}</span><h3>{item.title_vi}</h3><p>{item.document_abstract || "Chưa có tóm tắt."}</p><div className="document-view-reason"><strong>Vì sao xuất hiện:</strong>{viewReason(item).map(reason=><span key={reason}>{reason}</span>)}</div><div className="document-card-metadata"><span>View: {groupLabel(item)}</span>{docType?.label_vi&&<span>Loại: {docType.label_vi}</span>}<span>Nhóm: {documentOptionLabel(documentGroups,item.document_group)}</span><span>Ngôn ngữ: {documentOptionLabel(documentLanguageOptions,item.language)}</span><span>Truy cập: {documentOptionLabel(documentAccessOptions,item.access_level)}</span>{item.risk_rating&&<span>Rủi ro: {documentOptionLabel(documentRiskOptions,item.risk_rating)}</span>}{item.owner_id&&<span>Chủ sở hữu: {availablePeople.find(person=>person.id===item.owner_id)?.label||"—"}</span>}{item.issuing_department&&<span>Ban hành: {item.issuing_department}</span>}{item.valid_from&&<span>Hiệu lực: {documentDate(item.valid_from)}</span>}{item.valid_until&&<span>Hết hiệu lực: {documentDate(item.valid_until)}</span>}{item.keywords&&<span>Từ khóa: {item.keywords}</span>}
              {(["must","should","none"] as const).map(level=>{
                const labels={must:"Phải biết",should:"Nên biết",none:"Không áp dụng"};
                const members=Object.entries(selectedByDocument[item.document_id]||{}).filter(([,entry])=>entry===level).map(([roleId])=>roleNames.get(roleId)).filter(Boolean);
                return members.length?<span key={level}>{labels[level]}: {members.join(", ")}</span>:null;
              })}
              </div><footer><span className="status-badge">{documentOptionLabel(statuses,item.status)}</span><span>{item.review_due_at ? `Rà soát: ${documentDate(item.review_due_at)}` : "Chưa đặt ngày rà soát"}</span>{itemFiles.map((file) => <a key={file.id} href={"/documents/files/" + file.id} target="_blank" rel="noopener noreferrer">{file.mime_type === "application/pdf" || file.mime_type.startsWith("image/") ? "Mở " : "Tải "}{file.original_file_name}</a>)}<Link href={`/documents?detail=${item.id}#document-metadata-detail`} scroll={false}>Xem toàn bộ metadata</Link><Link href={`/documents?compare=${item.id}`} scroll={false}>So sánh thông tin</Link>{canEdit && ["draft","rejected"].includes(item.status) && <Link href={`/documents?edit=${item.id}#document-edit`}>Sửa thông tin</Link>}</footer>{canEdit ? <form className="document-lifecycle-form" action={updateDocumentLifecycle}><input type="hidden" name="document_version_id" value={item.id}/><select name="status" defaultValue={item.status} aria-label={`Trạng thái ${item.title_vi}`}>{statuses.map(item=><option key={item.value} value={item.value}>{item.label}</option>)}</select><button type="submit" className="text-button">Cập nhật</button></form> : null}</div></article>})}</div>}</section>
  </WorkspaceShell>;
}
