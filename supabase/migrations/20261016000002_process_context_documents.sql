-- Complete E3 foundations and add E5/E6 data foundations.
create type public.assignment_role as enum ('creator', 'owner', 'steward', 'sme', 'approver', 'required_reader', 'interested_reader');
create type public.applicability_dimension as enum ('legal_entity', 'department', 'location', 'channel', 'product_service', 'system', 'employee_audience', 'exception');
create type public.relationship_group as enum ('structure', 'execution', 'governance', 'ownership', 'knowledge', 'impact', 'evidence', 'lifecycle', 'delivery', 'general');
create type public.relationship_status as enum ('proposed', 'verified', 'rejected');
create type public.relationship_object_type as enum ('process', 'document', 'business_object', 'system', 'risk', 'kpi', 'business_role', 'finding');
create type public.business_object_type as enum ('document', 'data_record', 'decision_approval', 'event_trigger', 'material_product', 'service_deliverable');
create type public.document_link_role as enum ('primary', 'supporting', 'evidence', 'reference');
create type public.review_object_type as enum ('process_version', 'document_version');
create type public.review_status as enum ('open', 'approved', 'rejected', 'cancelled');

create table public.process_aliases (
  id uuid primary key default gen_random_uuid(), process_id uuid not null references public.processes(id) on delete cascade,
  alias_type text not null check (alias_type in ('code','name')), alias_value text not null, locale text,
  unique(process_id, alias_type, alias_value)
);
create table public.process_assignments (
  id uuid primary key default gen_random_uuid(), process_version_id uuid not null references public.process_versions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade, assignment_role public.assignment_role not null,
  is_inherited boolean not null default false, inherited_from_process_id uuid references public.processes(id),
  unique(process_version_id, profile_id, assignment_role)
);
create table public.vocabularies (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, is_system boolean not null default false
);
create table public.vocabulary_values (
  id uuid primary key default gen_random_uuid(), vocabulary_id uuid not null references public.vocabularies(id) on delete cascade,
  code text not null, label_vi text not null, label_en text, parent_value_id uuid references public.vocabulary_values(id),
  display_order integer not null default 0, is_active boolean not null default true, unique(vocabulary_id, code)
);
create table public.object_applicability (
  id uuid primary key default gen_random_uuid(), object_type public.review_object_type not null, object_id uuid not null,
  dimension public.applicability_dimension not null, vocabulary_value_id uuid references public.vocabulary_values(id),
  system_id uuid, free_text text, is_inherited boolean not null default false, inherited_from_object_id uuid,
  check (num_nonnulls(vocabulary_value_id, system_id, free_text) = 1)
);

create table public.systems (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text, owner_text text, is_active boolean not null default true);
create table public.risks (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text, rating text, owner_text text, is_active boolean not null default true);
create table public.kpis (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text, unit text, owner_text text, is_active boolean not null default true);
create table public.business_roles (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, description text, is_active boolean not null default true);
create table public.business_objects (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, object_type public.business_object_type not null, description text, is_active boolean not null default true);
alter table public.object_applicability add constraint object_applicability_system_fk foreign key (system_id) references public.systems(id);

create table public.relationship_types (
  id uuid primary key default gen_random_uuid(), code text not null unique, group_code public.relationship_group not null,
  label_vi text not null, label_en text not null, inverse_label_vi text not null, inverse_label_en text not null,
  is_directed boolean not null default true, allowed_source_types text[] not null default '{}', allowed_target_types text[] not null default '{}', is_active boolean not null default true
);
create table public.object_relationships (
  id uuid primary key default gen_random_uuid(), source_type public.relationship_object_type not null, source_id uuid not null,
  target_type public.relationship_object_type not null, target_id uuid not null, relationship_type_id uuid not null references public.relationship_types(id),
  label text, description text, status public.relationship_status not null default 'proposed', valid_from date, valid_until date,
  evidence_text text, created_by uuid references public.profiles(id), updated_by uuid references public.profiles(id), verified_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (source_id <> target_id or source_type <> target_type), check(valid_until is null or valid_from is null or valid_until >= valid_from)
);
create table public.process_business_object_flows (
  process_id uuid not null references public.processes(id) on delete cascade, business_object_id uuid not null references public.business_objects(id) on delete cascade,
  direction text not null check(direction in ('input','output')), description text, primary key(process_id, business_object_id, direction)
);

