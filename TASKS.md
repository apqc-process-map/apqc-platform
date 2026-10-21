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
- [ ] `BLOCKED PROC-011` Seed 20–30 real enterprise processes after samples arrive.

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
- [ ] `BLOCKED DOC-013` Design Excel/CSV/PDF/DOCX importer after sample inspection.


## E0-E6 pending reasons (verified 2026-10-16)

- AUTH-003 is complete with the user-approved mix of three Admin and three Viewer accounts. No credentials are stored in Git. There is no Editor demo account, so Editor behavioral testing remains pending.
- AUTH-005/006/007 remain partial: route protection and database gates exist; Admin and Viewer access were exercised, while Editor and complete four-eyes behavioral tests remain.
- APQC-004/005/006 are complete: the supplied licensed workbook was validated and imported as 2,017 elements, 3,284 metrics, five levels, and 13 categories, with attribution/version metadata and no duplicate IDs or missing parents.
- APQC-007 remains partial: Catalog search and attribution display use imported records, but a dedicated APQC detail screen is not implemented.
- PROC-011 remains blocked until representative enterprise samples are supplied.
- MAP-001/005/006/009/010 remain partial because the map still uses synthetic fixtures and full browser/long-text QA is not complete.
- REL-006/008 are implemented: the relationship table, filters, centered direct-link graph, document focus, and explicit neighboring-link expansion exist; the current milestone adds coded nodes and labeled connector lanes.
- DOC-007 remains partial: upload, preview/download, role-gated lifecycle actions and comparison now exist; metadata editing for validity/review scheduling is not yet exposed as a complete form.
- DOC-013 remains blocked until representative Excel/CSV/PDF/DOCX samples are supplied.

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
- [ ] `TODO QA-004` Test empty, loading, error, and long-text states.
- [ ] `TODO QA-005` Run accessibility checks and keyboard navigation review.
- [ ] `TODO QA-006` Run visual QA at 1024, 1280, and wide desktop widths.
- [~] `PARTIAL QA-007` Run the golden demo Playwright flow in Chrome and Edge.
- [x] `DONE QA-008` Run security review for Auth, RLS, uploads, signed URLs, and secrets.
- [x] `DONE DEPLOY-001` Configure Vercel environment variables.
- [x] `DONE DEPLOY-002` Deploy and verify the golden flow against Supabase.
- [x] `DONE DEPLOY-003` Update `PROJECT_STATE.md` with verified implementation status.

## Review snapshot — verified after PR #6

### Completed since the previous review

- [x] NOTIF-001 — Notifications schema and finding event service are implemented and verified in Supabase.
- [x] DATA-FIX — Vietnamese demo data for 3 findings and 8 relationship types was repaired in Supabase and versioned in migration `20261016000006_repair_vietnamese_demo_data.sql`.
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
- [x] SECURITY — Supabase Advisor findings for executable `SECURITY DEFINER` functions and mutable function `search_path` were fixed by migration `20261019000013_notification_security_hardening.sql`. The remaining Advisor warning is the account-level leaked-password protection setting.
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

- [x] DEMO-DATA — Applied and verified migration `20261019000012_rich_demo_metadata.sql`: 10/10 process versions have all five Executive Summary fields; 10/10 have applicability; 6 controlled tags have 15 process assignments; 32 verified demo relationships; 5 typed findings; and document metadata/tags are populated.
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
- [x] `SECURITY` — Migrations `20261019000019_process_map_metadata_editing.sql` and `20261019000020_consolidate_draft_applicability_policies.sql` are applied in Supabase. RLS permits only Admins to create/update their governed process drafts and copy related assignments, mappings, applicability and tags. Cloned APQC mappings are set to `proposed` for re-verification.
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


## 2026-10-21 — Document Findings & Action Tracker

- [x] DONE FIND-012 Document-first 06 workspace, with manual overlap, duplication, version/effective-date and relationship conflict types and multiple version-linked evidence records.
- [x] DONE FIND-013 Require explicit action decision with justification for no-action disposition.
- [x] DONE FIND-014 Create action tracker with assignee, due date, status, progress, blockers, completion evidence and database closure guards.
- [x] DONE FIND-015 Preserve legacy general findings via separate all-findings filter; document-centric navigation now primary.
- [~] PARTIAL QA-FIND-01 Preview TypeScript/build and transactional Supabase workflow tested; authenticated end-to-end browser interactions and attachment evidence input require user-session QA.
- [ ] BLOCKED FIND-011 AI extraction, automatic duplicate and conflict detection requires policy approval and representative file samples; not launched.

## 2026-10-21 — Cross-document-only findings scope

- [x] DONE FIND-016 Restrict tab 06 to findings with at least two distinct documents; remove legacy/general findings view from this tab without deleting its records.
- [x] DONE FIND-017 Enforce two distinct document identities in the create-finding action, for every issue type including Other.
- [x] DONE FIND-018 Prevent closing a document finding without two different linked documents at the database gate.
- [x] DONE DEMO-FIND-01 Reuse 8 existing cross-document DEMO findings and 16 demo metadata document records mapped to enterprise processes; do not duplicate seed.
