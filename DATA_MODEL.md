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
- `document_group text`
- `document_type_value_id uuid`
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
- `object_type enum(process, process_version, document, document_version, relationship)`
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
- `created_by uuid`, created/updated/completed timestamps
- RLS: visible finding required for reads, Admin/Editor with finding-owner or action-owner authorization for writes

Additional `findings` columns:

- `finding_domain text` — `general | document` (legacy defaults to general).
- `action_decision text` — `pending | required | not_required`.
- `action_decision_reason text nullable` — required for `not_required`.
- `impact_summary text nullable` — explicit operational implication.
- `finding_links` associates multiple concrete `document_version` rows with per-version evidence.

The document-finding closure gate is enforced by a database trigger, separately from the existing generic finding workflow. No automated document-content comparison is part of this model.

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

- Select effective process/document versions allowed to Viewer.
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