insert into public.relationship_types(code, group_code, label_vi, label_en, inverse_label_vi, inverse_label_en, allowed_source_types, allowed_target_types) values
('input_from','execution','Nháº­n Ä‘áº§u vÃ o tá»«','Input from','Cung cáº¥p Ä‘áº§u vÃ o cho','Provides input to',array['process'],array['process','business_object']),
('output_to','execution','Cung cáº¥p Ä‘áº§u ra cho','Output to','Nháº­n Ä‘áº§u ra tá»«','Receives output from',array['process'],array['process','business_object']),
('depends_on','execution','Phá»¥ thuá»™c vÃ o','Depends on','ÄÆ°á»£c phá»¥ thuá»™c bá»Ÿi','Supports',array['process'],array['process','system']),
('governed_by','governance','ÄÆ°á»£c quáº£n trá»‹ bá»Ÿi','Governed by','Quáº£n trá»‹','Governs',array['process'],array['document','business_role']),
('uses_system','impact','Sá»­ dá»¥ng há»‡ thá»‘ng','Uses system','ÄÆ°á»£c sá»­ dá»¥ng bá»Ÿi','Used by',array['process'],array['system']),
('addresses_risk','impact','Xá»­ lÃ½ rá»§i ro','Addresses risk','ÄÆ°á»£c xá»­ lÃ½ bá»Ÿi','Addressed by',array['process'],array['risk']),
('influences_kpi','impact','áº¢nh hÆ°á»Ÿng KPI','Influences KPI','ÄÆ°á»£c áº£nh hÆ°á»Ÿng bá»Ÿi','Influenced by',array['process'],array['kpi']),
('related_to','general','LiÃªn quan Ä‘áº¿n','Related to','LiÃªn quan Ä‘áº¿n','Related to',array[]::text[],array[]::text[])
on conflict(code) do nothing;

