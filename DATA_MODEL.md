# Process Map — Data Model

## 1. Modeling principles

1. Keep APQC reference data immutable and separate from enterprise data.
2. Version process and document content; keep stable object identities.
3. Use many-to-many mapping between enterprise processes and APQC elements.
4. Represent object links as canonical directed relationships with derived inverse labels.
5. Use controlled vocabularies instead of free-text statuses and relationship types.
6. Keep applicability separate from authorization.
7. Use UUID primary keys internally and human-readable generated codes externally.
8. Enforce authorization and storage access with RLS and server-side checks.

## 2. Identity and access

### `profiles`

- `id uuid` — references `auth.users`.
- `display_name text`
- `system_role enum(viewer, editor, admin)`
- `is_active boolean`
- timestamps

Exactly six demo profiles are seeded outside public source control credentials.

### `object_assignments`

Assign users to governed object roles.

- `id uuid`
- `object_type enum(process, document)`
- `object_id uuid`
- `profile_id uuid`
- `assignment_role enum(creator, owner, steward, sme, approver, required_reader, interested_reader)`
- timestamps
- unique object/user/role constraint

## 3. APQC reference model

### `apqc_framework_versions`

- `id uuid`
- `name text`
- `version text` — `8.0`
- `generated_on date`
- `compared_to_version text`
- `source_name text`
- `attribution_notice text`
- `is_active boolean`

### `apqc_elements`

- `id uuid`
- `framework_version_id uuid`
- `pcf_id integer`
- `hierarchy_id text`
- `level smallint` — 1..5
- `name text`
- `description text`
- `parent_id uuid nullable`
- `display_order integer`
- `difference_index integer nullable`
- `change_details text nullable`
- `metrics_available boolean`
- unique `(framework_version_id, pcf_id)`
- unique `(framework_version_id, hierarchy_id)`

### `apqc_metrics`

- `id uuid`
- `framework_version_id uuid`
- `apqc_element_id uuid`
- `metric_id integer`
- `category text`
- `name text`
- `formula text nullable`
- `unit text nullable`
- unique `(framework_version_id, metric_id)`

## 4. Enterprise process model

### `processes`

Stable identity.

- `id uuid`
- `process_code text` — generated, e.g. `PROC-000123`
- `source_code text nullable`
- `parent_process_id uuid nullable`
- `level_type enum(value_chain, e2e, process, subprocess, activity, task)`
- `display_order integer`
- `archived_at timestamptz nullable`
- timestamps

Parent links form the enterprise hierarchy. Prevent cycles at the database/service layer.

### `process_aliases`

- `id uuid`
- `process_id uuid`
- `alias_type enum(code, name)`
- `alias_value text`
- `locale text nullable`

### `process_versions`

- `id uuid`
- `process_id uuid`
- `version_number integer`
- `status enum(draft, in_review, rejected, approved, scheduled, effective, cancelled, superseded, archived)`
- `name_vi text`
- `name_en text nullable`
- `purpose text`
- `description text`
- `scope_in text`
- `scope_out text`
- `trigger text`
- `outcome text`
- `business_purpose text nullable`
- `scope_and_boundaries text nullable`
- `process_at_a_glance text nullable`
- `critical_decision_points text nullable`
- `accountability_and_impact text nullable`
- `access_level enum(internal, limited, confidential, highly_restricted)`
- `allowed_roles system_role[]`
- `change_summary text`
- `valid_from date nullable`
- `valid_until date nullable`
- `review_due_at date nullable`
- submitted/approved/published timestamps and actors
- `supersedes_version_id uuid nullable`
- timestamps
- unique `(process_id, version_number)`

Enforce at most one effective version for a business date and no overlapping effective intervals.

### `process_apqc_mappings`

- `id uuid`
- `process_version_id uuid`
- `apqc_element_id uuid`
- `mapping_role enum(primary, supporting, step)`
- `match_type enum(exact, partial, broader, narrower, related)`
- `status enum(proposed, verified, rejected)`
- `rationale text`
- `verified_by uuid nullable`
- `verified_at timestamptz nullable`
- unique mapping tuple

### `process_metric_selections`

- `id uuid`
- `process_version_id uuid`
- `apqc_metric_id uuid nullable`
- `kpi_id uuid nullable`
- `selection_reason text nullable`

No actual KPI observations are stored in the MVP.

## 5. Applicability and controlled vocabularies

