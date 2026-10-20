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

The MVP has six demo accounts: two per system role.

### Viewer

- View published and effective processes/documents.
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

- MVP target: approximately 20–30 enterprise processes.
- The end-to-end demo domain remains open until real samples are supplied.
- Real source files may include Excel, CSV, PDF, and DOCX.
- Import design for enterprise samples remains open pending those files.

## 6. Information architecture

Primary workspace navigation is numbered and appears in this order:

1. **01. Home** — role-specific dashboard.
2. **02. Document** — private document library, versions, upload, and metadata.
3. **03. Process Map** — enterprise landscape, layered hierarchy, scope list, and relationship entry points.
4. **04. Relationship** — cross-process/context network separate from the hierarchy.
5. **05. Finding** — issue workflow, decisions, SLA, and collaboration.
6. **06. Catalog** — searchable and sortable enterprise processes and APQC references.
7. **07. Governance** — completeness, reviews, validity, acknowledgment, and APQC coverage.
8. **08. Action Log** — personal in-app action history generated from notification events.

The Action Log keeps the existing `/notifications` route, notification records, read/unread state, deep links, and RLS. Review and Admin capabilities remain permission-aware actions within the relevant workspaces rather than separate top-level tabs in the current MVP.

## 7. Process Map experience

### Enterprise Landscape

- Enterprise hierarchy is the default view.
- Top-level nodes show code, name, level/type, owner, lifecycle status, child count, document count, open-finding count, and review-overdue indicator.
- APQC Reference View is available as a separate mode and shows enterprise-process coverage per APQC element.

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
- Controlled document group/type.
- Version and lifecycle status.
- Linked process and process version.
- Owner, author, approver, language, access level, and readers.
- Validity and review dates.
- Change summary and superseded version.
- File name, storage key, MIME type, size, and checksum.
- Optional `document_abstract`; do not reuse the process Executive Summary.

### Initial document metadata configuration

- A new draft needs either a supported file or a manually entered Vietnamese title. The system creates the document code, initial draft version, creator, and file fields automatically; it never publishes the draft automatically.
- **Thông tin cơ bản** configures Vietnamese/English title, controlled document type/group, language, abstract, and keywords. The initial controlled taxonomy contains 23 document types in seven groups. When a type is selected, its canonical group takes precedence over a manually chosen group.
- **Phân loại & phạm vi áp dụng** configures an optional primary process link, applicability note, controlled legal entity/department/location/channel/product-service/employee-audience values, and governance tags.
- **Trách nhiệm & quyền truy cập** configures document owner, issuing department, access level, and a designated approver. The designated approver is planning metadata only; approval still follows the governed review workflow and four-eyes rule.
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
- PDF/image preview; Office download in the MVP.
- Use archive/soft-delete behavior from the UI.

### Document taxonomy

- Governance: Policy, Regulation, Standard, Decision, Delegation Matrix.
- Execution: Procedure, Work Instruction, Form/Template, Checklist.
- Communication: Announcement, Guidance, Training Material.
- Evidence: Meeting Minutes, Audit/Assessment Report, Incident Record, RCA Report.
- Planning/Project: Project Charter, Business Case, Plan.
- External/Legal: Law/Legal Basis, Contract, External Reference.
- Other.

Each document has one primary type and optional tags.

### Library management

- Search covers Vietnamese/English title, abstract, keywords, and issuing department.
- Filter by lifecycle status, controlled document type, document group, language, access level, risk rating, and owner.
- Sort by latest/oldest update, title, nearest review due date, and latest validity start date.
- Library cards show the governed metadata needed for quick triage: code/version, type/group, language, access level, risk, owner, issuing department, validity, review due date, keywords, files, and lifecycle status.
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
- Viewer sees only effective published content.
- Detailed collaborator-only draft visibility is deferred; Editors can see all drafts in the MVP.

### Compare

- Compare process/document metadata between versions.
- Highlight APQC mapping, ownership, applicability, reader, relationship snapshot, and attachment changes.
- Do not diff the internal contents of PDF/DOCX/XLSX/PPTX in the MVP.

## 15. Knowledge audience and acknowledgment

MVP audience is based on the three system roles, not organizational-group access.

- `Must know`: notification plus required acknowledgment.
- `Should know`: notification without acknowledgment requirement.
- `Restricted`: unavailable to the role.

Acknowledgment:

- User opens the exact effective version and selects “Tôi đã đọc và hiểu”.
- Store user, version, and timestamp.
- New versions require new acknowledgment.
- Dashboard shows completion and overdue acknowledgment.
- No quiz or electronic signature in the MVP.

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

- Exact duplicate.
- Semantic duplicate.
- Scope overlap.
- Potential conflict.
- Version conflict.
- Supersession candidate.
- Other.

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
- Viewer participants can comment and react.

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
- Role knowledge is modeled through controlled object relationships from business role to document, using “Bắt buộc phải biết” and “Nên biết / tham chiếu”.
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
