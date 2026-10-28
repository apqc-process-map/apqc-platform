# Process Map — MVP Tasks

Statuses use: TODO, BLOCKED, DONE, and PARTIAL. The EPIC sections below are the canonical current status; dated review snapshots are historical evidence and may contain superseded wording.

## EPIC 0 — Foundation

- [x] `DONE FND-001` Scaffold Next.js App Router with TypeScript.
- [x] `DONE FND-002` Configure lint, formatting, typecheck, and test commands.
- [x] `DONE FND-003` Add `.env.example` with placeholders only.
- [x] `DONE FND-004` Add secret/file ignore rules.
- [x] `DONE FND-005` Establish PNJ-inspired Process Map design tokens.
- [x] `DONE FND-006` Build desktop application shell and permission-aware navigation.
- [x] `DONE FND-007` Configure Vercel project linkage without committing credentials.

## EPIC 1 — Supabase and authentication

- [x] DONE AUTH-001 Link the single MVP Supabase project and migration workflow.
- [x] DONE AUTH-002 Create profile and system-role schema.
- [x] `DONE AUTH-003` Seed the user-approved demo mix: three Viewer and three Admin profiles securely.
- [x] DONE AUTH-004 Implement sign-in, session refresh, and sign-out.
- [~] PARTIAL AUTH-005 Add route/action authorization helpers.
- [~] PARTIAL AUTH-006 Define and test the initial RLS policy matrix.
- [~] PARTIAL AUTH-007 Verify the last author cannot approve their own draft.

## EPIC 2 — APQC reference

- [x] DONE APQC-001 Create framework, element, and metric migrations.
- [x] DONE APQC-002 Implement read-only APQC v8.0 Excel importer.
- [x] DONE APQC-003 Derive parent, level, and display order from hierarchy IDs.
- [x] `DONE APQC-004` Validate 2,017 elements, five levels, 13 categories, and no duplicate PCF IDs.
- [x] `DONE APQC-005` Validate and import 3,284 metric definitions.
- [x] `DONE APQC-006` Store and display APQC attribution/version metadata.
- [x] `DONE APQC-007` Add APQC reference search and detail view.

## EPIC 3 — Enterprise processes

- [x] DONE PROC-001 Create process identity, aliases, and version migrations.
- [x] DONE PROC-002 Implement generated PROC-000123 codes.
- [x] DONE PROC-003 Add hierarchy, level types, display order, and cycle prevention.
- [x] DONE PROC-004 Add five Executive Summary fields and conditional validation.
- [x] DONE PROC-005 Add Owner, Steward, SME, Approver, and reader assignments.
- [x] DONE PROC-006 Add applicability and controlled vocabularies.
- [x] DONE PROC-007 Add inheritance indicators and override behavior.
- [x] DONE PROC-008 Add many-to-many APQC mapping and verification.
- [x] DONE PROC-009 Add publication-gate validation.
- [x] DONE PROC-010 Add transparent completeness scoring.
- [~] `PARTIAL PROC-011` Seed representative enterprise processes from supplied evidence: 11 L0–L2 nodes are live; the 20–30 target needs additional evidenced process samples.

## EPIC 4 — Process Map and discovery

- [x] DONE MAP-001 Build Enterprise Landscape from Supabase process data.
- [x] DONE MAP-002 Build canvas-first L0–L4 exploration with in-map search and level filters (replaces the retired left value-chain navigator).
- [x] DONE MAP-003 Add breadcrumb and URL-persisted selected path.
- [x] DONE MAP-004 Add all-descendants scope Tree/Table.
- [x] DONE MAP-005 Add scoped expand-all behavior.
- [x] DONE MAP-006 Add accessible hover/focus preview.
- [x] DONE MAP-007 Add persistent process detail panel.
- [x] DONE MAP-008 Add APQC Reference/Coverage view.
- [x] DONE MAP-009 Build global search and Process Catalog with URL-backed filters, sorting, and deep links.
- [~] PARTIAL MAP-010 Verify long names, deep hierarchy, empty nodes, and 1024 px layout.
- [x] DONE MAP-011 Add Admin-only governed process metadata and tooltip editing with version-safe drafts.

## EPIC 5 — Relationships and context

- [x] DONE REL-001 Create context-object and relationship migrations.
- [x] DONE REL-002 Seed controlled relationship groups/types and inverse labels.
- [x] DONE REL-003 Add Business Object catalog and process input/output flows.
- [x] DONE REL-004 Add System, Risk, KPI, and Business Role catalogs.
- [x] DONE REL-005 Implement relationship propose/verify/reject workflow.
- [x] DONE REL-006 Build inbound/outbound centered network.
- [x] DONE REL-007 Build filterable relationship table and legend.
- [x] DONE REL-008 Add one-hop default and explicit graph expansion.
- [x] DONE REL-009 Keep hierarchy and cross-links visually separate.

## EPIC 6 — Documents and versions

- [x] DONE DOC-001 Create document, version, file, and process-link migrations.
- [x] DONE DOC-002 Seed controlled document taxonomy.
- [x] DONE DOC-014 Configure PRD-aligned document intake metadata plus library filters and sorting.
- [x] DONE DOC-015 Display Nhóm tài liệu read-only, derived from Loại tài liệu; preserve legacy unclassified draft groups.
- [x] DONE DOC-016 Add exclusive multi-selection of active business roles in Phải biết, Nên biết / tham chiếu, Không áp dụng; unselected = Chưa xác định.
- [x] DONE DOC-017 Persist classifications with the governed Admin-only atomic `set_document_knowledge_audience` function without deleting prior relation rows.
- [x] DONE DOC-018 Display verified business-role knowledge groups on Document cards and Tab 05 Role Knowledge.
- [x] DONE DOC-003 Configure private Supabase Storage bucket and policies.
- [x] DONE DOC-004 Validate upload MIME type, extension, size, and checksum before direct private Storage upload.
- [x] DONE DOC-005 Add PDF/image preview and Office download.
- [x] DONE DOC-006 Require at least one process link before document publication.
- [x] DONE DOC-007 Implement role-gated lifecycle, validity, review cadence, and scheduling.
- [x] DONE DOC-008 Prevent overlapping effective version intervals.
- [x] DONE DOC-009 Add field-level metadata version comparison.
- [x] DONE DOC-010 Add review comments, replies, mentions, and resolution.
- [x] DONE DOC-011 Add rejection reason and four-eyes approval.
- [x] DONE DOC-012 Add required-reading assignment and acknowledgment.
- [~] `PARTIAL DOC-013` Sample inspection and governed direct upload are complete for DOC/DOCX/PDF/XLSX; a reusable batch importer still needs an agreed structured import contract.


