# Process Map — Product Requirements Document

## 1. Product summary

Process Map is a desktop-first internal web application for discovering, understanding, governing, and maintaining enterprise processes aligned to the APQC Process Classification Framework (PCF) v8.0.

The product is process-first. APQC provides a stable reference taxonomy and metric definitions; enterprise processes represent how the organization actually works. Documents, relationships, business objects, findings, ownership, applicability, approvals, and validity are managed around those enterprise processes.

## 2. Product goals

1. Let a user understand a process and its position in the enterprise hierarchy quickly.
2. Provide progressive drill-down across process levels without rendering an unreadable enterprise-wide graph.
3. Explain each process in approximately 60 seconds through a structured executive summary.
4. Show inbound, outbound, governance, dependency, and contextual relationships.
5. Map real processes to APQC using traceable many-to-many mappings.
6. Govern process and document versions through review, approval, publication, validity, and acknowledgment.
7. Surface metadata quality, overdue reviews, APQC coverage, unresolved findings, and other governance signals.
8. Demonstrate collaboration around duplicate, overlap, conflict, and supersession findings.

## 3. Non-goals for the MVP

- Mobile UI.
- BPMN modeling or editing.
- Full-text search inside uploaded files.
- AI-generated overlap/conflict findings.
- OCR or general PDF/DOCX import.
- Production SSO or Microsoft Entra ID.
- Actual operational KPI values and performance analytics.
- Full audit-trail product and retention policy.
- Custom metadata-field builder.
- Saved views, bookmarks, bulk export, or offline support.
- Relationship history/versioning.

## 4. Users and permissions

The current MVP has six active demo accounts: **three Admin and three Viewer**. No Editor account is currently provisioned; Editor-role end-to-end acceptance remains outstanding.

### Viewer

- View process content permitted by publication rules. Read document workflow statuses allowed to the user's system role, including draft and in-review records where `allowed_roles` permits; private files still require an authenticated short-lived signed URL.
- Browse maps, catalog, APQC references, metrics, and permitted findings.
- Receive in-app notifications.
- Confirm required reading for a specific version.
- Comment/react on findings when participating.

### Editor

- All Viewer capabilities.
- Create enterprise processes and documents.
- Edit content when assigned as Creator, Owner, Steward, or SME.
- Manage draft metadata, mappings, business objects, and relationships.
- Submit drafts for review.
- Create findings, take assignments, comment, and move findings to `Resolved`.
- Cannot approve their own last-authored change.

### Admin

- Full repository visibility and administration.
- Review, reject, approve, schedule, publish, supersede, or archive versions.
- Close findings and reopen closed findings.
- Manage the six demo users and controlled vocabularies.
- Manage APQC import and reference data.

Authorization must be enforced by Supabase RLS. UI hiding is not sufficient.

## 5. Source data

### APQC baseline

- Source: licensed APQC Cross-Industry PCF Excel v8.0 supplied outside the repository.
- Verified source shape: 2,017 APQC elements across five levels, 13 top-level categories, complete descriptions, and 3,284 metric definitions.
- Keep the source workbook outside Git.
- Preserve PCF IDs, hierarchy IDs, source names, descriptions, version, metrics, and attribution.
- APQC reference data is read-only in the product.

### Enterprise sample data

- Current controlled dataset after the Process Map workbook import: 44 enterprise process records, including the existing 11-node installment hierarchy and 33 additional process identities.
- The source workbook contributes only rows classified as `Quy Trình`; non-process document rows are not converted into enterprise processes.
- Source-backed metadata includes process code/name, drafting department/unit, effective date, source review count, and the APQC L0/L1 path. Unknown process content remains visibly incomplete.
- The source workbook remains outside Git; the versioned migration contains only the governed process rows needed by the application.

## 6. Information architecture

Primary workspace navigation is numbered and appears in this order:

1. **01. Home** (`/`) — role-specific dashboard.
2. **02. Document** (`/documents`) — private document library, versions, upload, metadata, and reading assignments.
3. **03. Process Map** (`/process-map`) — enterprise landscape, layered hierarchy, and APQC reference view.
4. **04. Relationship** (`/relationships`) — governed cross-object relationship network.
5. **05. Vai trò của tôi** (`/role-knowledge`) — required/reference knowledge linked to business roles.
6. **06. Finding & Action** (`/findings`) — cross-document duplication/overlap/conflict issues and corrective actions.
7. **07. Catalog** (`/catalog`) — enterprise processes and APQC reference search.
8. **08. Governance** (`/governance`) — completeness, reviews, validity, acknowledgment, and APQC coverage.
9. **09. Action Log** (`/notifications`) — in-app action history and notifications.

The Action Log keeps the existing `/notifications` route, notification records, read/unread state, deep links, and RLS. Review and Admin capabilities remain permission-aware actions within the relevant workspaces rather than separate top-level tabs in the current MVP.

## 7. Process Map experience

### Enterprise Landscape

- Enterprise hierarchy is the default view.
- Top-level nodes show code, name, level/type, owner, lifecycle status, child count, document count, open-finding count, and review-overdue indicator.
- APQC Reference View is available as a separate mode and shows enterprise-process coverage per APQC element.

### APQC-led landscape convention

- L0 renders APQC PCF level-1 Categories directly from the immutable reference dataset.
- L1 renders APQC PCF level-2 Process Groups for the selected L0 Category.
- L2 renders enterprise process records mapped to the selected APQC level-2 Process Group, regardless of whether a visible document is linked. A mapped scope/E2E record may appear at L2 while its stored enterprise level remains unchanged.
- L2 cards show their supporting-document count. Processes without document evidence remain visible with the no-evidence style; only records with visible direct links use the dark evidence style.
- L2 cards must display the full process code, process name, and document count. Card rows grow to the longest visible content, and the responsive grid reduces its column count instead of clipping or ellipsizing text on narrower desktop screens.
- Process cards separate classification/identity from the title: L0 uses an APQC Category code header, L1 uses an APQC reference code header, and L2 uses an enterprise process-code header.
- Card headers use one aligned visual system: L0 shows `Category` and `APQC {code}` on separate lines, L1 shows `APQC tham chiếu` and its code on separate lines, while L2 shows only the enterprise process code.
- The Process Detail panel is hidden by default. A persistent show/hide control restores the selected process detail; while hidden, the landscape uses the full workspace width.
- L0 and L2 cards use fixed header/body/footer grid rows so every code header remains top-aligned regardless of title length. The toolbar remains visible and exposes only the Process Detail show/hide control; it has no separate collapse control.
- The landscape visualizes branch coverage without changing APQC classification: a dark L0/L1 block has mapped lower-level process data and document evidence in its branch; a medium L0/L1 block has mapped lower-level process data but no direct document evidence; a pale block has no linked lower-level data. At L2, dark still means the process itself has directly linked documents.
- Từ L0, legend độ phủ phân biệt ba trạng thái theo dữ liệu thật trong nhánh: **Có dữ liệu cấp dưới và có tài liệu trực tiếp**; **Có dữ liệu cấp dưới nhưng không có tài liệu trực tiếp**; **Chưa có dữ liệu liên kết**. Với L2, màu đậm tiếp tục biểu thị tài liệu liên kết trực tiếp của chính quy trình.
- The default hierarchy layout uses a focus-and-context pattern: a compact L0 overview, descriptive L1 selection cards, a visible selected-path connector, and mapped L2 process cards with document-evidence intensity. The connector communicates drill-down only, never execution sequence.

### Layered drill-down

- Clicking a node selects it, opens its direct child layer, and updates the detail panel.
- Use a column-browser layout: each column represents one hierarchy layer.
- Preserve a breadcrumb from root to the selected node.
- Persist the selected path in the URL.
- Continue drilling until the hierarchy has no child layer.
- Do not treat hierarchy order as execution order.

### Processes in scope

- Show all descendants of the selected node in a separate scope panel.
- Provide Tree and Table modes.
- Search and filter within the selected scope.
- `Expand all` applies only to the current scope.

### Related processes

- Keep cross-hierarchy relationships separate from the hierarchy tree.
- Group related processes by input, output, dependency, governance, feedback, and general relation.
- Open a dedicated relationship view for network exploration.

### Quick understanding