### `vocabularies`

- `id uuid`
- `code text unique`
- `name text`
- `is_system boolean`

### `vocabulary_values`

- `id uuid`
- `vocabulary_id uuid`
- `code text`
- `label_vi text`
- `label_en text nullable`
- `parent_value_id uuid nullable`
- `display_order integer`
- `is_active boolean`
- unique `(vocabulary_id, code)`

Initial vocabularies include legal entity, department, location, channel, product/service, employee audience, document type, finding type, severity, priority, and resolution type.

### `object_applicability`

- `id uuid`
- `object_type enum(process_version, document_version)`
- `object_id uuid`
- `dimension enum(legal_entity, department, location, channel, product_service, system, employee_audience, exception)`
- `vocabulary_value_id uuid nullable`
- `system_id uuid nullable`
- `free_text text nullable`
- `is_inherited boolean`
- `inherited_from_object_id uuid nullable`

## 6. Documents and storage

### `documents`

- `id uuid`
- `document_code text unique`
- `archived_at timestamptz nullable`
- timestamps

### `document_versions`

- `id uuid`
- `document_id uuid`
- `version_number integer`
- shared lifecycle status enum
- `title_vi text`
- `title_en text nullable`
- `document_group text` — derived automatically from the selected type, or retained from the saved group for a legacy untyped draft (no independent selector)
- `document_type_value_id uuid` — optional on drafts; chosen vocabulary value maps to a group through `vocabulary_values.document_group_code`
- `language text`
- `document_abstract text nullable`
- `access_level access_level`
- `allowed_roles system_role[]`
- `change_summary text`
- validity/review/submission/approval/publication fields
- `supersedes_version_id uuid nullable`
- timestamps

### `document_process_links`

- `id uuid`
- `document_version_id uuid`
- `process_id uuid`
- `process_version_id uuid nullable`
- `link_role enum(primary, supporting, evidence, reference)`

At least one process link is required before document publication.

### `document_files`

- `id uuid`
- `document_version_id uuid`
- `storage_bucket text`
- `storage_key text unique`
- `original_file_name text`
- `mime_type text`
- `size_bytes bigint`
- `checksum_sha256 text`
- `uploaded_by uuid`
- `uploaded_at timestamptz`

Private bucket only. Never store a permanent public URL.

## 7. Context objects

Use lightweight catalog tables with a common shape where practical.

### `systems`

- `id uuid`, `code`, `name`, `description`, `owner_text`, `is_active`

### `risks`

- `id uuid`, `code`, `name`, `description`, `rating`, `owner_text`, `is_active`

### `kpis`

- `id uuid`, `code`, `name`, `description`, `unit`, `owner_text`, `is_active`

### `business_roles`

- `id uuid`, `code`, `name`, `description`, `is_active`

### `business_objects`

- `id uuid`
- `code text unique`
- `name text`
- `object_type enum(document, data_record, decision_approval, event_trigger, material_product, service_deliverable)`
- `description text nullable`
- `is_active boolean`

## 8. Relationships

### `relationship_types`

- `id uuid`
- `code text unique`
- `group_code enum(structure, execution, governance, ownership, knowledge, impact, evidence, lifecycle, delivery, general)`
- `label_vi text`
- `label_en text`
- `inverse_label_vi text`
- `inverse_label_en text`
- `is_directed boolean`
- `allowed_source_types text[]`
- `allowed_target_types text[]`
- `is_active boolean`

### `object_relationships`

- `id uuid`
- `source_type enum(process, document, business_object, system, risk, kpi, business_role, finding)`
- `source_id uuid`
- `target_type` — same enum
- `target_id uuid`
- `relationship_type_id uuid`
- `label text nullable`
- `description text nullable`
- `status enum(proposed, verified, rejected)`
- `valid_from date nullable`
- `valid_until date nullable`
- `evidence_text text nullable`
- `created_by`, `updated_by`, `verified_by`
- timestamps

Relationships represent current state in the MVP. Temporal history is deferred.

### Role-to-document knowledge classification (2026-10-21)