## E0-E6 pending reasons (verified 2026-10-16)

- AUTH-003 is complete with the user-approved mix of three Admin and three Viewer accounts. No credentials are stored in Git. There is no Editor demo account, so Editor behavioral testing remains pending.
- AUTH-005/006/007 remain partial: route protection and database gates exist; Admin and Viewer access were exercised, while Editor and complete four-eyes behavioral tests remain.
- APQC-004/005/006 are complete: the supplied licensed workbook was validated and imported as 2,017 elements, 3,284 metrics, five levels, and 13 categories, with attribution/version metadata and no duplicate IDs or missing parents.
- APQC-007 remains partial: Catalog search and attribution display use imported records, but a dedicated APQC detail screen is not implemented.
- PROC-011 is partial: the supplied installment procedure supports 11 evidenced L0–L2 nodes; no additional nodes are fabricated to reach the original 20–30 target.
- MAP-001/005/006/009/010 remain partial because the map still uses synthetic fixtures and full browser/long-text QA is not complete.
- REL-006/008 are implemented: the relationship table, filters, centered direct-link graph, document focus, and explicit neighboring-link expansion exist; the current milestone adds coded nodes and labeled connector lanes.
- DOC-007 remains partial: upload, preview/download, role-gated lifecycle actions and comparison now exist; metadata editing for validity/review scheduling is not yet exposed as a complete form.
- DOC-013 is partial: representative DOC/DOCX/PDF/XLSX files were inspected and uploaded; reusable batch-import mapping/error rules remain undefined.

## EPIC 7 — Findings & Actions

- [x] `DONE FIND-001` Create finding, link, participant, reaction, and event migrations.
- [x] `DONE FIND-002` Implement generated `FND-000123` codes.
- [x] `DONE FIND-003` Implement finding workflow and role transitions.
- [x] `DONE FIND-004` Add threaded comments, mentions, and decision comments.
- [x] `DONE FIND-005` Add Agree/Disagree/Need-more-information reactions.
- [x] `DONE FIND-006` Add assignment, participants, watchers, and due dates.
- [x] `DONE FIND-007` Add severity-based SLA defaults and override.
- [x] `DONE FIND-008` Add activity timeline.
- [x] `DONE FIND-009` Link resolution evidence to process/document versions.
- [x] `DONE FIND-010` Seed representative manual findings for the demo.
- [ ] `BLOCKED FIND-011` Define AI analysis only after data policy and sample review.

## EPIC 8 — Dashboards and Action Log

- [x] `DONE DASH-001` Build Viewer Home.
- [x] `DONE DASH-002` Build Editor Home with personal work queues.
- [x] `DONE DASH-003` Build Admin Home.
- [x] `DONE DASH-004` Create governance SQL views/functions.
- [x] `DONE DASH-005` Build governance dashboard and drill-down.
- [x] `DONE DASH-006` Create finding-aging/dashboard SQL views.
- [x] `DONE DASH-007` Build Finding dashboard and drill-down.
- [x] `DONE NOTIF-001` Create notifications schema and event service.
- [x] `DONE NOTIF-002` Build notification center with read/unread and deep links.
- [x] `DONE NOTIF-003` Add review, reading, role, finding, and due-date notifications; daily pg_cron runs at 08:00 Asia/Ho_Chi_Minh.

## EPIC 9 — Verification and deployment

- [x] `DONE QA-001` Transactionally test lifecycle, publication gates, completeness, SLA, and inverse labels.
- [~] `PARTIAL QA-002` Test RLS for all three roles and private Storage.
- [~] `PARTIAL QA-003` Test forbidden direct client mutations.
- [~] `PARTIAL QA-004` Test empty, loading, error, and long-text states; Production now covers empty L3/L4, inline workflow validation errors, and long Process tooltip content, while route-loading and remaining module-specific empty/error states remain.
- [~] `PARTIAL QA-005` Run accessibility checks and keyboard navigation review; Process tooltip focus/Escape behavior and visible form focus ring passed, while a complete route-by-route keyboard/semantic audit remains.
- [~] `PARTIAL QA-006` Run visual QA at 1024, 1280, and wide desktop widths; critical Process Map/Relationship/Document surfaces and all main routes passed horizontal-overflow checks, while browser-specific Edge evidence remains.
- [~] `PARTIAL QA-007` Run the golden demo Playwright flow in Chrome and Edge.
- [x] `DONE QA-008` Run security review for Auth, RLS, uploads, signed URLs, and secrets.
- [x] `DONE DEPLOY-001` Configure Vercel environment variables.
- [x] `DONE DEPLOY-002` Deploy and verify the golden flow against Supabase.
- [x] `DONE DEPLOY-003` Update `PROJECT_STATE.md` with verified implementation status.

## Review snapshot — verified after PR #6

### Completed since the previous review

- [x] NOTIF-001 — Notifications schema and finding event service are implemented and verified in Supabase.
- [x] DATA-FIX — Vietnamese demo data for 3 findings and 8 relationship types was repaired in Supabase and versioned in migration `20261016094000_repair_vietnamese_demo_data.sql`.
- [x] DEPLOY — PR #5 and PR #6 were merged to `main`; production deployment is READY.

### Current partial tasks

- AUTH-005/006/007 — Route/RLS foundations exist; Editor role and complete four-eyes behavioral testing remain because the approved demo mix has no Editor account.
- APQC-007 — Catalog search and attribution are available; dedicated APQC detail view remains.
- FIND-003/004/005/006/008 — Database foundations exist; workflow actions, comments, reactions, assignment UI, and timeline UI remain.
- DASH-002/005/007 — Role/dashboard foundations exist; Editor-specific home and drill-down interactions remain.
- NOTIF-002 — Notification list and deep links exist; mark-read/unread action remains.
- NOTIF-003 — Finding event and due-soon notifications exist; review, reading, role-assignment, and complete due-date scheduling remain.
- DOC-004/005/007/009 — Upload validation, preview/download, full lifecycle, and field-level comparison remain.
- MAP-001/005/006/009/010 and REL-006/008 — Synthetic map/relationship fixtures and full visual/interaction QA remain.
- QA-002/003/007/008 — Viewer/Admin checks and security baseline exist; Editor, Storage, Edge, and full upload/signed-URL testing remain.