- Blocks show code, name, and owner; they do not render the full Executive Summary inside the landscape.
- L0 Value Chain and L1 End-to-End Process blocks are navigation/landscape only: they do not open a hover or keyboard-focus preview.
- L2 Process, L3 Subprocess, and L4 Activity/Task show the five Executive Summary fields in an accessible preview on hover or keyboard focus; `Escape` dismisses that preview.
- Clicking any L0–L4 block opens the persistent detail panel, where the five fields remain readable and editable by an authorized Admin.
- Full detail opens without losing the map path.

## 8. Process Executive Summary

Label in Vietnamese: **Tóm lược điều hành**. English concept: **Process Executive Summary**. UX helper: **Hiểu process trong 60 giây**.

Store five versioned fields:

1. `business_purpose` — why the process exists.
2. `scope_and_boundaries` — scope and start/end boundaries.
3. `process_at_a_glance` — main flow in concise form.
4. `critical_decision_points` — important decisions and criteria.
5. `accountability_and_impact` — accountability and scale of impact.

Publication requirement:

- Required for Value Chain/E2E, Process, and Subprocess.
- Optional for Activity and Task.
- Not required for APQC reference elements.

## 9. Process hierarchy and APQC mapping

Enterprise levels are flexible:

- Value Chain / End-to-End Process
- Process
- Subprocess
- Activity
- Task

An enterprise process can stop at any level. APQC mapping is independent of enterprise level.

Mapping is many-to-many:

- `mapping_role`: primary, supporting, step.
- `match_type`: exact, partial, broader, narrower, related.
- `status`: proposed, verified, rejected.
- Include rationale, verifier, and verification time.

APQC mappings provide classification and traceability; they do not create enterprise relationships automatically.

## 10. Process relationships and context objects

### Canonical relationship model

Store one directed relationship. Derive inverse labels in the UI; do not store duplicate inbound/outbound rows.

Relationship fields:

- Source object/type.
- Target object/type.
- Controlled relationship type.
- Business label and description.
- Proposed/verified/rejected status.
- Validity dates when relevant.
- Source/evidence.
- Creator/updater and verifier.

Relationship version history is deferred.

### Controlled relationship groups

- Structure: parent/child, belongs to process.
- Execution: input from, output to, handoff, triggers, depends on, feedback.
- Governance: governed by policy, implements regulation, controlled by.
- Ownership: owned by role, accountable person.
- Knowledge: must know, should know.
- Impact: uses system, addresses risk, influences KPI.
- Evidence: supported by, audited by, incident/evidence link.
- Lifecycle: replaces, supersedes, appendix of.
- Delivery: implemented by, communicated by, trained by.
- General: related to, references.

### Context objects in the MVP

- System/Application.
- Risk.
- KPI.
- Business Role.
- Business Object.
- Finding.

Department and Project are controlled metadata values, not first-class modules in the MVP.

### Business Objects

Business Objects normalize inputs and outputs:

- Document.
- Data/Record.
- Decision/Approval.
- Event/Trigger.
- Material/Product.
- Service/Deliverable.

A process can produce an object as output and another can consume the same object as input.

### Relationship UI

- Selected object at center.
- Inbound relationships on the left; outbound on the right.
- Context objects separated visually.
- Network graph and filterable relationship table.
- Click a node to make it the new center.
- Show direct relationship, linked-document, and context-object counts.
- Provide a legend for node, edge, direction, and verification status.

## 11. Process detail

Tabs:

1. Overview.
2. Map & Relationships.
3. Documents.
4. APQC & Metrics.
5. Governance.
6. Findings & Actions.
7. Versions.

Header always shows process code, name, status, version, owner, and next review date.

## 12. Metadata

### Must-have process metadata

- Stable UUID, generated process code, optional source code, and aliases.
- Vietnamese name; optional English name.
- Level type, parent, display order, status, and version.
- Purpose, description, scope in/out, trigger, and outcome.
- Five Executive Summary fields when required.
- Owner, Steward, SME, Approver, Required Readers, Interested Readers.
- APQC mappings and verification data.
- Applicability: legal entity, department, location, channel, product/service, system, employee audience, and exception.
- Input/output Business Objects and relationships.
- Classification/access level and allowed system roles.
- Created/updated/submitted/approved/published timestamps and actors.
- Valid from, valid until, review due, change reason, and superseded version.

### Must-have document metadata

- Stable ID and document code.
- Vietnamese title and optional English title.
- Controlled document type with a derived document group (one type maps to its canonical group).
- Version and lifecycle status.
- Linked process and process version.
- Owner, author, approver, language, access level, and readers.
- Validity and review dates.
- Change summary and superseded version.
- File name, storage key, MIME type, size, and checksum.
- Optional `document_abstract`; do not reuse the process Executive Summary.

### Initial document metadata configuration

- A new draft needs either a supported file or a manually entered Vietnamese title. The system creates the document code, initial draft version, creator, and file fields automatically; it never publishes the draft automatically.
- **Thông tin cơ bản** configures Vietnamese/English title, controlled Loại tài liệu, language, abstract, and keywords. The taxonomy contains 23 types in seven groups. Nhóm tài liệu is derived automatically/read-only from the selected type: users do not independently select a group. An existing untyped draft retains its saved legacy group on edit; new drafts without a type use the group other.
- **Phân loại & phạm vi áp dụng** configures an optional primary process link, applicability note, controlled legal entity/department/location/channel/product-service/employee-audience values, and governance tags.
- **Trách nhiệm & quyền truy cập** configures document owner, issuing department, access level, and a designated approver. The designated approver is planning metadata only; approval still follows the governed review workflow and four-eyes rule.
- **Đối tượng cần biết** lets Admin select multiple existing active business roles in the mutually exclusive **Phải biết**, **Nên biết / tham chiếu**, and **Không áp dụng** groups. Roles left unselected are **Chưa xác định**, which must not be treated as Không áp dụng. Editor can view the metadata but cannot change this classification.
- **Hiệu lực, kiểm soát & lưu trữ** configures validity/review dates, risk rating, legal reference, retention note, and change summary. These fields are optional during initial draft creation and are completed before the relevant lifecycle gate.

### Nice-to-have metadata

- Operational: selected KPI, SLA, frequency, cycle time, volume, cost, FTE, automation.
- Risk/compliance: criticality, risk rating, regulation, control objective, control, continuity impact, RTO/RPO.
- Improvement: maturity, pain point, bottleneck, opportunity, automation candidate, target state.
- Enterprise architecture: stakeholder, supplier, RACI, application, data object, capability, strategic objective, value stream.
- DMS: retention class, disposal date, legal hold, watermark, download/print restriction, translation, signature, training, extraction state.

### Computed metadata

- Completeness score.
- Days to review and overdue flag.
- Child, relationship, document, and open-finding counts.
- Required-reading completion rate.
- APQC coverage.
- Version age.

## 13. Applicability and metadata inheritance

- Applicability is searchable and filterable; it is separate from access control.
- Child processes inherit access, audience, applicability, review cycle, default Owner/Steward, tags, and classification from the parent.
- Editors can override inherited values.
- Clearly label inherited versus overridden values.
- Do not inherit APQC mappings, relationships, descriptions, or validity dates.

Admin manages controlled vocabulary values. The MVP does not include custom-field creation.

## 14. Document management

### File storage and upload

- Files are uploaded directly from an authenticated browser to the private Supabase Storage bucket, without sending file bytes through a Vercel Function. This supports the 25 MB limit without Vercel Function payload limits.
- Before upload, the browser validates the size plus matching MIME type and extension. Supported formats are PDF, DOCX, XLSX, PPTX, PNG, JPG, and JPEG; executable, archive, and script formats are not accepted by the intake UI.
- The browser calculates a SHA-256 checksum, creates a unique storage key, and records the original name, MIME type, size, checksum, uploader, and upload time in `document_files`. If recording that metadata fails, the just-uploaded object is removed.
- Storage and document-file policies restrict upload to an authorized editable draft. Files remain private; signed URLs are issued only after authorization.
- A title-only draft may be created first and a file added later. Each upload creates a new stored object and never overwrites a prior object.
- At the supported 1024 px desktop width, upload controls—including the native file picker—must shrink within their grid columns and must not create page-level horizontal overflow.
- PDF/image preview; Office download in the MVP.
- Use archive/soft-delete behavior from the UI.

### Document taxonomy