- **Source**: `object_relationships.source_type='business_role'` and `source_id=business_roles.id`; **target**: `target_type='document'`, `target_id=documents.id` (stable identity, not a version).
- **Three verified relationship types**: `role_must_know_document` (Phải biết), `role_should_know_document` (Nên biết), and `role_not_applicable_document` (Không áp dụng). All are in the `knowledge` relationship group and restrict source/target to business_role → document.
- **Chưa xác định / Unclassified**: no verified knowledge relationship for that business role/document; never equate this with Not Applicable.
- **Selection rule**: Tab 02 sends a multi-select classification mapping of active role UUID to one level (`must`, `should`, `none`). No role may occupy two levels on the same document. Roles omitted from the payload become unclassified.
- **Write function**: `public.set_document_knowledge_audience(p_document_id uuid, p_assignments jsonb)` is `SECURITY INVOKER`, callable by `authenticated` but checks an active **Admin** via `current_profile_role()`; also checks active business roles and a draft/rejected version. It atomically rejects superseded verified mappings, reactivates an existing canonical mapping or inserts a new verified link, and keeps unchanged mappings. Its writes remain subject to table RLS and relationship constraints/triggers.
- **Validation/evidence**: confirmed relations require description and evidence/source; the function supplies classification evidence and audit fields. Marked-rejected rows are retained, not deleted; this is **not** a full immutable event audit.
- **Consumption**: Tab 05 `/role-knowledge` and Tab 02 library cards use verified classification. It does **not** change document/Storage permissions, issue individual `reading_assignments`, send notifications, or set `reading_acknowledgments`.
- **Migration**: `supabase/migrations/20261021104055_document_knowledge_audience.sql` applied to the current APQC project.

### Controlled document type naming and derived group (2026-10-21)

- Migration `supabase/migrations/20261021110248_normalize_document_type_labels.sql` updates nine `vocabulary_values.label_vi` descriptions under the `document_type` vocabulary; it preserves all 23 rows' UUIDs, `code`, `document_group_code`, active flags, order, and existing foreign-key links.
- The UI maps stable group codes to human-readable labels through `src/lib/document-display.ts`; it maps stable status, access, language and risk enum codes to Vietnamese text without writing translated values to persisted enum fields.
- `document_versions.document_group` can include legacy mixed-case group codes. The Document group filter uses case-insensitive `.ilike()` to match those saved values. A group is derived from the selected type on document editing; a draft with no type retains its preexisting group value. New untyped drafts remain stored as `other` and the intake display says `Chưa phân loại` until a type is chosen.
- Date columns remain ISO dates in PostgreSQL. Document cards and comparison render DD/MM/YYYY without altering stored values.

### `process_business_object_flows`

Optional specialized table if graph/query ergonomics require it; otherwise represent through `object_relationships`.

- `process_id uuid`
- `business_object_id uuid`
- `direction enum(input, output)`
- `description text nullable`

Avoid keeping both representations without a single source of truth.

## 9. Review, comments, and acknowledgment

### `review_requests`

- `id uuid`
- `object_type enum(process_version, document_version)`
- `object_id uuid`
- `submitted_by uuid`
- `assigned_admin_id uuid nullable`
- `status enum(open, approved, rejected, cancelled)`
- `decision_reason text nullable`
- timestamps

Enforce last-author and approver separation.

### `comment_threads`

- `id uuid`
- `context_type enum(review, finding)`
- `context_id uuid`
- `anchor text nullable`
- `is_resolved boolean`
- timestamps

### `comments`

- `id uuid`
- `thread_id uuid`
- `parent_comment_id uuid nullable`
- `author_id uuid`
- `body text`
- `is_decision boolean`
- timestamps

### `comment_mentions`

- `comment_id uuid`
- `profile_id uuid`

### `reading_assignments`

- `id uuid`
- `object_type enum(process_version, document_version)`
- `object_id uuid`
- `profile_id uuid`
- `required boolean`
- `assigned_at timestamptz`
- `due_at timestamptz nullable`

### `reading_acknowledgments`

- `assignment_id uuid unique`
- `acknowledged_at timestamptz`

## 10. Findings & Actions

### `findings`

- `id uuid`
- `finding_code text unique` — generated `FND-000123`
- `title text`
- `description text`
- `finding_type_value_id uuid`
- `severity enum(low, medium, high, critical)`
- `priority enum(low, medium, high, urgent)`
- `status enum(new, triage, in_progress, pending_decision, resolved, closed, reopened)`
- `created_by uuid`
- `assignee_id uuid nullable`
- `due_at timestamptz`
- `resolution_type_value_id uuid nullable`
- `resolution_summary text nullable`
- `resolved_at`, `closed_at`
- timestamps