### Blocked by external input or approved scope

- PROC-011 and DOC-013 — Need representative enterprise/document samples.
- FIND-011 — AI analysis remains deferred until data policy and samples are approved.
- LATER-001 through LATER-010 — Deferred backlog.

### Next implementation order

1. Add notification mark-read/unread action and verify Viewer RLS.
2. Add finding workflow actions, assignment, comments/reactions, and activity timeline.
3. Add APQC detail view and relationship/process drill-down.
4. Complete private document upload, signed preview/download, and lifecycle actions.
5. Run accessibility, visual, Edge, Storage, and golden-flow QA.
## Deferred backlog

- [ ] `BLOCKED LATER-001` Microsoft Entra ID SSO.
- [ ] `BLOCKED LATER-002` Full audit trail and retention policy.
- [ ] `BLOCKED LATER-003` Relationship version history.
- [ ] `BLOCKED LATER-004` Fine-grained organizational/individual ACL.
- [ ] `BLOCKED LATER-005` File-content search and extraction pipeline.
- [ ] `BLOCKED LATER-006` AI duplicate/overlap/conflict detection.
- [ ] `BLOCKED LATER-007` Operational KPI observations and dashboards.
- [ ] `BLOCKED LATER-008` Saved views, bookmarks, and exports.
- [ ] `BLOCKED LATER-009` Mobile UI.
- [ ] `BLOCKED LATER-010` BPMN viewer/editor.


## Demo workspace verification — 2026-10-16

- [x] Seeded demo catalogs, process flows, relationships, findings, comments, reactions, reading assignments, acknowledgments, and notifications in Supabase.
- [x] Fixed finding notification trigger to use profiles.role instead of the nonexistent profiles.system_role.
- [x] Added safe cleanup coverage to scripts/delete-demo-processes.sql.
- [ ] Replace synthetic demo records with representative enterprise samples when supplied.


## Review snapshot — 2026-10-19

- [x] APQC-007 — Catalog APQC rows now open a protected detail page with hierarchy, parent navigation, description, and imported metrics.
- [x] NOTIF-002 — Notification center now supports per-item and bulk mark-as-read through server actions scoped to the authenticated recipient.
- [x] BUILD — Removed build-time Google Font fetching; production build uses local system font fallbacks and succeeds offline.
- [ ] Remaining partial work continues with finding workflow UI, document upload/preview/lifecycle, and the broader QA matrix.

## Review snapshot - 2026-10-19 continuation

- [~] FIND-003/006/008 - Finding detail now supports RLS-governed status/assignment updates and displays activity timeline; full role transition matrix and comment workflow remain incomplete.
- [x] FIND-005 - Finding detail exposes Agree/Disagree/Need-more-information actions backed by existing own-reaction RLS.
- [~] DOC-005 - Authenticated server route now creates 60-second signed links for stored files; inline PDF/image preview and Office-specific UX remain.
- [x] REL-006/008 - Relationship table, filters, centered interactive graph, document focus, and explicit neighboring-link expansion are implemented.
- [ ] QA-004/005/006/007 - Build/lint pass; authenticated browser, accessibility, and multi-viewport QA still require a signed-in session and browser coverage.
- [ ] QA-002/008 - RLS baseline is documented; comment-write policy and full Storage/security matrix remain pending approval/verification.

## Review snapshot - 2026-10-19 comment collaboration

- [x] FIND-004 - Added finding comment creation for creator, assignee, and participants, with RLS policies and server action.
- [x] SECURITY - Verified comment collaboration policies and authenticated grants in Supabase; anonymous access remains absent.
- [ ] FIND-003/006/008 - Full transition matrix, participant assignment UI, and richer timeline remain partial.


## Review snapshot — 2026-10-19 full remaining-task pass

### Completed and verified

- [x] MAP-001/005 — Process Map reads the 10 disposable Supabase processes, supports scoped descendants, search, card/table views, breadcrumbs, and URL-persisted selection.
- [x] REL-006/008 — Centered inbound/outbound graph supports object selection, one-hop default, explicit two-hop expansion, and controlled-type legend.
- [x] DOC-004/005/009 — Server validates size, MIME, matching extension and SHA-256; private signed preview/download and field-by-field metadata comparison are implemented.
- [x] FIND-003/005/006/008 — Explicit role transitions, assignment, participants/watchers, reactions, readable timeline and comments are implemented.
- [x] QA-001 — `supabase/tests/lifecycle_and_notifications.sql` passed in a rollback transaction for SLA defaults, completeness output, inverse labels, publication gate and four-eyes approval.
- [x] SECURITY — Supabase Advisor findings for executable `SECURITY DEFINER` functions and mutable function `search_path` were fixed by migration `20261019012443_notification_security_hardening.sql`. The remaining Advisor warning is the account-level leaked-password protection setting.
- [x] DEMO-DOC — Three disposable documents/four versions now cover draft, in-review and effective states; all have process links and the cleanup script removes metadata, reading assignments and test uploads.

### Still partial with verified reason

- AUTH-005/006/007, QA-002/003 — Admin and Viewer boundaries are verified, including a Viewer forbidden insert and zero-row forbidden document update. Editor behavior cannot be executed because the user-approved six-account mix has no Editor account.
- MAP-006/009/010, QA-004/005/006/007 — Data-driven UI and build states exist, but authenticated Chrome/Edge keyboard and 1024/1280/wide visual runs are not complete in the available non-interactive web fetch.
- DOC-007 — Lifecycle changes are role-gated in both Server Actions and a database trigger; a complete metadata editor for validity/review dates and scheduled publication remains.
- DASH-002/005/007 — Existing role summaries and drill-down links remain partial; no new real-data dashboard requirements were inferred.
- [x] NOTIF-003 — Assignment/review/reading/finding triggers and due-notification functions are live; `pg_cron` job `process-map-due-notifications` is active at 01:00 UTC (08:00 Asia/Ho_Chi_Minh).
- QA-008 — Security Advisor and policy review passed except leaked-password protection; actual private file upload/preview remains unexecuted because no binary sample and authenticated browser upload session were available.