The controlled vocabulary retains **23 stable type codes and IDs** assigned to seven groups. The following are the approved Vietnamese display names (2026-10-21):

- **Quản trị:** Chính sách; Quy định; Tiêu chuẩn; Quyết định; Ma trận phân quyền.
- **Vận hành:** Quy trình; Hướng dẫn công việc; Biểu mẫu; Bảng kiểm.
- **Truyền thông & đào tạo:** Thông báo; Hướng dẫn sử dụng; Tài liệu đào tạo.
- **Hồ sơ & báo cáo:** Biên bản họp; Báo cáo đánh giá; Biên bản sự cố; Báo cáo phân tích nguyên nhân gốc rễ.
- **Kế hoạch & dự án:** Văn bản khởi tạo dự án; Đề án kinh doanh; Kế hoạch.
- **Tài liệu bên ngoài:** Văn bản pháp luật; Hợp đồng; Tài liệu tham khảo ngoài doanh nghiệp.
- **Khác:** Tài liệu khác.

The 2026-10-21 label normalization is **display-only**: it does not rewrite type codes, type IDs, group codes, version links, or storage paths. In particular, the redundant 'Biểu mẫu / mẫu biểu' has become 'Biểu mẫu'; 'Danh sách kiểm tra' is 'Bảng kiểm'.

Each document has at most one primary type and optional tags. Group is derived from the selected type and displayed separately beneath a distinct heading/helper; an existing draft without a type retains its stored historical group. Do not coerce untyped historical documents into a guessed type.

### Library management

- Search covers Vietnamese/English title, abstract, keywords, and issuing department.
- Filter by lifecycle status, controlled document type, document group, language, access level, risk rating, and owner.
- Sort by latest/oldest update, title, nearest review due date, and latest validity start date.
- Library cards show the governed metadata needed for quick triage: code/version, type/group, language, access level, risk, owner, issuing department, validity, review due date, keywords, files, lifecycle status, and classified knowledge roles when present.
- Filters are URL-backed so the result set can be refreshed or shared without introducing saved views in the MVP.

### Lifecycle

Shared process/document lifecycle:

`Draft → In Review → Approved → Scheduled → Effective → Superseded → Archived`

Alternative terminal/intermediate states: `Rejected`, `Cancelled`.

- `Scheduled` requires a future `valid_from`.
- Effective-state evaluation uses `Asia/Ho_Chi_Minh`.
- A new effective version supersedes the prior effective version.
- Block overlapping effective intervals for the same object.
- `Review Overdue` is a governance flag, not a lifecycle status.

### Review cadence

- Default review interval: 12 months.
- Allow 3, 6, 12, 24 months, or a custom date.
- `valid_from` and `review_due_at` are required for publication.
- `valid_until` is optional.
- Notify 30, 14, and 7 days before review due and when overdue.
- Review overdue does not automatically invalidate a process/document.

### Approval

- Editor submits a draft.
- Admin reviews, comments, rejects, approves, and publishes/schedules.
- The last author cannot approve their own change.
- Rejection requires a reason.
- Viewer may read document metadata/files in every workflow status only when the version's `allowed_roles` includes Viewer; access classification, process publication visibility and all write/review/approval actions remain governed separately.
- Detailed collaborator-only draft visibility is deferred; Editors can see all drafts in the MVP.

### Compare

- Compare process/document metadata between versions.
- Highlight APQC mapping, ownership, applicability, reader, relationship snapshot, and attachment changes.
- Do not diff the internal contents of PDF/DOCX/XLSX/PPTX in the MVP.

## 15. Knowledge audience, authorization, and acknowledgment

**Knowledge requirement** applies to business functions/positions stored in business_roles, **not** to login/system roles (viewer/editor/admin). It targets the stable document identity (documents.id), not a document version.

- **Phải biết / Must know** — required for the business role to carry out its responsibilities.
- **Nên biết / Should know** — useful information for collaboration, reference or exceptional tasks.
- **Không áp dụng / Not applicable** — explicitly evaluated as outside the scope of the business role.
- **Chưa xác định / Unclassified** — no verified mapping. This must not be equated with Không áp dụng.

Admin manages three multi-select lists of active business roles in Tab 02. Each role belongs to at most one knowledge group per document. Reclassification rejects an obsolete verified governed relationship and verifies the new mapping; previously stored rows are not physically deleted. The atomic function set_document_knowledge_audience(uuid, jsonb) checks Admin authorization, existing active roles, and that the document has an editable draft/rejected version. Existing must/should relationship types are reused, and role_not_applicable_document is added.

**Keep knowledge scope separate from authorization:** this classification does not grant or deny document/file access; Supabase RLS, private Storage, and per-document access levels still decide visibility. Changing it does not automatically notify an individual, create a reading assignment, or force acknowledgment.

**Individual reading workflow:** reading_assignments assigns a specific document version to a specific profile with a required flag; reading_acknowledgments captures a recipient's confirmation timestamp. A new version requires its own reading assignment/confirmation as relevant. No automatic business-role-to-individual cascade is currently implemented. No quiz or electronic signature is in the MVP.

## 16. Search and catalog

Global search covers:

- Enterprise process code, names, descriptions, Executive Summary, scope, trigger, and outcome.
- PCF ID, hierarchy ID, APQC name, and description.
- Relationship labels, Business Objects, owner, status, tags, and applicability.
- Document code, title, type, and metadata.

Search is case-insensitive and supports Vietnamese with/without diacritics plus English. File-content indexing is deferred.

Catalog supports filter and sort over governed metadata. Saved views, bookmarks, and CSV/XLSX export are deferred.

## 17. APQC metrics

- Import all supplied metric definitions and link them by PCF ID.
- Show relevant definitions as recommendations for mapped enterprise processes.
- Editor can select metrics applicable to a process.
- Do not collect actual values, targets, periods, or operational KPI charts in the MVP.
- Governance can report whether a process has selected a KPI.

## 18. Findings & Actions

### Finding types

- Exact duplicate (`exact_duplicate`).
- Semantic duplicate (`semantic_duplicate`).
- Scope overlap (`scope_overlap`).
- Content/condition conflict (`potential_conflict`).
- Cross-document version conflict (`version_conflict`).
- Effective-date conflict (`effective_date_conflict`).
- Document-relationship conflict (`relationship_conflict`).
- Supersession candidate (`supersession_candidate`).
- Other **cross-document** issue (`other`; still requires 2 distinct documents).

AI detection is deferred. Seed or manually enter findings for the MVP demo.

### Finding fields

- Generated ID such as `FND-000123`.
- Title, description, type, severity, priority.
- Related process/document versions and evidence.
- Creator, assignee, participants/watchers.
- Due date, resolution type, and resolution summary.
- Status and activity timeline.

### Workflow

`New → Triage → In Progress → Pending Decision → Resolved → Closed`

`Reopened` returns work to the active workflow.

- Editor can create, assign, work, and move to `Resolved`.
- Admin validates and moves to `Closed`.
- Admin alone reopens a closed finding.
- Viewer comment/reaction capability applies only where the finding is visible under RLS. The cross-document tab 06 and its action/evidence records currently require Editor/Admin; legacy generic findings retain their prior Viewer visibility.

### Collaboration

- Threaded comments and replies.
- Mentions of demo users.
- Agree, Disagree, and Need more information reactions.
- Assignment, participants, due date, priority, and severity updates according to permission.
- Mark a comment as a decision.
- Link the process/document version that resolves the issue.
- Timeline of comments, assignments, decisions, and status changes.

### SLA defaults

- Critical: 2 days.
- High: 7 days.
- Medium: 14 days.
- Low: 30 days.

Admin can adjust defaults; an individual due date can override the default.


### Document cross-reference findings (06 · Finding & Action)

The 06 workspace is exclusively the **cross-document conflict and overlap register**. Existing generic/single-document findings are retained in the database for historical integrity but are not listed on tab 06, even using URL filters.