### `finding_links`

- `id uuid`
- `finding_id uuid`
- `object_type text` (CHECK-constrained to `process | process_version | document | document_version | relationship | apqc_element`)
- `object_id uuid`
- `link_role enum(subject, evidence, resolution)`
- `evidence_excerpt text nullable`

### `finding_participants`

- `finding_id uuid`
- `profile_id uuid`
- `participant_role enum(participant, watcher)`

### `finding_reactions`

- `finding_id uuid`
- `profile_id uuid`
- `reaction enum(agree, disagree, need_more_information)`
- unique `(finding_id, profile_id)`

### `finding_events`

This is a scoped activity timeline even though a full platform audit trail is deferred.

- `id uuid`
- `finding_id uuid`
- `event_type text`
- `actor_id uuid`
- `from_value jsonb nullable`
- `to_value jsonb nullable`
- `created_at timestamptz`

Default due dates derive from severity: Critical 2 days, High 7, Medium 14, Low 30. Explicit due dates override defaults.


### `finding_actions` (Document corrective-action tracker)

- `id uuid` — primary key
- `finding_id uuid` — linked finding with cascading removal
- `action_title text`, optional `description text`
- `assignee_id uuid nullable`, `due_at date nullable`
- `status text` — `todo | in_progress | blocked | done | cancelled`
- `progress_percent integer` — 0–100, 100 on completion
- `last_update text nullable`, `completion_evidence text nullable`
- `created_by uuid`; `created_at`, `updated_at`, `completed_at` timestamps
- `done` requires `progress_percent=100` and nonempty `completion_evidence`; `blocked` requires a nonempty `last_update`; progress is restricted to 0–100.
- Insert/update action triggers append `action_created` / `action_updated` rows to `finding_events` for audit-style timeline visibility.
- RLS: read requires visibility of parent finding; Editor/Admin write operations are checked against owner/assignee relationships. Cross-document findings, related actions and evidence are currently not exposed to Viewer.

Additional `findings` columns:

- `finding_domain text` — `general | document` (legacy defaults to general).
- `action_decision text` — `pending | required | not_required`.
- `action_decision_reason text nullable` — required for `not_required`.
- `impact_summary text nullable` — explicit operational implication.
- `finding_links` associates multiple concrete `document_version` rows with per-version evidence.
- Tab 06 shows only `finding_domain=document` rows whose `finding_links` contain at least **two distinct `document_versions.document_id`** values as `object_type=document_version, link_role=subject`. Two versions of the same `documents.id` do not count. This is checked in the Server Action for **all** finding types and at the database **resolution/closure** gate. Generic and single-document findings are preserved outside the tab.
- The two-step Server Action creates the finding row before inserting evidence links. Therefore the database resolution/closure trigger guards final states; initial creation relies on server validation and may leave a new unlinked record if linking fails. Do not describe this as a database-enforced all-states invariant.

The document-finding action-decision/completion and two-distinct-documents closure guards are enforced by database triggers, separate from legacy generic finding workflow. Migrations `20261021000027`–`20261021000029` implement the tracker/history/RLS; `20261021000033` enforces distinct document identities at closure. No automated document-content comparison is part of this model.

### Document finding DEMO seed and lineage

- `20261021073426_seed_document_findings_demo.sql` is idempotent using `DEMO-FND-DOC-01..16` codes and `[DEMO 06/F01..F08]` finding titles; migrations `31` and `32` complete/clean up contextual enterprise-process evidence.
- Eight manual finding examples refer to 16 distinct draft-only document identities with 16 linked `subject` version evidence records, 10 example actions, and existing process catalog `PROC-000011..PROC-000020`. These evidence snippets and conflicts are fictional and not file-analysis output.
- Opt-in cleanup: `scripts/delete-demo-document-findings.sql`. Do not delete real document versions or relabel DEMO data as verified findings.

## 11. Notifications

### `notifications`

- `id uuid`
- `recipient_id uuid`
- `type text`
- `title text`
- `body text`
- `object_type text nullable`
- `object_id uuid nullable`
- `deep_link text nullable`
- `read_at timestamptz nullable`
- `created_at timestamptz`

## 12. Governance views/functions

Prefer SQL views or stable database functions for dashboard calculations:

- `process_completeness_view`
- `process_review_status_view`
- `apqc_coverage_view`
- `reading_completion_view`
- `finding_dashboard_view`
- `finding_aging_view`