### Blocked by required external input or deferred scope

- PROC-011 — Requires 20–30 representative enterprise processes; synthetic records are not relabeled as real data.
- DOC-013 — Requires representative Excel/CSV/PDF/DOCX samples before importer design.
- FIND-011 — Requires approved data-handling policy and samples before AI analysis.
- LATER-001 through LATER-010 remain intentionally deferred by scope.

## Review snapshot — 2026-10-19 rich demo metadata

- [x] DEMO-DATA — Applied and verified migration `20261019015542_rich_demo_metadata.sql`: 10/10 process versions have all five Executive Summary fields; 10/10 have applicability; 6 controlled tags have 15 process assignments; 32 verified demo relationships; 5 typed findings; and document metadata/tags are populated.
- [x] MAP-007 — Process Map now loads the rich process metadata from Supabase and displays business purpose, scope, decision points, accountability, access, review date, systems, applicability and tags.
- [x] CLEANUP — `scripts/delete-demo-processes.sql` now removes generic object metadata/tag assignments before deleting demo records.
- [ ] Remaining QA-004/005/006/007 and QA-008 limitations are unchanged: authenticated browser, keyboard, multi-viewport and real-file upload verification still require an available signed-in browser session/sample.


## Review snapshot — 2026-10-19 value-chain Process Map

- [x] `MAP-006` — Center landscape now renders explicit L0–L4 bands and exposes a five-section process overview on mouse hover and keyboard focus; Escape dismisses the preview and click selects the process.
- [x] `MAP-009` — The value-chain view reflects live enterprise process metadata rather than synthetic hierarchy cards.
- [~] `PARTIAL MAP-010 / QA-004/005/006/007` — Responsive overflow, focus states, long-text preview layout, empty L3/L4 states, and reduced-motion support are implemented. Authenticated Chrome/Edge visual runs at 1024/1280/wide remain pending.
- [ ] Data note — Current demo data contains L0–L2 only and all `parent_process_id` values are null. L3/L4 are intentionally shown as empty and no hierarchy links are fabricated.

- [x] `MAP-010 polish` — Removed redundant center-map titles, compacted controls and level spacing, and moved the five-section preview to a viewport-fixed, scrollable layer so long Vietnamese text is not clipped by the map panel.


## Review snapshot — 2026-10-19 Process Map metadata editor

- [x] `MAP-002` — Removed the left value-chain navigator. The primary canvas now contains a code/name/owner/tag/content search bar and L0–L4 level filters, with all matched process blocks kept in their level bands.
- [x] `MAP-006` — Each block exposes the five Executive Summary fields on hover and keyboard focus; the same content is persistently readable in the right detail panel.
- [x] `MAP-011` — Admins can edit the five tooltip sections plus core process metadata from the right panel. Draft/rejected versions update in place; a published/current version is preserved and saving creates draft v+1.
- [x] `SECURITY` — Migrations `20261019064856_process_map_metadata_editing.sql` and `20261019065602_consolidate_draft_applicability_policies.sql` are applied in Supabase. RLS permits only Admins to create/update their governed process drafts and copy related assignments, mappings, applicability and tags. Cloned APQC mappings are set to `proposed` for re-verification.
- [~] `QA-002/004/005/006/007/008` — Rolled-back Admin/Viewer RLS tests and a Vercel Preview production build/TypeScript check passed. Authenticated browser edit flow, keyboard/hover visual checks, and wide/1024-px checks remain to be executed for this enhancement.


## Review snapshot — 2026-10-19 compact Process Map header

- [x] `MAP-010` — Process Map now combines the landscape label, page name, description, return link, Enterprise/APQC switch, and selected-process breadcrumb in one compact workspace control block.
- [x] `UX` — The block is expanded by default and can be collapsed or expanded with an accessible stateful button; the compact title row remains visible while collapsed.
- [~] `QA-004/005/006/007` — Layout includes a 1024-px fallback for wrapped controls. Authenticated visual and keyboard browser coverage remains pending.


## Review snapshot — 2026-10-19 simplified Process Map toolbar

- [x] `MAP-010` — Removed the return-to-menu action, “Process Map” title, L0–L4 process-count summary, helper text, and selected-process breadcrumb from the Process Map header.
- [x] `UX` — The expanded workspace card now contains only Process Landscape, left-aligned Enterprise/APQC Reference controls, and the live enterprise-process search field. The collapse control remains available.
- [~] `QA-004/005/006/007` — Added a 1024-px wrapping fallback; authenticated visual/keyboard browser coverage remains pending.


## Canonical remaining-work audit — 2026-10-20

### Completed in this audit

- [x] MAP-009 — Catalog now searches, filters and sorts Enterprise/APQC records and deep-links to Process Map/APQC detail.
- [x] DASH-002 — Editor Home exposes personal drafts, assigned findings and unread actions while remaining RLS-scoped.
- [x] DASH-005 — Governance cards drill into APQC coverage, overdue review details and open findings.
- [x] DASH-007 — Finding dashboard cards and filters drill into open, overdue and assigned-to-me queues.
- [x] DOC-007 — Intake exposes validity/review scheduling metadata; lifecycle mutation remains role-gated and database publication gates enforce scheduling/four-eyes constraints.
- [x] QA-008 — Repository security review found no new secret, auth bypass, service-role exposure or private-file public URL; Supabase RLS and signed-file boundaries remain unchanged.
- [x] QUALITY — Full ESLint has zero errors and production build/type-check passes all 14 routes.

### Remaining executable QA

- [~] MAP-010 / QA-004 / QA-005 / QA-006 / QA-007 — Code and responsive fallbacks exist; authenticated 1024/1280/wide visual, keyboard and Chrome/Edge golden-flow evidence remains incomplete.
- [~] AUTH-005 / AUTH-006 / AUTH-007 / QA-002 / QA-003 — Admin and Viewer boundaries are verified; Editor behavior cannot be fully evidenced because the approved six-user set has no Editor account.