- Manual classification: exact duplication, semantic duplication, scope overlap, content/condition conflict, conflicting versions or effective dates, contradictory inter-document relationships, supersession candidate and other document issue.
- Every finding on tab 06 must compare **at least two distinct document identities**, each linked to a concrete document version. Two versions of the same document do not qualify. There is no one-document exception, including the "other" type.
- Record precise evidence/clauses for each linked document version, impact on operations, severity, owner, due date and lifecycle stage. Never infer a confirmed conflict solely because two documents share a title or process.
- Decide explicitly whether correction is required, with a reason when no action is necessary. Action-required findings can contain multiple separately assigned corrective actions.
- Each corrective action records title, outcome, assignee, deadline, status (to do / in progress / blocked / done / cancelled), progress percentage, last update, and completion evidence. Blocked actions need an explanation; completed actions need a result/evidence.
- A document finding can be resolved only after the action decision has been recorded **and** at least two different `documents.id` values are linked through `finding_links(object_type=document_version, link_role=subject)`. If action is required, at least one non-cancelled action must exist and all active actions must be completed; the existing Admin role gate still controls final closure.
- Duplicate/conflict analysis is **manual** in this milestone; extraction, file full-text indexing and AI detection remain deferred and must not be represented as live features.
- For now document findings and their links/events/actions are restricted to Editor/Admin; Viewer can still see existing generic findings. A finer-grained document-owner/participant release for Viewer requires separate security design.

### Implemented tab 06 behavior and demonstration dataset (2026-10-21)

- Default and filtered tab 06 lists show **only** `finding_domain=document` records linking at least two **different** stable document identities. Old generic or single-document findings remain stored for historical purposes, but do not appear on tab 06; changing query parameters must not reveal them.
- Form submission validates 2–20 referenced versions, **with at least two different underlying document IDs**. Selecting v1 and v2 of the same document is insufficient for every type, including `other`. The database prevents a document finding from moving to `resolved` / `closed` without this evidence; it does not yet provide an atomic guarantee during the two-step initial creation.
- Each evidence row references a precise document **version**; the stable document code, title, version number, validity dates and excerpt are displayed to authorized readers. The related enterprise-process codes are context rather than proof of conflict.
- The action decision is `pending`, `required`, or `not_required` (the last requires a rationale). `finding_actions` tracks assignee, deadline, `todo | in_progress | blocked | done | cancelled`, 0–100% progress, last update, and evidence of completion. Action creation and subsequent progress changes append `finding_events` history.
- Data currently seeded for illustration: **8** clearly labeled `[DEMO 06/F01..F08]` findings, **16** `DEMO-FND-DOC-xx` metadata-only **draft** documents, **16** version-level evidence excerpts and **10** example corrective actions, linked to the existing ten `PROC-000011..PROC-000020` enterprise processes. The eight demos each compare **two separate documents**; they span open, triage, in-progress, pending-decision, resolved and closed states, including a no-action decision.
- The demo clauses, impacts, statuses and dates are **hypothetical**, not conclusions from reviewing actual files; **no binary source documents were analyzed or uploaded** for this seed. Seeding is idempotent; cleanup is opt-in via `scripts/delete-demo-document-findings.sql`, never automatic.
- Verification: Supabase queries confirmed all eight demos have two distinct document identities. Transactional (rolled-back) testing denied closure using only two versions of one document and allowed it after adding a separate document. Vercel production build for commit `eca17a0` reached READY. Authenticated end-to-end browser testing of the entire issue/action workflow remains pending.

## 19. Dashboards

### Role home

- Viewer: required reading, notifications, and recently updated processes.
- Editor: drafts, unresolved comments, assignments, mappings/relationships awaiting confirmation, and upcoming reviews.
- Admin: review queue, completeness, overdue reviews, APQC coverage, open findings, acknowledgment rate, and expiring content.

### Governance dashboard

- Counts by status and level.
- Missing Owner/Steward.
- Missing/unverified APQC mapping.
- Missing definition, Executive Summary, input/output, or document.
- Drafts awaiting approval.
- Upcoming/expired validity and overdue review.
- Proposed relationships awaiting verification.
- Required reading not acknowledged.
- APQC category coverage.
- Recent activity.

### Completeness score

- Core definition: 20%.
- Executive Summary: 20%.
- Owner/Steward/Approver: 15%.
- Verified APQC mapping: 10%.
- Input/output Business Objects: 10%.
- Applicability: 10%.
- Lifecycle/validity/review: 10%.
- Linked document: 5%.

Bands: Complete 90–100; Needs attention 70–89; Incomplete below 70. Show the checklist and score calculation. Publication gates remain authoritative.

### Finding dashboard

- Open, overdue, due soon, pending decision, resolved-not-closed, and reopened counts.
- Average backlog age and closure rate.
- Breakdown by status, severity, priority, type, assignee, creator, process owner, APQC category, applicability, and resolution type.
- Age buckets: 0–7, 8–14, 15–30, 31–60, and over 60 days.
- Created versus resolved trend, backlog aging, workload, Critical/High list, and Pending Decision list.
- Click-through from chart/card to the filtered finding list.

## 20. Action Log

User-facing name: **Action Log**. The technical `notifications` table and event service remain unchanged.

In-app only for the MVP:

- Draft submitted, approved, rejected, scheduled, or published.
- Review due or overdue.
- Required reading assigned.
- Mapping/relationship awaiting verification.
- Process role assignment.
- Finding mention, assignment, status change, decision, or approaching due date.

Action Log supports read/unread state and deep links.

## 21. Visual and interaction direction

- Product name: **Process Map**.
- Do not display the PNJ name or logo.
- Visual direction references PNJ: white surfaces, navy primary color, restrained gold accent, light gray supporting surfaces, and Roboto typography.
- Use semantic colors independently for success, warning, conflict, and lifecycle states.
- Design tokens must allow later replacement with formal brand values.
- Desktop-only; optimize for 1280 px+, usable at 1024 px.
- Current Microsoft Edge and Google Chrome only.
- Mobile shows an unsupported-device message.
- Respect focus visibility, keyboard operation, contrast, and reduced motion.

## 22. Technology constraints

- Next.js App Router and TypeScript.
- Supabase Auth, PostgreSQL, RLS, and private Storage.
- One Supabase project for MVP preview/demo.
- Vercel deployed from GitHub.
- Tailwind CSS, Radix UI primitives, customized shadcn/ui.
- React Hook Form and Zod.
- React Flow for relationship networks.
- TanStack Table for catalogs and queues.
- Recharts for governance dashboards.
- Lucide Icons and Sonner.
- Playwright and axe-core for user-flow and accessibility checks.

Repository must remain safe if public: no secrets or sensitive source data.

## 23. Golden demo acceptance flow

1. Viewer logs in and opens Enterprise Process Map.
2. Viewer drills through levels, sees all processes in scope, and reads the Executive Summary.
3. Viewer opens a process and sees input/output, relationships, APQC mapping, and documents.
4. Editor creates a new process/document draft, completes metadata, and submits it.
5. A different Admin reviews publication gates and version comparison, comments, and approves/schedules it.
6. Viewer receives a notification, opens the effective version, and acknowledges reading.
7. A seeded Conflict finding is assigned, discussed, reacted to, and moved to `Resolved`.
8. Admin validates and closes the finding.
9. Governance and Finding dashboards reflect the changes.

The MVP is successful when this flow works on Vercel with Supabase and the required authorization boundaries are verified.

## 24. Open decisions

- Real enterprise-process sample structure and chosen demo domain.
- Excel/CSV/PDF/DOCX import workflow after sample inspection.
- AI provider, data-handling policy, and semantic conflict pipeline.
- Relationship versioning.
- Full audit trail and retention.
- Fine-grained draft visibility.
- Advanced archive rules.


## 25. Required-reading discovery and relationship language — 2026-10-20

- The Document page must provide a dedicated “Tài liệu cần đọc của tôi” area before the general library.
- A Viewer can search assigned documents by code, title, abstract, keyword, or issuing department and filter by pending, overdue, acknowledged, required, or all assigned items.
- Each assignment shows document code/version, required/reference flag, controlled type, issuing department, effective date, assignment date, due date, acknowledgment state, and a secure file action.
- A user may acknowledge only an assignment addressed to their own profile; RLS remains the authorization boundary.
- Relationship UI uses Vietnamese business wording. “Directed” means the stored relationship is read from Source → Target; the inverse label describes the same record when viewed from the target.


## 26. Collapsible relationship legend — 2026-10-20

- Relationship explanations are consolidated into one “Chú giải” frame beside the network.
- The frame is collapsed by default and uses a native keyboard-accessible disclosure; users expand it only when they need the source-to-target direction, inverse labels, or controlled relationship-type guidance.
- The standalone direction note is removed to prevent duplicate explanations; the network and relationship register remain visible.