Completeness must expose component scores and missing fields, not only a total.

## 13. RLS summary

### Viewer

- Select effective process versions and document-version workflow statuses permitted by `allowed_roles`; access classifications remain enforced, writes stay denied, and private files use authenticated signed URLs.
- Select APQC reference data and permitted catalog/context data.
- Insert own acknowledgment.
- Select/comment/react on findings where permitted.

### Editor

- Viewer rights.
- Create process/document stable objects and drafts.
- Update drafts when assigned Creator/Owner/Steward/SME.
- Submit review requests.
- Create and work findings according to workflow.
- Cannot approve/publish.

### Admin

- Full application data rights through policies/server actions.
- May classify active business roles for editable document identities with the governed Admin-only function; Viewer/Editor cannot write knowledge assignments.
- Approval must enforce separation from the last author.
- Storage access still uses scoped server-generated signed URLs.

Service-role credentials never reach the client.

## 14. Deferred model extensions

- Fine-grained business-unit/individual ACL.
- Relationship temporal history.
- Full immutable audit log.
- AI extraction chunks, embeddings, and analysis runs.
- Operational KPI observations and targets.
- Retention/legal-hold workflow.
- General custom-field definitions and values.

### Governed issue taxonomy (2026-10-22)

`issue_taxonomy` stores the fixed 11-code issue classification: `code`, group code/label, type label, explanation, diagnostic order/question, minimum evidence and active state. Authenticated active users may read it; anonymous access is denied.

`findings` additionally stores `primary_issue_code` (FK), `secondary_issue_codes` (tags only), `classification_rationale`, `decision_point`, `evidence_status`, `proposed_action`, `owner_question`, and `process_owner_feedback`. Existing `finding_type_value_id` is retained for historical compatibility and is not rewritten by the migration.
## Atomic document and finding mutations — 2026-10-27

Production migrations `20261027004304`–`20261027004641` establish the current access and transaction boundary:

- `document_versions` SELECT is independent of lifecycle status but remains constrained by `allowed_roles`; Admin can read all rows and an Editor can additionally read versions they created or own.
- `create_document_draft_atomic(jsonb, uuid, jsonb, uuid[], jsonb)` creates the stable document, draft version, primary process link, applicability, tags and Admin-managed knowledge audience in one transaction.
- `update_document_metadata_atomic(uuid, jsonb, uuid, jsonb, uuid[], jsonb)` locks the editable version and replaces its governed metadata/links atomically.
- `create_document_finding_atomic(jsonb, uuid[], uuid)` validates 2–20 visible versions representing at least two stable document identities, then inserts the Finding and evidence/process links atomically.
- `create_finding_action_atomic(uuid, text, text, uuid, date)` locks the Finding, records the required-action decision and creates the Action atomically.
- All four functions are `SECURITY INVOKER`, have `search_path = ''`, are executable by `authenticated` only, and retain RLS/role checks. No service-role path is used by the application.
- Foreign-key covering indexes reported by Supabase are present. Newly created indexes may be reported as unused until normal traffic exercises their query paths; removal requires measured evidence, not an immediate post-create Advisor result.

## Home dashboard aggregate contract — 2026-10-29

**Migration:** `supabase/migrations/20261029000001_home_document_finding_summary.sql` registers `public.home_document_finding_summary(p_from_date date,p_to_date date) RETURNS jsonb`.