### External or policy blockers

- [ ] PROC-011 — Requires representative real enterprise-process samples; synthetic data will not be relabeled as real.
- [ ] DOC-013 — Requires representative Excel/CSV/PDF/DOCX source samples before importer design.
- [ ] FIND-011 — Requires approved data-handling policy and samples before AI analysis.
- [ ] LATER-001 through LATER-010 — Explicitly deferred/non-MVP scope; completing them requires a product-scope decision rather than routine implementation.


## Relationship wording and required reading — 2026-10-20

- [x] REL-UX — Replace unexplained “Controlled type / Có hướng” wording with “Loại quan hệ chuẩn”, Source → Target guidance, inverse labels, and a concrete business example.
- [x] DOC-READ-001 — Add a personal required-reading area with search, status filters, assignment metadata, secure file access, and acknowledgment action.
- [x] SEC-READ-001 — Scope reading-assignment and acknowledgment SELECT policies to the recipient or Editor/Admin; allow acknowledgment INSERT only for the recipient.


## Relationship coded-lane visual refinement — 2026-10-20

- [x] REL-UX-002 — Show governed codes on process, document, role, system, risk, KPI, business-object, and finding nodes when available.
- [x] REL-UX-003 — Place the controlled Source → Target label directly on each inbound/outbound connector.
- [x] REL-UX-004 — Separate direct relationship lanes from neighboring-link expansion and add a laptop-width reflow that prevents connector/card overlap.
- [x] QA-REL-002 — Vercel Preview passed authenticated center switching, document focus, neighbor expansion, connector-label rendering, zero console errors, and no horizontal/board overflow at 1024 px and 1280 px.


## Relationship arrow endpoint polish — 2026-10-20

- [x] REL-UX-005 — Replace rigid filled arrowheads with rounded connectors, hollow source points, open target chevrons, and softened rail junctions.
- [x] REL-UX-006 — Preserve the source-to-target endpoint grammar for inbound, outbound, hover/focus, and laptop reflow states.
- [x] QA-REL-003 — Vercel Preview verified endpoint direction, connector/card alignment, 2 px rounded strokes, hollow source points, open target chevrons, 1024 px compact reflow without horizontal overflow, center switching/drill-down, and zero console errors.


## Relationship metadata intake — 2026-10-21

- [x] REL-META-001 — Audit Process, Document, Finding workflow, and Relationship input surfaces against PRD/data model; Process and Document forms already cover their governed MVP fields, while Relationship lacked an end-user create/edit path.
- [x] REL-META-002 — Add compact Relationship create/edit metadata form for Source, controlled type, Target, optional label, business description, evidence, validity dates, status, and automatic audit identity/timestamps.
- [x] REL-META-003 — Add Server Action validation for UUID/type allowlists, active endpoint existence, self-links, duplicate tuples, dates, lengths, role workflow, and required evidence before verification.
- [x] REL-META-004 — Apply Supabase migrations 20261021000023 through 20261021000026 for trigger validation, unique/integrity constraints, audit indexes, and consolidated Editor/Admin RLS.
- [x] SEC-REL-001 — Rollback-only database probes passed: Admin create/update is allowed with audit stamping; Viewer create/update is denied; no probe data persisted.
- [x] QA-REL-004 — Vercel Preview passed Admin create/edit rendering, existing metadata prefill, Source/Target controlled-type filtering, Viewer read-only controls, 1280/1024 px overflow checks, and zero console errors.
- [~] QA-REL-005 — Editor-specific browser flow remains unexecuted because the approved six-user account set contains no Editor profile; Editor RLS is implemented and policy-inspected.


## Layered Process metadata card — 2026-10-21

- [x] PROC-META-001 — Audit Process Map against the M-Files reference and distinguish Business Process selection from Document metadata.
- [x] PROC-META-002 — Expand the Process Map read model for hierarchy, assignments, allowed roles, applicability dimensions, systems, APQC mapping detail, lifecycle dates, actors, and audit timestamps.
- [x] PROC-META-003 — Replace the partial right panel with six layered metadata sections that keep every property visible.
- [x] PROC-META-004 — Add explicit missing-field rows, overall completion, per-section missing counts, and system-field labels.
- [~] QA-PROC-META-001 — Authenticated Vercel Preview passed data loading, six-section rendering, process switching, long Executive Summary values, explicit missing states, keyboard dismissal, and desktop visual review. Production smoke test remains pending until PR merge; an explicit 1024 px browser run remains in the broader multi-viewport QA matrix.
## 2026-10-21 — Document Findings & Action Tracker

- [x] DONE FIND-012 Document-first 06 workspace, with manual overlap, duplication, version/effective-date and relationship conflict types and multiple version-linked evidence records.
- [x] DONE FIND-013 Require explicit action decision with justification for no-action disposition.
- [x] DONE FIND-014 Create action tracker with assignee, due date, status, progress, blockers, completion evidence and database closure guards.
- [x] DONE FIND-015 Preserve legacy general finding records in the database **without** an all-findings/single-document switch on tab 06.
- [~] PARTIAL QA-FIND-01 Preview TypeScript/build and transactional Supabase workflow tested; authenticated end-to-end browser interactions and attachment evidence input require user-session QA.
- [ ] BLOCKED FIND-011 AI extraction, automatic duplicate and conflict detection requires policy approval and representative file samples; not launched.

## 2026-10-21 — Cross-document-only findings scope

- [x] DONE FIND-016 Restrict tab 06 to findings with at least two distinct documents; remove legacy/general findings view from this tab without deleting its records.
- [x] DONE FIND-017 Enforce two distinct document identities in the create-finding action, for every issue type including Other.
- [x] DONE FIND-018 Prevent closing a document finding without two different linked documents at the database gate.
- [x] DONE DEMO-FIND-01 Verify and reuse **8 cross-document DEMO findings**, **16** draft metadata-only demo documents, **16** fictional version excerpts, and **10** actions mapped to the existing 10 enterprise processes; no duplicate seeding.
- [x] DONE QA-FIND-02 Supabase rolled-back test: closure rejects v1/v2 of the same document, accepts evidence from two different documents; all eight seeded examples satisfy the rule.
- [x] DONE QA-FIND-03 Vercel preview and production build/type-check passed for PR #46 (commit `eca17a0`).
- [~] PARTIAL QA-FIND-04 Full authenticated browser create/edit/action-progress/close workflow and role-specific Editor QA remain outstanding; no real-file conflict detection has been tested.