## 27. Compact relationship layout — 2026-10-20

- Relationship statistics use compact labels and typography to reduce vertical space.
- Redundant graph headings and helper text are removed; the relationship network keeps only the concise title “Quan hệ”.
- The legend relationship types are arranged horizontally and wrap when needed; the legend remains collapsed by default.
- The network control uses “Xem thêm liên kết” instead of exposing hop terminology in the primary action. One hop means a direct relationship from the selected center; two hops includes relationships of neighboring objects as well.


## 28. Responsive relationship layout — 2026-10-20

- “Cách đọc quan hệ” uses a horizontal, wrapping layout so the network keeps the available width.
- Relationship statistics and network node text use compact responsive sizes; long labels are truncated instead of forcing the laptop layout wider.
- At laptop widths, the relationship workspace uses one full-width column; at narrow widths, inbound/outbound cards use two columns and the center object moves above them.
- The Finding evidence matrix uses one compact “Quy trình / tài liệu liên quan” column instead of one horizontal column per source. The adjacent “Nội dung đối chiếu” column groups each cited source with its exact conflict/overlap excerpt, preserving missing-source indicators and all stored evidence.
- Ma trận bắt đầu bằng cột **STT**, sau đó là ID và các trường nghiệp vụ. “Điểm quyết định” và “Ý kiến Owner” mặc định hẹp; tiêu đề được phép xuống tối đa hai dòng trong header 42 px. Mọi cột có tay nắm chuột/bàn phím để chỉnh độ rộng tạm thời; chỉ một hàng header được ghim dọc ở kích thước desktop 1024 px.
- Mỗi dòng ma trận có nút **Sửa** cho Admin hoặc Editor có quyền trên finding và nút **Xem** cho người dùng chỉ đọc. Nút mở thẳng vùng metadata của trang chi tiết; quyền cập nhật vẫn do Server Action và RLS kiểm soát.
- Trong cột **Quy trình / tài liệu liên quan**, nhóm tài liệu chỉ hiển thị nguồn có bản ghi bằng chứng đối chiếu hoặc được liên kết trực tiếp làm đối tượng của finding. Không suy diễn quan hệ chỉ từ mã nguồn dạng `[n]` xuất hiện trong mô tả, câu hỏi Owner hoặc hướng xử lý; các mã này có thể chỉ là ngữ cảnh. Nguồn thiếu file nhưng có bằng chứng vẫn phải hiển thị.
- Tài liệu đã có record trong cột này là liên kết có thể mở ở tab mới bất kể trạng thái Draft/Review/Approved/Effective. Nếu có file, liên kết mở route signed URL; nếu mới có metadata, liên kết mở chi tiết Document. Nguồn chưa được cung cấp không tạo liên kết giả.


## 29. Relationship network lines — 2026-10-20

- Relationship cards now show visible connector lines to the selected center object; inbound and outbound direction remains readable from placement and labels.
- The user-facing hop terminology is removed. The network uses “Xem thêm liên kết” and “Thu gọn”; the legend explains that the direct connector is a direct relationship and expansion adds links from neighboring objects.


## 30. Relationship controls and arrow connectors — 2026-10-20

- Relationship statistics and filters use compact heights and typography to preserve vertical space.
- Inbound and outbound relationships use visible connector lines with arrowheads pointing toward the center reading direction.


## 31. Non-overlapping relationship connectors — 2026-10-20

- Relationship connectors use a vertical rail on each inbound/outbound side instead of independent arrows crossing or stacking over one another.
- Each card connects to its side rail, and the rail connects toward the center object; compact mode removes rails when the layout becomes a single-column mobile view.


## 32. Reference-style relationship network — 2026-10-20

- The selected object is rendered as a dark central card, with related objects arranged in inbound/outbound lanes around it.
- Relationship groups use restrained semantic card colors, while connector rails keep the direction readable without overlapping cards.
- Cards remain clickable for drill-down; long labels wrap inside the card rather than expanding the network beyond the available laptop width.


## 33. Document relationship focus and role knowledge — 2026-10-20

- Relationship provides a “Tài liệu trung tâm” selector so users can inspect all direct inbound/outbound links for a chosen document and drill down by clicking related nodes.
- A dedicated “Vai trò của tôi” navigation tab provides a Role Knowledge Profile for a selected business role.
- Role knowledge is modeled through controlled object relationships from business role to document, using “Bắt buộc phải biết”, “Nên biết / tham chiếu”, and (since 2026-10-21) “Không áp dụng”. Unselected roles remain “Chưa xác định”.
- Knowledge scope is not authorization. Document access remains enforced by Supabase RLS and private Storage policies.
- Role knowledge counts include every visible relationship assignment. When RLS hides the target document metadata, the UI keeps a neutral “Bị giới hạn” placeholder instead of dropping the requirement or exposing protected details.
- Demo mappings are tagged in descriptions and can be removed without affecting real documents or roles.


## 34. Coded relationship lanes and connector labels — 2026-10-20

- Every relationship node displays its governed object code when available; enterprise process codes are always shown above the process name.
- Direct inbound and outbound relationships use separate lanes. Each connector carries the controlled Source → Target relationship label, such as “Được sử dụng bởi” or “Dùng biểu mẫu”, so the arrow can be understood without opening the legend.
- The selected center shows object type, code, name, and direct-link count. Object selectors and the relationship register also include codes for faster scanning.
- Direct links remain the primary network. “Xem thêm liên kết” places neighboring relationships in a separate compact section instead of mixing them into the direct inbound lane.
- At constrained laptop widths, connector lines become inline directional labels and the lanes reflow without overlapping cards or hiding long names.


## 35. Relationship arrow endpoint polish — 2026-10-20

- Direct connectors use rounded two-pixel strokes, restrained gradients, and open chevrons instead of rigid filled triangles.
- A hollow source dot identifies where the relationship begins; the open chevron identifies the target. Inbound arrows terminate at the selected center object, while outbound arrows begin at the center and terminate at the related target node.
- Connector rails use softened gradient fades and rounded junction points. Hover or keyboard focus highlights the connector belonging to the active node.
- At constrained laptop widths, the same source-dot and target-chevron grammar is preserved in the inline relationship strip without overlapping cards.


## 36. Relationship metadata intake and governance — 2026-10-21

### 36.1 Metadata completeness review

The existing object_relationships model already contains the metadata needed for governed end-user input. No custom field or new business column is required for the MVP. The missing capability was the input/edit workflow and its write authorization.

Cross-form audit result:

- Process metadata input already covers identity, bilingual naming, purpose/description, the five Executive Summary sections, input/output, trigger/outcome, access, validity/review dates, and change summary.
- Document metadata input already covers file, bilingual title, controlled type/group, abstract, keywords, language, issuing department, owner/approver, linked process, applicability, tags, legal/retention notes, risk, access, validity/review dates, and change summary.
- Relationship storage already had the required fields, but end users had no governed create/edit form. This section closes that gap.
- Finding workflow metadata is managed on the Finding detail screen. New-finding intake remains the separate manual-entry requirement in section 18 and is not replaced by the Relationship form.

The Relationship form must expose:

- Source object: one active process, document, business object, system, risk, KPI, business role, or finding.
- Controlled relationship type: filtered by the selected source and target object types.
- Target object: one active object from the same governed catalogs.
- Optional display label: overrides the controlled type label only for the current relationship.
- Business description: explains why the relationship exists and how it is used.
- Evidence/source of confirmation: meeting record, decision, document, ticket, or verification note.
- Valid-from and valid-until dates.
- Workflow status: proposed, verified, or rejected.
- Automatic audit metadata: creator, last editor, verifier, created time, and last-updated time.

### 36.2 Roles and workflow

- Viewer is read-only and does not see create/edit controls.
- Editor can create a proposed relationship and edit only their own proposed or rejected relationship. Saving a rejected relationship resubmits it as proposed.
- Admin can create or edit any relationship and set proposed, verified, or rejected status.
- Only Admin can verify a relationship. Verification identity is stamped by the system rather than accepted from the browser.
- Relationship deletion is outside this increment; records remain governed and recoverable.

### 36.3 Validation and security

