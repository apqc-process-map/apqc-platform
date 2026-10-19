# Process Map — MVP Tasks

Statuses use: TODO, BLOCKED, DONE, and PARTIAL. E0 is complete. E1-E6 are tracked from repository, Supabase, build, and deployment evidence; schema-only work is not counted as a completed user flow.

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

- [~] PARTIAL MAP-001 Build Enterprise Landscape.
- [x] DONE MAP-002 Build layered column drill-down.
- [x] DONE MAP-003 Add breadcrumb and URL-persisted selected path.
- [x] DONE MAP-004 Add all-descendants scope Tree/Table.
- [~] PARTIAL MAP-005 Add scoped expand-all behavior.
- [~] PARTIAL MAP-006 Add accessible hover/focus preview.
- [x] DONE MAP-007 Add persistent process detail panel.
- [x] DONE MAP-008 Add APQC Reference/Coverage view.
- [~] PARTIAL MAP-009 Build global search and Process Catalog.
- [~] PARTIAL MAP-010 Verify long names, deep hierarchy, empty nodes, and 1024 px layout.

## EPIC 5 — Relationships and context

- [x] DONE REL-001 Create context-object and relationship migrations.
- [x] DONE REL-002 Seed controlled relationship groups/types and inverse labels.
- [x] DONE REL-003 Add Business Object catalog and process input/output flows.
- [x] DONE REL-004 Add System, Risk, KPI, and Business Role catalogs.
- [x] DONE REL-005 Implement relationship propose/verify/reject workflow.
- [~] PARTIAL REL-006 Build inbound/outbound centered network.
- [x] DONE REL-007 Build filterable relationship table and legend.
- [~] PARTIAL REL-008 Add one-hop default and explicit graph expansion.
- [x] DONE REL-009 Keep hierarchy and cross-links visually separate.

## EPIC 6 — Documents and versions

- [x] DONE DOC-001 Create document, version, file, and process-link migrations.
- [x] DONE DOC-002 Seed controlled document taxonomy.
- [x] DONE DOC-003 Configure private Supabase Storage bucket and policies.
- [~] PARTIAL DOC-004 Validate upload MIME type, extension, size, and checksum server-side.
- [ ] TODO DOC-005 Add PDF/image preview and Office download.
- [x] DONE DOC-006 Require at least one process link before document publication.
- [~] PARTIAL DOC-007 Implement lifecycle, validity, review cadence, and scheduling.
- [x] DONE DOC-008 Prevent overlapping effective version intervals.
- [~] PARTIAL DOC-009 Add metadata version comparison.
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
- REL-006/008 remain partial: the relationship table, legend, filters, and one-hop boundary exist; interactive centered graph expansion is not implemented.
- DOC-004/005/007/009 remain partial or pending: database constraints and metadata comparison exist, but signed download/preview, server upload orchestration, full lifecycle actions, and field-level comparison are not implemented.
- DOC-013 remains blocked until representative Excel/CSV/PDF/DOCX samples are supplied.

## EPIC 7 — Findings & Actions

- [x] `DONE FIND-001` Create finding, link, participant, reaction, and event migrations.
- [x] `DONE FIND-002` Implement generated `FND-000123` codes.
- [~] `PARTIAL FIND-003` Implement finding workflow and role transitions.
- [x] `DONE FIND-004` Add threaded comments, mentions, and decision comments.
- [~] `PARTIAL FIND-005` Add Agree/Disagree/Need-more-information reactions.
- [~] `PARTIAL FIND-006` Add assignment, participants, watchers, and due dates.
- [x] `DONE FIND-007` Add severity-based SLA defaults and override.
- [~] `PARTIAL FIND-008` Add activity timeline.
- [x] `DONE FIND-009` Link resolution evidence to process/document versions.
- [x] `DONE FIND-010` Seed representative manual findings for the demo.
- [ ] `BLOCKED FIND-011` Define AI analysis only after data policy and sample review.