## 2026-10-21 — Loading and navigation performance

- [x] PERF-001 — Inspect production Vercel errors, Next render mode, account lookup, Supabase gateway latency, Vercel/Supabase regions and repeated page fetches.
- [x] PERF-002 — Use request-time boundary for authenticated RSC; replace network `getUser()` reads with validated `getClaims()` and preserve profile authorization.
- [x] PERF-003 — Convert search/filter form GET navigations and internal preview/edit links to Next router transitions.
- [x] PERF-004 — Replace nine-route eager sidebar prefetch with hover/focus prefetch; improve route loading fallback.
- [x] PERF-005 — Parallelize Documents/Relationships independent data reads and reuse Finding document metadata.
- [x] PERF-006 — Configure Sydney Vercel Functions region to match Supabase; preview region verified.
- [ ] PERF-QA-001 — Validate login/logout/refresh, expired JWT refresh, Viewer/Admin/Editor route protection and RLS in authenticated browsers.
- [ ] PERF-QA-002 — Compare before/after actual browser page transition P75, function TTFB, LCP, INP; check Vietnam client latency and consider alternative region if worse.
- [ ] PERF-QA-003 — Observe the first 24h runtime PPR errors and navigation logs after Production; target zero `blocking-prerender-random` and `HANGING_PROMISE_REJECTION`.
- [ ] PERF-QA-004 — Verify full user workflows across Documents/Findings/Relationships filter/create/edit/preview/refresh after soft-navigation changes.


## 2026-10-21 — Performance follow-up verification

- [x] PERF-007 — Preserve refreshed session cookies across redirect and add private/no-store headers for pinned SSR client.
- [x] PERF-008 — Parallelize independent Finding detail queries and Role Knowledge relationship reads; prevent unbounded Finding event history reads.
- [x] PERF-009 — Add nonblocking, PII-free server-side slow-route and auth latency instrumentation.
- [ ] PERF-QA-005 — Exercise actual authenticated token-refresh, redirect, and protected-route flows; verify cookie updates and Cache-Control response headers.
- [ ] PERF-QA-006 — Use new `apqc_slow_page` / `apqc_slow_auth` logs after real traffic to identify remaining slow routes; record P75 latency and compare pre/post request durations by a representative user session.
- [ ] PERF-QA-007 — Browser smoke test Finding detail, role selection, 100-event history cap and existing action edit permissions.

## 2026-10-21 — Tab 02 Document role knowledge release (PR #50)

- [x] DOC-KNOW-001 — Confirm 23 controlled types in 7 groups, 3 active business roles, and 6 original confirmed Must/Should relationships before the change.
- [x] DOC-KNOW-002 — Derive canonical group automatically; remove editable group control; retain saved legacy group for untyped documents.
- [x] DOC-KNOW-003 — Three multi-select role lists with exclusive group membership, plus Chưa xác định as an unselected state.
- [x] DOC-KNOW-004 — Apply migration `20261021104055_document_knowledge_audience.sql` and verify Admin-only save and new Not Applicable relationship type.
- [x] DOC-KNOW-005 — Preview build/TypeScript READY; rollback-only Admin assignment and reclassification tests pass, Viewer mutation is denied; Production commit `9868f9726f604aa2d7000a88e59f8b760ead0ece` READY.
- [x] DOC-KNOW-006 — Confirm 20 document versions and six original verified knowledge links remain; SQL tests leave no persistent test data.
- [ ] DOC-KNOW-QA-001 — Authenticated Admin browser creation, editing, reopening, multi-selection and changing/removing classifications.
- [ ] DOC-KNOW-QA-002 — Check Tab 05 and Document cards after actual role edits, including restricted document placeholders.
- [ ] DOC-KNOW-QA-003 — Confirm Viewer cannot mutate; Editor sees the role groups read-only; knowledge classifications do not create user reading/notification assignments.
- [ ] DOC-KNOW-QA-004 — Real signed-in Production browser smoke test; successful deployment/build alone does not prove E2E correctness.

## 2026-10-21 — Tab 02 document terminology and presentation QA

- [x] DOC-COPY-001 — Audit 23 controlled document type labels and seven groups; eliminate duplicate synonyms and unclear combined captions.
- [x] DOC-COPY-002 — Apply in-place migration of nine `document_type` Vietnamese labels while preserving UUID/code/group mappings and existing version links.
- [x] DOC-COPY-003 — Fix read-only derived group display spacing/line breaks for all viewports; clarify the no-type state.
- [x] DOC-COPY-004 — Centralize Vietnamese group/lifecycle/access/risk/language label mapping and date formatting; use in Document filters, cards and version comparison.
- [x] DOC-COPY-005 — Translate file upload form and remaining mixed-language metadata captions; keep independent scope/audience/access semantics distinct.
- [x] DOC-COPY-006 — Fix case-sensitive group filtering to include existing mixed-case `document_group` codes.
- [ ] DOC-COPY-QA-001 — Authenticated browser test: create, select all groups/types, change type, save/reopen, check group display/spacing on desktop/mobile.
- [ ] DOC-COPY-QA-002 — Cross-check card and filter results, all lifecycle labels, document comparisons, and file attachment upload on Vercel Production.
- [ ] DOC-COPY-QA-003 — Check keyboard/focus/contrast and narrow layouts; run Admin and Viewer sessions (and Editor when an account is available).

### 2026-10-21 — Deployment blocked by Vercel daily quota

- [x] DOC-COPY-007 — GitHub PR #52 merged into main, commit `ad9ee0207ee9d46fc6b687e632e971b27a7d691e`; Supabase 23 types / 7 groups / 20 versions / 0 broken type links verified.
- [x] DOC-COPY-DEPLOY-001 — Historical Vercel daily quota blocker cleared; subsequent main deployments reached READY and the Production alias is serving current main.
- [x] DOC-COPY-DEPLOY-002 — Later main commits passed Next.js production build/TypeScript and reached Vercel Production READY.
- [ ] DOC-COPY-QA-004 — Finish signed-in Production UI/visual workflows once deployment is actually READY.