- Source and target must be different active objects.
- The controlled type must be active and must allow the selected source/target object types.
- The canonical Source + Type + Target tuple must be unique.
- Valid-until cannot be earlier than valid-from.
- A verified relationship must contain both a business description and evidence/source of confirmation; proposed records may be completed progressively.
- Text lengths are validated in the UI contract and server action.
- Server validation is repeated by a PostgreSQL trigger for direct database writes.
- RLS is the authorization boundary: authenticated read remains unchanged; Editor/Admin write rules follow section 36.2.
- Client code never receives a service-role key.

### 36.4 Deferred relationship metadata scope

Relationship version history, soft deletion, custom metadata-field creation, bulk import, and approval comments remain deferred. These items must not be inferred from the MVP form.


## 39. Layered Process metadata card — 2026-10-21

### 39.1 Selection behavior

Selecting any enterprise process block in Process Map must refresh the right-hand Process Detail panel without navigating away from the L0–L4 canvas. The selected object is a **Business Process**, not a Document. Documents may reference a process through controlled relationships, but document metadata remains in the Document module.

### 39.2 M-Files-inspired metadata model

The Process Detail panel follows the useful M-Files metadata-card pattern without claiming to reproduce the M-Files product or physical schema:

- Object Type identifies the governed object as Business Process.
- Class is derived from the enterprise process level and determines the expected property context.
- Property Definitions are represented by the governed fields already defined in the Process Map data model.
- Property Values show the current version's stored values.
- Lookup properties show references to parent/child processes, assignments, tags, applicability, systems, and APQC mappings.
- Workflow/system properties show version, status, effective dates, review date, superseded version, timestamps, and lifecycle actors.

The card groups properties into six visible sections: classification and hierarchy; identity and governance; five-part Executive Summary; business content and flow; lookups and relationships; lifecycle and audit.

### 39.3 Missing-field visibility

- Every governed field remains visible after a process is selected, including fields with no value.
- An empty property uses an explicit `Thiếu dữ liệu` state with a warning-colored row; empty fields must not disappear or silently inherit a different field's value.
- The panel displays overall completion as populated fields over total visible properties and a per-section missing count.
- System-managed properties are labelled `System` so users can distinguish audit/workflow values from business metadata they may edit.
- The existing Admin edit action remains the write entry point. Viewer remains read-only; the card does not bypass RLS or introduce custom metadata-field creation.

### 39.4 Performance and accessibility

The page reads the selected process metadata, controlled lookups, and audit relations in the existing authenticated server request. Missing states use text and icons in addition to color. The right panel remains independently scrollable on wide desktop layouts and stacks below the canvas at constrained laptop widths.
## 37. Document classification and knowledge audience — 2026-10-21

- **Tab 02 Document:** One editable controlled document type; its group is derived and displayed read-only. Existing untyped draft group values are preserved. Admin can multi-select existing business roles into three mutually exclusive groups; no selection means unclassified.
- **Tab 05 Vai trò của tôi:** Displays three confirmed role-to-document knowledge groups with pre-existing restricted-document placeholders under RLS. This is not a document-access or individual-reading policy.
- **Data/security:** Migration 20261021104055_document_knowledge_audience.sql adds the Not Applicable relationship type and an Admin-only, security-invoker, atomic classification function. Reclassified older mappings are set to rejected, not deleted. This does not amount to a full immutable relationship audit history.
- **Deployment evidence:** GitHub PR #50 (https://github.com/apqc-process-map/apqc-platform/pull/50) merged to main. Vercel Production for merge commit 9868f9726f604aa2d7000a88e59f8b760ead0ece reached READY on 2026-10-21. Rolled-back Admin insertion/reclassification and Viewer-denial database tests passed. Existing 20 document versions and six confirmed must/should mappings were retained.
- **Pending verification:** Authenticated browser E2E for create/edit/reopen, multi-selection, changes/removal to unclassified, Tab 05 and Document card synchronization, plus Editor read-only behavior. Next.js/TypeScript build success does not replace runtime E2E.

## 38. Tab 02 content consistency and usability — 2026-10-21

- Standardize the Vietnamese copy across metadata intake, direct file upload, reading queue, filters, document cards, metadata comparison, and lifecycle selections. Persist enum codes unchanged, show localized names through a single presentation mapping.
- The derived-group control is explicitly non-editable, with a separate caption, value field, and contextual helper; a blank type shows 'Chưa phân loại' for new drafts and preserves old group values on existing untyped records.
- Document filters include readable names for all seven groups and all lifecycle statuses; group queries are case-insensitive to include legacy `Governance`/`Execution` values. Cards display language, group, access, risk, and dates with Vietnamese labels and DD/MM/YYYY dates.
- Migration `20261021110248_normalize_document_type_labels.sql` updates nine Vietnamese vocabulary labels in place (stable IDs and codes, no version rewrite). Scope and knowledge-audience rules from section 37 are unchanged.
- Validate the Next.js Preview TypeScript build and Production deployment; full authenticated visual/browser create-edit-filter-save smoke QA is a separate check.

## 40. Metadata-driven discovery and shared metadata card — 2026-10-22

### 40.1 Governed document Views

The Document workspace provides governed presets for all visible documents, effective documents, documents approaching review within 30 days, records missing Class-required metadata, and records linked to a Business Process. Users may group the current result set by document type, primary process, status, or owner.

### 40.2 Class-specific required properties

Document Class is derived from the controlled document group. Required and applicable properties are defined in version-controlled application schema, not by end-user custom fields. Common identity and governance properties apply to every Class; Governance, Execution, Evidence/Form, Contract, and Assurance groups add their own required context. Missing required values remain visible and are included in completeness calculations.

### 40.3 Shared property-card pattern

Process and Document detail use one metadata-card presentation: Object Type, Class, grouped properties, required/optional state, property origin, explicit missing state, and completion summary. Process and Document retain separate schemas and permissions.

### 40.4 Indirect discovery and explainability

Users may find a document through RLS-visible related objects such as Business Process, applicability scope, governance tag, or role-knowledge assignment. Every result displays a concise reason explaining why it is present in the current View. Indirect discovery never broadens document access and never exposes labels from objects that the signed-in user cannot read.
## 37. Issue taxonomy, decision support, and Action Log — 2026-10-22

- Finding uses the governed 11-code taxonomy from `Issue.xlsx`. A user first selects **Nhóm vấn đề** (A–D), then a dependent **Loại lỗi chuẩn hóa** (A1–D3); the definition and minimum evidence appear beside the selection.
- Each issue has exactly one `primary_issue_code`. Optional secondary codes are tags only and must not be counted as primary issues in reporting.
- Diagnostic order is **B → C → A → D** and is explicitly separate from severity and business priority. The first Yes answer in the decision helper recommends the primary code; the user confirms it before save. If all answers are No, the issue is reviewed outside this taxonomy and no new code is invented.
- Finding intake stores issue statement, process/version context, Decision Point, source document versions and clauses, Primary Code, classification rationale, evidence status (`candidate | pending | validated | rejected`), Process Owner question, preliminary proposed action, assignee and due date.
- Finding detail is the governed place to update classification, validation metadata and Process Owner feedback. Corrective actions remain separate child records so one issue can have multiple owners/deadlines.
- **09 · Action Log** is the cross-finding execution register. It shows finding/code, action/outcome, assignee, deadline, status, progress and latest update; system notifications remain available in a collapsed history section with read/unread state and deep links.
- The taxonomy and field definitions are fixed MVP configuration; custom metadata-field creation remains deferred.

## 38. Bộ dữ liệu nghiệp vụ trả góp được kiểm soát — 2026-10-22