## EPIC 8 — Dashboards and notifications

- [x] `DONE DASH-001` Build Viewer Home.
- [~] `PARTIAL DASH-002` Build Editor Home.
- [x] `DONE DASH-003` Build Admin Home.
- [x] `DONE DASH-004` Create governance SQL views/functions.
- [~] `PARTIAL DASH-005` Build governance dashboard and drill-down.
- [x] `DONE DASH-006` Create finding-aging/dashboard SQL views.
- [~] `PARTIAL DASH-007` Build Finding dashboard and drill-down.
- [x] `DONE NOTIF-001` Create notifications schema and event service.
- [x] `DONE NOTIF-002` Build notification center with read/unread and deep links.
- [ ] `TODO NOTIF-003` Add review, reading, role, finding, and due-date notifications.

## EPIC 9 — Verification and deployment

- [ ] `TODO QA-001` Unit-test lifecycle, publication gates, completeness, SLA, and inverse labels.
- [~] `PARTIAL QA-002` Test RLS for all three roles and private Storage.
- [~] `PARTIAL QA-003` Test forbidden direct client mutations.
- [ ] `TODO QA-004` Test empty, loading, error, and long-text states.
- [ ] `TODO QA-005` Run accessibility checks and keyboard navigation review.
- [ ] `TODO QA-006` Run visual QA at 1024, 1280, and wide desktop widths.
- [~] `PARTIAL QA-007` Run the golden demo Playwright flow in Chrome and Edge.
- [~] `PARTIAL QA-008` Run security review for Auth, RLS, uploads, signed URLs, and secrets.
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


## Demo workspace verification � 2026-10-16

- [x] Seeded demo catalogs, process flows, relationships, findings, comments, reactions, reading assignments, acknowledgments, and notifications in Supabase.
- [x] Fixed finding notification trigger to use profiles.role instead of the nonexistent profiles.system_role.
- [x] Added safe cleanup coverage to scripts/delete-demo-processes.sql.
- [ ] Replace synthetic demo records with representative enterprise samples when supplied.


## Review snapshot — 2026-10-19

- [x] APQC-007 — Catalog APQC rows now open a protected detail page with hierarchy, parent navigation, description, and imported metrics.
- [x] NOTIF-002 — Notification center now supports per-item and bulk mark-as-read through server actions scoped to the authenticated recipient.
- [x] BUILD — Removed build-time Google Font fetching; production build uses local system font fallbacks and succeeds offline.
- [ ] Remaining partial work continues with finding workflow UI, relationship graph expansion, document upload/preview/lifecycle, and QA matrix.

## Review snapshot - 2026-10-19 continuation

- [~] FIND-003/006/008 - Finding detail now supports RLS-governed status/assignment updates and displays activity timeline; full role transition matrix and comment workflow remain incomplete.
- [x] FIND-005 - Finding detail exposes Agree/Disagree/Need-more-information actions backed by existing own-reaction RLS.
- [~] DOC-005 - Authenticated server route now creates 60-second signed links for stored files; inline PDF/image preview and Office-specific UX remain.
- [~] REL-006/008 - Relationship table and filters remain verified; centered interactive graph/explicit expansion remain.
- [ ] QA-004/005/006/007 - Build/lint pass; authenticated browser, accessibility, and multi-viewport QA still require a signed-in session and browser coverage.
- [ ] QA-002/008 - RLS baseline is documented; comment-write policy and full Storage/security matrix remain pending approval/verification.

## Review snapshot - 2026-10-19 comment collaboration

- [x] FIND-004 - Added finding comment creation for creator, assignee, and participants, with RLS policies and server action.
- [x] SECURITY - Verified comment collaboration policies and authenticated grants in Supabase; anonymous access remains absent.
- [ ] FIND-003/006/008 - Full transition matrix, participant assignment UI, and richer timeline remain partial.