## 2026-10-22 — Metadata-driven Views and shared property card

- [x] META-VIEW-001 — Add governed Document Views for effective, review-due, missing-metadata, and process-linked documents.
- [x] META-VIEW-002 — Add result grouping by type, primary process, status, and owner.
- [x] META-VIEW-003 — Add indirect search through RLS-visible process, applicability, tag, and role-knowledge context with a visible result reason.
- [x] META-CLASS-001 — Define version-controlled, Class-specific Document required-property rules without enabling custom metadata fields.
- [x] META-CARD-001 — Use a shared grouped metadata-card renderer for Process and Document while retaining object-specific schemas.
- [x] QA-META-VIEW-001 — Authenticated Production verification passed for View switching, indirect Process search, explanation chips, Document/Process metadata cards, explicit missing-property state, Vietnamese labels, and browser console health. Explicit 1024 px viewport coverage remains in the broader responsive QA matrix.
## 2026-10-22 — Finding workflow validation UX

- [x] FIND-WF-UX-001 — Trace the Production failure to Finding FND-000024: resolved/closed was rejected because the resolution summary was blank and all three active corrective actions were incomplete.
- [x] FIND-WF-UX-002 — Preflight closing requirements in the Server Action and redirect expected validation failures back to the workflow form with actionable Vietnamese messages.
- [x] FIND-WF-UX-003 — Preserve the database closure trigger and RLS as the final authorization/data-integrity boundary.
- [x] FIND-WF-UX-004 — TypeScript, targeted ESLint, and Next.js production build passed.
- [x] FIND-WF-UX-QA-001 — Authenticated Production QA passed: missing-summary and incomplete-action closure attempts return inline Vietnamese alerts, preserve the page, write no invalid status, and produce no browser console errors.
## 2026-10-22 — Desktop visual and interaction QA

- [x] QA-DESKTOP-001 — Process Map at 1024×768: no horizontal overflow; L0–L4 bands, empty L3/L4, header controls, and stacked detail panel remain usable.
- [x] QA-DESKTOP-002 — Relationship at 1024×768: statistics, filters, create control, focus selector, and network container remain within the viewport.
- [x] QA-DESKTOP-003 — Document at 1280×800: intake and governed controls fit without horizontal overflow; input focus ring is visible.
- [x] QA-DESKTOP-004 — Process L2 tooltip fits within 1024×768, opens on keyboard focus, and dismisses with Escape.
- [x] QA-DESKTOP-005 — Home, Document, Process Map, Relationship, Finding, Catalog, Governance, Action Log, and Role Knowledge passed 1600 px horizontal-overflow and alert checks.
- [x] QA-DESKTOP-006 — Browser console and Vercel Production error-log checks returned no errors during the executed flows.
- [ ] QA-DESKTOP-007 — Dedicated Microsoft Edge run, complete keyboard traversal, real-file upload, Editor-role behavior, and populated deep L3/L4 hierarchy remain outstanding for the reasons recorded above.
## Issue workbook alignment — 2026-10-22

- [x] Model 4 issue groups and 11 standardized types with dependent selection and inline explanations.
- [x] Add B → C → A → D diagnostic decision helper and primary-code recommendation.
- [x] Add issue metadata from workbook sheet 2 to Finding intake/detail.
- [x] Reframe Action Log as the cross-Finding corrective-action register while retaining notification history.
- [x] Apply migration `20261022070345_issue_taxonomy_action_log.sql` and verify taxonomy counts and RLS advisors on connected Supabase.
- [x] Complete authenticated production verification for dependent classification and Action Log; deploy merge commit through Vercel.

## 2026-10-22 — Controlled installment source onboarding

- [x] DONE REAL-DATA-001 — Remove the tagged demo process/document/finding fixtures without broad table or bucket deletion.
- [x] DONE REAL-DATA-002 — Create 12 governed installment document records and the evidenced L0/L1/nine-step L2 process hierarchy; leave unknown metadata blank.
- [x] DONE REAL-DATA-003 — Add 35 findings and 22 source-backed actions from Issue List.xlsx, linked to the installment process and available document evidence.
- [x] DONE REAL-DATA-004 — Add proposed APQC L0–L2 mappings with explicit owner-verification rationale; do not mark them verified.
- [x] DONE REAL-DATA-005 — Make all six active profiles selectable as action assignees while preserving Viewer read-only authorization.
- [x] DONE REAL-DATA-006 — Release legacy DOC upload support; attach exactly one private source file to each of the 12 document versions; verify Process Map, Findings, and Action Log on the signed-in Vercel Preview.
- [x] DONE REAL-DATA-008 — Remove the six tagged `[DEMO]` relationship rows whose source roles and target documents were already deleted; verify no tagged or dangling relationship remains.
- [ ] PENDING REAL-DATA-007 — Process Owner validates missing metadata, APQC proposals, evidence, effective dates, and publication decisions.

## 2026-10-22 — Finding source-evidence matrix

- [x] FIND-MATRIX-001 — Đối soát sheet Issue List: 35 finding, 14 nguồn và 113 ô bằng chứng có nội dung.
- [x] FIND-MATRIX-002 — Bổ sung bảng finding_source_evidence, RLS đọc theo Finding hiển thị và nạp đủ 113 ô bằng chứng.
- [x] FIND-MATRIX-003 — Hiển thị ma trận kiểu Excel với cột nhận diện cố định, nhóm thu gọn, toàn văn mở rộng và 14 header nguồn.
- [x] FIND-MATRIX-004 — Bổ sung tìm kiếm tại chỗ, lọc phạm vi bằng chứng, trạng thái thiếu nguồn và chế độ Danh sách.
- [x] FIND-MATRIX-005 — Giữ toàn bộ 35 finding; không còn loại bỏ finding một nguồn hoặc finding viện dẫn file chưa được cung cấp.
- [ ] FIND-MATRIX-QA-001 — Process Owner xác nhận nội dung 113 ô bằng chứng và cung cấp binary nguồn 13–14 nếu cần truy cập file gốc.

## 2026-10-23 — Production data and responsive QA