- Bộ nguồn gồm 12 tài liệu nghiệp vụ do người dùng cung cấp và Issue List.xlsx. Tệp nguồn là dữ liệu nội bộ: chỉ lưu trong Supabase Storage riêng tư, không đưa vào Git và không dùng làm fixture công khai.
- 12 tệp nguồn được quản lý dưới dạng **12 tài liệu**, không được mô tả sai thành 12 quy trình. Cây quy trình được trích từ tài liệu quy trình có cấu trúc rõ ràng: L0 Bán hàng trả góp, L1 Thực hiện bán hàng trả góp, và chín bước L2 QTTG.1–QTTG.9.
- Metadata chỉ được nhập khi có bằng chứng trực tiếp trong nguồn. Trường chưa xác định để trống và phải hiển thị là thiếu/chờ xác nhận. Tất cả phiên bản tài liệu khởi tạo ở draft; ánh xạ APQC khởi tạo ở proposed và cần Process Owner xác nhận trước khi công bố.
- Hệ thống nhận PDF, DOC, DOCX, XLSX, PPTX, PNG và JPEG, tối đa 25 MB/tệp. Tệp nhị phân đi thẳng từ trình duyệt đã xác thực vào bucket riêng tư; metadata và checksum được ghi sau khi upload thành công.
- Issue List.xlsx cung cấp 35 finding và 22 action có nội dung xử lý. Finding liên kết với phiên bản quy trình trả góp và với từng phiên bản tài liệu có bằng chứng; không tạo liên kết tài liệu khi tệp nguồn tương ứng chưa được cung cấp.
- Sáu tài khoản đang hoạt động đều xuất hiện trong danh sách người thực hiện. Quyền chọn người thực hiện không làm thay đổi quyền cập nhật: Viewer vẫn chỉ đọc; Admin/Editor mới được sửa action theo RLS và Server Action hiện hành.
- Khi thay dữ liệu thử bằng dữ liệu thật, việc xóa phải giới hạn bằng marker/mã fixture đã xác minh; không dùng thao tác xóa rộng theo toàn bảng hoặc toàn bucket.

## 41. Ma trận Finding theo nguồn tài liệu — 2026-10-22

- Tab **06 · Finding & Action** mặc định hiển thị ma trận đối chiếu tương đương sheet Issue List trong 10 cột: STT, ID, Loại lỗi chuẩn hóa, Điểm quyết định, Vấn đề, Hướng xử lý, Xác nhận Owner, Ý kiến Owner, Quy trình/tài liệu liên quan và Nội dung đối chiếu. Nguồn không còn trải thành 14 cột ngang; từng nguồn và trích dẫn vẫn được giữ trong hai cột cuối.
- Hiển thị đủ 35 finding và 113 ô bằng chứng có nội dung trong workbook. Ô trống mang nghĩa “Chưa đánh giá”, không được diễn giải thành không có quan hệ hoặc không có xung đột.
- Nội dung dài được thu gọn trong ô và có thể mở toàn văn, không cắt mất dữ liệu. Header cao 42 px, cho phép nhãn tối đa hai dòng và được ghim dọc; các cột đầu không ghim ngang. Nhóm vấn đề có thể thu gọn. Chế độ Danh sách là phương án đọc chi tiết bổ sung, không thay thế ma trận mặc định.
- Tìm kiếm tại chỗ theo ID, vấn đề, điểm quyết định, hướng xử lý và loại lỗi. Bộ lọc bằng chứng phân biệt một nguồn, từ hai nguồn và nguồn chưa được cung cấp.
- Danh mục nguồn giữ metadata tiêu đề, loại tài liệu, đơn vị ban hành và ngày hiệu lực khi có dữ liệu. Nguồn 13–14 vẫn được hiển thị và đánh dấu thiếu file nếu chưa có binary; nội dung workbook liên quan vẫn được bảo toàn.
- Dữ liệu ô bằng chứng được lưu tại finding_source_evidence theo khóa Finding + số thứ tự nguồn. Chỉ người dùng đã xác thực và có quyền thấy Finding tương ứng mới đọc được; không đưa workbook hoặc nội dung tài liệu nội bộ vào Git.

## Bổ sung 2026-10-23 — Mở tài liệu từ quy trình

- Khi chọn một quy trình trên tab **Process Map**, khu vực chi tiết hiển thị danh sách phiên bản tài liệu đã được liên kết trực tiếp với `processes.id` qua `document_process_links`, gồm mã/tên tài liệu, trạng thái, vai trò liên kết, tên file và thao tác mở hoặc tải file.
- Người dùng có thể mở file qua đường dẫn ứng dụng `/documents/files/{file_id}` trong tab mới, hoặc mở metadata và chuyển sang tab **Document** được lọc sẵn theo quy trình.
- Tab **Document** có bộ lọc **Quy trình liên kết**, dựa trên liên kết dữ liệu thật; các thẻ tài liệu có nút mở/tải file trực tiếp.
- Người dùng active đã đăng nhập được đọc tài liệu liên kết ở mọi trạng thái khi system role của họ nằm trong `allowed_roles`; mức phân loại truy cập và RLS vẫn áp dụng. Quyền sửa, duyệt và xuất bản không thay đổi. Storage tiếp tục là private bucket, truy cập qua signed URL thời hạn ngắn được tạo bởi route server có xác thực. Không tạo bản sao file hoặc sửa đổi APQC classification.
- Trường hợp không có tài liệu phù hợp/quyền đọc, hiển thị trạng thái rỗng thay vì hiển thị đường dẫn Storage.

## 41. Repository, access and transaction hardening — 2026-10-27

- Document workflow status is not an access classification. An active authenticated user may read a Draft, Review, Approved or Effective document only when the version's `allowed_roles` includes that system role; Admin remains unrestricted and an Editor may also read a draft they created or own. File access remains private and uses the authenticated signed-file route.
- Creating/updating a Document and its primary process, applicability, tags and role-knowledge links is one database transaction. Creating a document Finding with evidence links and creating an Action with its required decision update are also atomic. A failed child write must leave no partial parent record.
- `create_document_draft_atomic`, `update_document_metadata_atomic`, `create_document_finding_atomic` and `create_finding_action_atomic` run as `SECURITY INVOKER`, use an empty `search_path`, deny `anon`, and re-check active system role in the function body in addition to table RLS.
- Document and Finding lists paginate at 50 rows; Relationship paginates at 100. Filter/query state is preserved in previous/next links. Counts show current-page rows and the RLS-visible total.
- User text used in raw PostgREST `.or()` expressions is trimmed, length-limited, quoted and escaped; column names come only from trusted code.
- Page-level errors must include failed supporting metadata/link requests instead of silently rendering incomplete cards or relationship context.
- Repository delivery runs lint, TypeScript, migration integrity, unit tests and production build in GitHub Actions. Vercel Git integration remains the only deployment path to avoid duplicate deploys.

## 42. Document relationships from confirmed process links — 2026-10-28

- Tab **Relationship** hiển thị mỗi `document_process_links` hiện có thành quan hệ có hướng **Quy trình → Được mô tả bởi tài liệu → Tài liệu**. Đối tượng đích là định danh tài liệu (`documents.id`), còn bằng chứng lưu mã liên kết và phiên bản nguồn để truy vết.
- Các quan hệ được tạo ở trạng thái **Đề xuất**. Process Owner/Admin phải xác minh trước khi chuyển sang **Đã xác minh**; tên hoặc mã tài liệu đơn lẻ không đủ để tự xác minh ý nghĩa nghiệp vụ.
- Không tự tạo quan hệ tài liệu–tài liệu chỉ vì cùng chủ đề, có tên gần giống, hoặc cùng được liên kết với một quy trình. Loại quan hệ này chỉ được thêm khi có dẫn chứng trực tiếp trong nội dung/metadata hoặc quyết định của owner.

## 43. Home quick-insight reporting — 2026-10-29

### 43.1 Purpose and layout

Tab 01 Home (/) leads with a small operational dashboard rather than only cumulative repository totals. Place the period selector above four headline KPI cards, then two trend panels, then the new-document-by-department distribution and an operational-attention panel. Current APQC L1–L3, enterprise process, document identity, and role-specific workload totals are consolidated into the top control strip; role-specific detail queues remain below the analytical sections.

- Period options: trailing **7 calendar days including today by default**, 30 days, 90 days, and custom inclusive From/To dates (maximum 366 calendar days, no future date); dates are interpreted in **Asia/Ho_Chi_Minh** rather than UTC. Example: 2026-10-29 defaults to **2026-10-23…2026-10-29**.
- Report headings, cards, labels and microcopy are Vietnamese, with responsive desktop/tablet/mobile CSS and numeric counts, zero-data messages, inline source/meaning explanations and links to relevant Document/Finding pages.
- Time-series chart buckets are daily up to 14 days and aggregated into approximately 12 buckets for long periods; each chart has its own scale. Two chart pairs: **new document identities vs file objects uploaded**, and **document findings created vs document findings remediated**.
- Department distribution uses the issuing department recorded on the first visible version for each newly created document identity; group case-only variants together, keep missing/blank values as "Chưa xác định"; show the top eight plus the remaining total.
- Operational watch panel: **current** unresolved document findings and overdue corrective actions (these do **not** pretend to be historical period-end backlog), missing issuing-department metadata **among newly created documents in the selected period**, and the current status distribution of findings created within that period.