create sequence public.document_code_seq start 1;
create table public.documents (
  id uuid primary key default gen_random_uuid(), document_code text not null unique default ('DOC-' || lpad(nextval('public.document_code_seq')::text,6,'0')),
  archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.document_versions (
  id uuid primary key default gen_random_uuid(), document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer not null check(version_number > 0), status public.process_version_status not null default 'draft',
  title_vi text not null, title_en text, document_group text not null, document_type_value_id uuid references public.vocabulary_values(id),
  language text not null default 'vi', document_abstract text, access_level public.access_level not null default 'internal',
  allowed_roles public.system_role[] not null default array['viewer','editor','admin']::public.system_role[], change_summary text not null default '',
  valid_from date, valid_until date, review_due_at date, created_by uuid references public.profiles(id),
  submitted_at timestamptz, submitted_by uuid references public.profiles(id), approved_at timestamptz, approved_by uuid references public.profiles(id),
  published_at timestamptz, published_by uuid references public.profiles(id), supersedes_version_id uuid references public.document_versions(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(document_id, version_number),
  check(valid_until is null or valid_from is null or valid_until >= valid_from)
);
create table public.document_process_links (
  id uuid primary key default gen_random_uuid(), document_version_id uuid not null references public.document_versions(id) on delete cascade,
  process_id uuid not null references public.processes(id) on delete cascade, process_version_id uuid references public.process_versions(id),
  link_role public.document_link_role not null, unique(document_version_id, process_id, link_role)
);
create table public.document_files (
  id uuid primary key default gen_random_uuid(), document_version_id uuid not null references public.document_versions(id) on delete cascade,
  storage_bucket text not null default 'process-documents', storage_key text not null unique, original_file_name text not null,
  mime_type text not null check(mime_type in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','image/png','image/jpeg')),
  size_bytes bigint not null check(size_bytes > 0 and size_bytes <= 26214400), checksum_sha256 text not null check(checksum_sha256 ~ '^[0-9a-fA-F]{64}$'),
  uploaded_by uuid not null references public.profiles(id), uploaded_at timestamptz not null default now()
);

create table public.review_requests (
  id uuid primary key default gen_random_uuid(), object_type public.review_object_type not null, object_id uuid not null,
  submitted_by uuid not null references public.profiles(id), assigned_admin_id uuid references public.profiles(id), status public.review_status not null default 'open',
  decision_reason text, created_at timestamptz not null default now(), decided_at timestamptz,
  check(status <> 'rejected' or nullif(trim(decision_reason),'') is not null)
);
create table public.comment_threads (
  id uuid primary key default gen_random_uuid(), context_type text not null check(context_type in ('review','finding')), context_id uuid not null,
  anchor text, is_resolved boolean not null default false, created_at timestamptz not null default now()
);
create table public.comments (
  id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.comment_threads(id) on delete cascade,
  parent_comment_id uuid references public.comments(id), author_id uuid not null references public.profiles(id), body text not null check(length(trim(body)) > 0),
  is_decision boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.comment_mentions (comment_id uuid references public.comments(id) on delete cascade, profile_id uuid references public.profiles(id) on delete cascade, primary key(comment_id, profile_id));
create table public.reading_assignments (
  id uuid primary key default gen_random_uuid(), object_type public.review_object_type not null, object_id uuid not null,
  profile_id uuid not null references public.profiles(id), required boolean not null default true, assigned_at timestamptz not null default now(), due_at timestamptz,
  unique(object_type, object_id, profile_id)
);
create table public.reading_acknowledgments (assignment_id uuid primary key references public.reading_assignments(id) on delete cascade, acknowledged_at timestamptz not null default now());

create or replace function public.validate_document_publication() returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if new.status in ('scheduled','effective') then
    if new.valid_from is null or new.review_due_at is null then raise exception 'Publication requires valid_from and review_due_at'; end if;
    if not exists(select 1 from public.document_process_links l where l.document_version_id=new.id) then raise exception 'Document publication requires a process link'; end if;
    if exists(select 1 from public.document_versions d where d.document_id=new.document_id and d.id<>new.id and d.status='effective' and daterange(coalesce(d.valid_from,'-infinity'::date),coalesce(d.valid_until,'infinity'::date),'[]') && daterange(new.valid_from,coalesce(new.valid_until,'infinity'::date),'[]')) then raise exception 'Overlapping effective document versions are not allowed'; end if;
  end if;
  if new.approved_by is not null and new.approved_by = new.created_by then raise exception 'Last author cannot approve own document version'; end if;
  return new;
end $$;
create trigger document_versions_publication before insert or update on public.document_versions for each row execute function public.validate_document_publication();

create or replace function public.process_completeness(p_version_id uuid) returns jsonb language sql stable security invoker set search_path=public as $$
  select jsonb_build_object('score', round(100.0 * filled / total), 'filled', filled, 'total', total)
  from (select 13 total, num_nonnulls(name_vi,purpose,description,scope_in,scope_out,trigger,outcome,business_purpose,scope_and_boundaries,process_at_a_glance,critical_decision_points,accountability_and_impact,review_due_at) filled from public.process_versions where id=p_version_id) s
$$;

insert into public.vocabularies(code,name,is_system) values
('document_type','Document type',true),('legal_entity','Legal entity',true),('department','Department',true),('location','Location',true),('channel','Channel',true),('product_service','Product/service',true),('employee_audience','Employee audience',true)
on conflict(code) do nothing;
insert into public.vocabulary_values(vocabulary_id,code,label_vi,label_en,display_order)
select v.id,x.code,x.vi,x.en,x.ord from public.vocabularies v cross join (values
('policy','ChÃ­nh sÃ¡ch','Policy',1),('procedure','Quy trÃ¬nh','Procedure',2),('work_instruction','HÆ°á»›ng dáº«n cÃ´ng viá»‡c','Work Instruction',3),('form_template','Biá»ƒu máº«u','Form/Template',4),('audit_report','BÃ¡o cÃ¡o kiá»ƒm toÃ¡n','Audit Report',5),('training_material','TÃ i liá»‡u Ä‘Ã o táº¡o','Training Material',6)
) x(code,vi,en,ord) where v.code='document_type' on conflict(vocabulary_id,code) do nothing;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('process-documents','process-documents',false,26214400,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.openxmlformats-officedocument.presentationml.presentation','image/png','image/jpeg']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

do $$ declare t text; begin
  foreach t in array array['process_aliases','process_assignments','vocabularies','vocabulary_values','object_applicability','systems','risks','kpis','business_roles','business_objects','relationship_types','object_relationships','process_business_object_flows','documents','document_versions','document_process_links','document_files','review_requests','comment_threads','comments','comment_mentions','reading_assignments','reading_acknowledgments'] loop execute format('alter table public.%I enable row level security',t); end loop;
end $$;
do $$ declare t text; begin
  foreach t in array array['process_aliases','process_assignments','vocabularies','vocabulary_values','object_applicability','systems','risks','kpis','business_roles','business_objects','relationship_types','object_relationships','process_business_object_flows','documents','document_versions','document_process_links','document_files','review_requests','comment_threads','comments','comment_mentions','reading_assignments','reading_acknowledgments'] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select public.current_profile_role()) is not null)','active users read '||t,t);
    execute format('grant select on public.%I to authenticated',t);
    execute format('revoke all on public.%I from anon',t);
  end loop;
end $$;
create policy "editors upload process documents" on storage.objects for insert to authenticated with check(bucket_id='process-documents' and (select public.current_profile_role()) in ('editor','admin'));
create policy "active users read process documents" on storage.objects for select to authenticated using(bucket_id='process-documents' and (select public.current_profile_role()) is not null);