- **Security:** `STABLE SECURITY INVOKER` with empty `search_path`, explicit active authenticated profile check through `auth.uid()` and `current_profile_role()`. EXECUTE granted to `authenticated` only, revoked from PUBLIC and anon. Reads base tables via their RLS policies; no service-role access, materialized public report table or elevated rights. Viewer can receive different totals than Admin.
- **Bounds:** dates are inclusive in `Asia/Ho_Chi_Minh`; the API converts the end date to an exclusive next-day timestamp. Reject missing, reversed, future and >366-day windows.
- **Grain and joins:** new document count uses a distinct `documents.id` created in the period with one RLS-visible `document_versions` row selected by ascending version. Uploaded-file count uses `document_files.id` and distinct uploaded document count uses `document_versions.document_id`. Both use the actual file upload timestamp. Department count uses the first RLS-visible version's `issuing_department`; group by lowercased trimmed name and retain an explicit missing bucket.
- **Finding measures:** detected uses `findings.created_at`, `finding_domain='document'`. Remediated uses `status IN ('resolved','closed')` with `action_decision='required'` and date `COALESCE(resolved_at,closed_at)`. Current backlog uses unresolved document-finding statuses, while action-overdue is based on `finding_actions.due_at` and unfinished action status at query time.
- **JSON keys:** `from_date`, `to_date`, `new_documents`, `files_uploaded`, `documents_with_files`, `findings_found`, `findings_remedied`, `without_department`, `open_findings_now`, `overdue_actions_now`, `departments:[{name,count}]`, `finding_statuses:[{status,count}]`, `timeline:[{date,documents,files,found,remedied}]`. Aggregates are source-backed and do not include restricted file names or finding text.
- **No semantic conflation:** `documents.created_at` is metadata registration, NOT binary upload; `document_files.uploaded_at` represents actual files. A finding resolved with no remedial action is not a "khắc phục" event. Current unresolved counts are not period-end historical stock levels.
- **Validation:** 2026-10-29 simulation under Admin and Viewer; counts reconcile for daily trend and by department. Existing document/finding records are not mutated by the reporting migration.

## Executive APQC L1–L3 hierarchy report — 2026-10-29

**Migration:** `supabase/migrations/20261029000002_home_executive_apqc_hierarchy.sql`; **function:** `public.home_apqc_hierarchy_summary() RETURNS jsonb`, `STABLE SECURITY INVOKER`, `search_path=''`, `EXECUTE` for authenticated only (not anon/PUBLIC). Uses the caller's RLS policy on `document_versions`, `document_apqc_mappings` and `apqc_elements`.

- **Canonical framework filter:** `apqc_frameworks.name='APQC catalogue with controlled PNJ interpretation'` AND `version='Process Map workbook 2026-10-29'`. Prevents combining the duplicate PCF Cross-Industry baseline with the PNJ interpretation. The two frameworks have separate UUIDs but matching L1–L3 taxonomy.
- **Hierarchy grain:** `apqc_elements` with `level_number` 1→2→3 and `parent_id`. Levels: 13/74/362. Do not count lower-level L4/L5 for this executive APQC hierarchy report.
- **Mapping grain:** distinct `document_versions.document_id` linked by `document_apqc_mappings.document_version_id` and `apqc_element_id` directly to a L3. A L3 is "mapped" if at least one caller-visible document identity is linked. L2/L1 report L3 coverage rolled up from their own children and distinct document counts across the child set.
- **Output:** `framework,framework_version,total_l1,total_l2,total_l3,mapped_l3,mapped_documents`; `level1:[{id,code,name,total_l2,total_l3,mapped_l3,documents}]`, `level2:[{id,parent_id,code,name,total_l3,mapped_l3,documents}]`, `level3:[{id,parent_id,code,name,documents}]`.
- **Metric note:** `mapped_l3 / total_l3` is direct document-to-L3 mapping coverage. It says nothing about compliance, review status or policy application. `mapped_documents` counts each document identity only once overall; L1/L2 document totals may overlap across categories where one document maps to multiple nodes.
- **Temporal separation:** this is a **current cumulative** APQC reporting surface independent of `home_document_finding_summary(date,date)` and its selected activity period.
- **Validation:** Admin + Viewer transaction-scoped SQL read, 13/74/362 levels, 68 mapped L3 and 1,149 mapped document identities. L1/L2/L3 mapped-level totals reconcile; anon function EXECUTE is denied. No source business rows mutated.

### Home APQC distribution retirement (2026-10-29)

- The previously applied `public.home_apqc_hierarchy_summary()` and its migration remain in PostgreSQL to avoid a destructive production rollback, but **Tab 01 no longer calls this function** or loads the full hierarchy and its RLS-scoped mapping totals.
- The compact APQC inventory line in the executive header now performs an RLS-aware read of `apqc_frameworks.id`, strictly filtered to `name='APQC catalogue with controlled PNJ interpretation'` and `version='Process Map workbook 2026-10-29'`, followed by `apqc_elements.level_number <= 3`. This is *only* a count of reference nodes at L1/L2/L3; it does not join `document_apqc_mappings` or expose mapping counts.
- No schema changes, data deletes, permission changes, or changes to `home_document_finding_summary()`. The Document/Finding time-series still uses the period filter and the existing RLS policies.