### 43.2 Authoritative sources, units and definitions

| Measure | Source / field | Population and date rule |
|---|---|---|
| Hồ sơ tài liệu mới | `documents.id`, `documents.created_at` + at least one version visible via RLS | Distinct stable document IDs **created within the period**; includes metadata-only records, not a claim of binary upload |
| Tài liệu có tệp tải lên | `document_files.uploaded_at` joined to `document_versions.document_id` | Distinct stable document IDs with **at least one attachment uploaded in the period**; secondary count gives individual file objects uploaded |
| Finding phát hiện | `findings.created_at` | Finding identity count created in the selected period, restricted to `finding_domain='document'` |
| Finding đã khắc phục | `findings.resolved_at` (or `closed_at` if resolved time missing), `status`, `action_decision` | Finding identity counts resolved/closed with `action_decision='required'`; excluded if merely triaged, assigned, decided no action, or only an individual action is completed |
| Finding tồn đọng hiện tại | `findings.status` | All visible document findings not in resolved/closed, **current status**, not historical snapshot |
| Hành động quá hạn hiện tại | `finding_actions.due_at/status` joined to a visible document finding | Non-done, non-cancelled actions overdue relative to the **current** Vietnam calendar date |
| Tài liệu mới theo đơn vị | `document_versions.issuing_department` for first visible version of each new document | Each stable document counted once; case-normalized department breakdown, missing counted separately |

User-specific report values must not be fabricated or inferred from sample figures. Dashboard reads the governed PostgreSQL function `public.home_document_finding_summary(date,date)` and respects each signed-in user’s **RLS-visible** versions, files and findings. Never use the service-role key or expose restricted document details through analytics. Reader and administrator counts may legitimately differ. No materialized public aggregate of private findings is permitted.

### 43.3 QA and boundary conditions

- Source queries use inclusive Vietnam local start/end calendar dates with a safe exclusive next-day timestamp in filtering, including days with zero activity.
- Sum of daily new documents equals headline new-document count; sum of department subtotals equals that count; sum of daily findings found equals the finding headline. Multiple document versions or multiple attachments may not inflate the distinct-document KPIs.
- Default 7-day snapshot on 2026-10-29 (Admin simulation): 1,837 new document identities, 0 attachments uploaded, 0 newly created document findings and 0 remediated findings; there are 35 unresolved document findings **currently** visible to Admin. The imported metadata-only records must not be described as 1,837 uploaded PDFs.
- Admin/Viewer simulated database read succeeded; Viewer is not shown restricted document findings. Transactional and RLS tests plus Vercel Next/TypeScript build do not replace authenticated browser layout, filter and drillthrough acceptance tests.

## 44. Executive Home visual hierarchy and APQC drill-down — 2026-10-29 *(historical design; section 45 supersedes the Home drill-down)*

**Audience:** CEO / COO for portfolio direction, departmental activity and exceptions; consistent role-restricted behavior for Editor/Viewer.

### 44.1 One unified top control center

- Replace the visually detached report header with one `WorkspaceShell.headerContent` for Home. The block contains **ADMIN CONTROL CENTER** (or the logged-in role label), the page purpose, the **7/30/90/custom-day selector**, a concise **cumulative portfolio strip**, and **four period KPIs**. Do not repeat the date filter and metric cards in the body.
- A clearly dated **01 / Kết quả trong kỳ** group keeps the four existing metric definitions intact (new document identities, document identities with file upload, new document findings, remediated document findings).
- The portfolio strip immediately above period KPIs displays **APQC L1/L2/L3 totals from one chosen reference framework**, enterprise process identities, overall document identities, and the logged-in role's current review/assigned-work/notification count. Explicitly label this strip **“Toàn bộ danh mục — không phụ thuộc bộ lọc ngày.”**
- Minimize unnecessary colors and repetitive frames. Use typography, compact dividers, whitespace, progressive hierarchy, and responsive 4→2-column KPI layout. Keep numerical values readable and distinguish time-scoped flows from current stocks.

### 44.2 L1 → L2 → L3 executive APQC explorer

- **Source:** only **“APQC catalogue with controlled PNJ interpretation”**, version **“Process Map workbook 2026-10-29”**. The database also has PCF Cross-Industry 8.0; combining both would double-count these levels and is **not allowed**.
- Default portfolio includes **13 L1 categories, 74 L2 process groups and 362 L3 processes**; mapped document counts are sourced solely from `document_apqc_mappings` joined to RLS-visible `document_versions`. Each stable `documents.id` is counted once within each group/process.
- First column selects an L1 category using a short controlled Vietnamese label; the middle column lists and selects its L2 children, ordered by linked document volume; the right column lists its L3 children, source APQC names, mapped-document counts, and clickable links to individual APQC Catalog pages. Selected nodes are visually clear, keyboard accessible and responsive (3 columns desktop, stacked on phones).
- The headline `mapped_l3 / total_l3` is an **APQC classification coverage ratio**, not process maturity, control compliance, process documentation completeness, policy effectiveness, or a target/actual KPI. The number of **mapped_documents** counts distinct document identities across all L3 nodes, while per-L1/L2 subtotals are individually deduplicated but **must not be blindly added across categories**.
- L1/L2/L3 coverage is a **cumulative, current inventory snapshot**, unchanged by Home's activity-period filter; source and semantic boundaries appear next to the report.

### 44.3 Operational depth and validation

- Section **03 / Diễn biến & ưu tiên xử lý** presents meaningful exception text derived from real data, followed by new-document distribution by issuing department, current unresolved finding/overdue-action signals, and document/finding time trends. All historical metrics continue to obey the selected Vietnam date window.
- Existing editor work queue and role-specific quick links stay below the executive report. Error/loading and zero-data states must not invent counts.
- Applied `supabase/migrations/20261029000002_home_executive_apqc_hierarchy.sql`: `home_apqc_hierarchy_summary()` returns `total_l1,total_l2,total_l3,mapped_l3,mapped_documents,level1[],level2[],level3[]`, under authenticated user RLS. No service key, bypass or public summary table.
- **Verification:** Admin and Viewer SQL simulations show 13/74/362, **68 mapped L3**, **1,149 distinct mapped document identities**. Summed L1 and L2 mapped L3 and counted nonempty L3 each reconcile to 68. Anonymous EXECUTE is denied; the returned measure is not proof of document effectiveness. Browser-authenticated/visual QA remains a separate gate.

## 45. Home simplification — remove APQC distribution section (2026-10-29)

- **Current scope overrides section 44:** Remove the entire three-column **“02 / PHÂN BỔ DANH MỤC THEO APQC”** Home section (L1 selector, L2 selector, L3 list, mapping coverage headline, explanatory footer and deep links within the retired panel). Do not replace it with another distribution chart or an empty placeholder.
- Retain one consolidated Home top panel: role-aware control-center heading, period picker, four **in-period** KPIs, and compact **cumulative** repository totals. The small APQC L1/L2/L3 count string in the portfolio strip is retained; it is *not* the retired drill-down.
- Renumber the former **03 / DIỄN BIẾN & ƯU TIÊN XỬ LÝ** body section to **02**. Its issuing-department distribution, current finding/action backlog, data completeness, time trends, dates and existing permission semantics remain unchanged.
- **Performance:** Home stops requesting the comprehensive `home_apqc_hierarchy_summary()` RPC and its L1/L2/L3 mapping payload. It uses a lightweight read of the PNJ-controlled `apqc_frameworks` entry plus `apqc_elements.level_number` up to level 3 to derive 13/74/362 header totals without reading document mappings. Failed/unavailable APQC header counts show em-dashes, not fabricated zeros.
- Delete the unused Home hierarchy React component and CSS. Existing database function/migration remains installed (no destructive rollback) but is no longer consumed by Home; Process Map and Catalog remain the navigation destinations for APQC details.
- **QA:** Confirm the section does not appear on desktop/mobile, the lower report is numbered 02, date filters and KPI counts still work, RLS is preserved, and the header's APQC totals match the PNJ reference. Actual authenticated browser QA must be tracked separately from compilation.