- [x] REAL-DATA-QA-001 — Authenticated Production confirms 12 document cards, 11 process nodes, 35 findings, 14 evidence-source headers and 22 Action Log rows with no page error or browser console warning.
- [x] FIND-MATRIX-QA-002 — Production at 1024 px shows 35/35 findings, 14 sources, horizontal scrolling contained inside the matrix, local search and evidence/list filters working.
- [x] DOC-RESP-001 — Constrain the native file input and uploader grid with minmax(0,1fr)/min-width:0 so the Document page no longer inherits the input's 230 px intrinsic overflow at laptop width.
- [ ] BLOCKED REAL-DATA-007 / FIND-MATRIX-QA-001 — Process Owner must validate APQC proposals, effective dates, missing metadata and 113 evidence cells; source binaries 13–14 are still not supplied.
- [ ] BLOCKED QA-EDITOR-001 — Editor browser/RLS behavior needs an approved Editor account or authorization to change the six-user role mix.

## 2026-10-23 — Finding matrix layout

- [x] FIND-MATRIX-006 — Remove horizontal pinning from the five leading headers so scrolling exposes every evidence-source column.
- [x] FIND-MATRIX-007 — Compact Decision Point, issue, action and Owner columns and reduce the sticky header height for laptop screens.

## 2026-10-23 — Finding evidence consolidation

- [x] FIND-MATRIX-008 — Replace 14 horizontal source columns with one related-process/document column and one source-attributed evidence-content column.
- [x] FIND-MATRIX-009 — Reduce Decision Point and Owner-comment defaults, compact the header, and add accessible per-column resizing for the current view.
- [x] FIND-MATRIX-014 — Restrict the related-document list to stored evidence sources or explicit finding-subject links; do not infer issue participation from bracketed source numbers in prose.
- [x] FIND-MATRIX-015 — Make evidenced document names clickable and open a private file or metadata detail regardless of document workflow status.
- [x] FIND-MATRIX-010 — Keep all 35 findings and 113 stored evidence excerpts discoverable through the consolidated layout and local search.
- [x] FIND-MATRIX-011 — Add a filter-aware sequential STT column without reintroducing per-source horizontal columns.
- [x] FIND-MATRIX-012 — Wrap header labels to two lines in a 42 px header and reduce Decision Point/Owner-comment defaults while preserving per-column resizing.
- [x] FIND-MATRIX-013 — Add permission-aware Sửa/Xem controls per issue that deep-link to the governed metadata form on the Finding detail page.

## 2026-10-23 — Truy cập tài liệu theo quy trình

- [x] DOC-PROCESS-001 — Đối soát Supabase: 12 documents, 12 file binaries, 12 process links; các liên kết tập trung ở bốn quy trình.
- [x] DOC-PROCESS-002 — Hiển thị file và metadata của tài liệu được liên kết ngay khi chọn node Process Map; hỗ trợ mở trực tiếp và đi tới thư viện tài liệu.
- [x] DOC-PROCESS-003 — Thêm bộ lọc quy trình vào Document; mở/tải các file trực tiếp từ document cards.
- [x] DOC-PROCESS-004 — Tiếp tục dùng private Storage/signed URL và RLS của phiên bản tài liệu; không đổi database.
- [x] DONE DOC-ACCESS-001 — Migration `20261027004304_document_status_read_policy.sql` lets permitted roles read Draft, Review, Approved and Effective document versions while preserving `allowed_roles`, access classification and role-gated writes; Viewer SQL simulation verified 12 visible drafts and zero disallowed-role rows.
- [ ] QA-DOC-PROCESS-001 — Kiểm tra UI và thao tác mở file trên Preview bằng tài khoản Admin, Viewer (draft, approved, effective) và thực hiện smoke test sau phát hành.

## 2026-10-23 — Repository hardening and final delivery

- [x] DONE HARDEN-001 — Fix `.env` ignore rules while retaining tracked `.env.example`; scan migrations for obvious committed credentials.
- [x] DONE HARDEN-002 — Sanitize raw PostgREST OR-search expressions and cover normal, invalid-column and punctuation cases with unit tests.
- [x] DONE HARDEN-003 — Remove React server-render purity lint errors and the unoptimized image warning; add server pagination to Document, Finding and Relationship lists.
- [x] DONE HARDEN-004 — Add `pnpm quality` and GitHub Actions checks for lint, typecheck, migration integrity, unit tests and production build.
- [x] DONE HARDEN-005 — Align historical migration filenames to the connected Supabase ledger and enforce unique 14-digit versions/no BOM.
- [x] DONE HARDEN-006 — Add atomic document create/update, document-finding and corrective-action RPCs; split production SQL into independently reviewable migrations.
- [x] DONE HARDEN-007 — Apply four production migrations, synchronize local filenames to the remote ledger, and verify `SECURITY INVOKER`, empty `search_path`, authenticated-only EXECUTE and non-overlapping write policies.
- [x] DONE HARDEN-008 — Viewer denial/read-scope probes, Admin atomic rollback probes and Supabase advisors passed; authenticated Preview QA confirmed Viewer access to all 12 permitted versions (including Draft), private Draft PDF access, full missing-metadata card, Admin 35/35 Finding Matrix links, Relationship load, special-character search and 1024 px overflow/console checks.
- [x] DONE HARDEN-009 — PR #72 merged as `393aa4a`; Vercel production deployment `dpl_AJm7tSBQkkqyAFMWA17fvdRg5oEn` reached READY and authenticated smoke tests passed on `pnj-apqc-platform.vercel.app`.
- [x] DONE MAP-012 — Render Process Map L0/L1 from immutable APQC PCF level-1/level-2 elements and restrict L2 to enterprise processes with visible linked source documents.
- [ ] PENDING MAP-013 — Process Owner validates proposed APQC paths and explicitly reallocates broad E2E document links to child processes only when source evidence supports the change.
- [x] DONE MAP-014 — Add evidence-intensity styling and a legend so users can trace visible document data from APQC L0 through L1 to document-backed L2 nodes.
- [x] DONE MAP-015 — Improve Process Map hierarchy readability with compact L0 context, descriptive L1 cards, selected-path highlighting and an explicit L1-to-L2 drill-down connector.
