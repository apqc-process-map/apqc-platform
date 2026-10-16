# Process Map â€” MVP Tasks

Statuses use: TODO, BLOCKED, DONE, and PARTIAL. E0 is complete; E1/E2 contain the migration/importer foundation and remain partial until connected and verified against the MVP Supabase project and licensed workbook.

## EPIC 0 â€” Foundation

- [x] `DONE FND-001` Scaffold Next.js App Router with TypeScript.
- [x] `DONE FND-002` Configure lint, formatting, typecheck, and test commands.
- [x] `DONE FND-003` Add `.env.example` with placeholders only.
- [x] `DONE FND-004` Add secret/file ignore rules.
- [x] `DONE FND-005` Establish PNJ-inspired Process Map design tokens.
- [x] `DONE FND-006` Build desktop application shell and permission-aware navigation.
- [x] `DONE FND-007` Configure Vercel project linkage without committing credentials.

## EPIC 1 â€” Supabase and authentication

- [ ] `TODO AUTH-001` Link the single MVP Supabase project and migration workflow.
- [ ] `TODO AUTH-002` Create profile and system-role schema.
- [ ] `TODO AUTH-003` Seed two Viewer, two Editor, and two Admin profiles securely.
- [ ] `TODO AUTH-004` Implement sign-in, session refresh, and sign-out.
- [ ] `TODO AUTH-005` Add route/action authorization helpers.
- [ ] `TODO AUTH-006` Define and test the initial RLS policy matrix.
- [ ] `TODO AUTH-007` Verify the last author cannot approve their own draft.

## EPIC 2 â€” APQC reference

- [ ] `TODO APQC-001` Create framework, element, and metric migrations.
- [ ] `TODO APQC-002` Implement read-only APQC v8.0 Excel importer.
- [ ] `TODO APQC-003` Derive parent, level, and display order from hierarchy IDs.
- [ ] `TODO APQC-004` Validate 2,017 elements, five levels, 13 categories, and no duplicate PCF IDs.
- [ ] `TODO APQC-005` Validate and import 3,284 metric definitions.
- [ ] `TODO APQC-006` Store and display APQC attribution/version metadata.
- [ ] `TODO APQC-007` Add APQC reference search and detail view.

## EPIC 3 â€” Enterprise processes

- [ ] `TODO PROC-001` Create process identity, aliases, and version migrations.
- [ ] `TODO PROC-002` Implement generated `PROC-000123` codes.
- [ ] `TODO PROC-003` Add hierarchy, level types, display order, and cycle prevention.
- [ ] `TODO PROC-004` Add five Executive Summary fields and conditional validation.
- [ ] `TODO PROC-005` Add Owner, Steward, SME, Approver, and reader assignments.
- [ ] `TODO PROC-006` Add applicability and controlled vocabularies.
- [ ] `TODO PROC-007` Add inheritance indicators and override behavior.
- [ ] `TODO PROC-008` Add many-to-many APQC mapping and verification.
- [ ] `TODO PROC-009` Add publication-gate validation.
- [ ] `TODO PROC-010` Add transparent completeness scoring.
- [ ] `BLOCKED PROC-011` Seed 20â€“30 real enterprise processes after samples arrive.

## EPIC 4 â€” Process Map and discovery

- [ ] `TODO MAP-001` Build Enterprise Landscape.
- [ ] `TODO MAP-002` Build layered column drill-down.
- [ ] `TODO MAP-003` Add breadcrumb and URL-persisted selected path.
- [ ] `TODO MAP-004` Add all-descendants scope Tree/Table.
- [ ] `TODO MAP-005` Add scoped expand-all behavior.
- [ ] `TODO MAP-006` Add accessible hover/focus preview.
- [ ] `TODO MAP-007` Add persistent process detail panel.
- [ ] `TODO MAP-008` Add APQC Reference/Coverage view.
- [ ] `TODO MAP-009` Build global search and Process Catalog.
- [ ] `TODO MAP-010` Verify long names, deep hierarchy, empty nodes, and 1024 px layout.

## EPIC 5 â€” Relationships and context

- [ ] `TODO REL-001` Create context-object and relationship migrations.
- [ ] `TODO REL-002` Seed controlled relationship groups/types and inverse labels.
- [ ] `TODO REL-003` Add Business Object catalog and process input/output flows.
- [ ] `TODO REL-004` Add System, Risk, KPI, and Business Role catalogs.
- [ ] `TODO REL-005` Implement relationship propose/verify/reject workflow.
- [ ] `TODO REL-006` Build inbound/outbound centered network.
- [ ] `TODO REL-007` Build filterable relationship table and legend.
- [ ] `TODO REL-008` Add one-hop default and explicit graph expansion.
- [ ] `TODO REL-009` Keep hierarchy and cross-links visually separate.

## EPIC 6 â€” Documents and versions

- [ ] `TODO DOC-001` Create document, version, file, and process-link migrations.
- [ ] `TODO DOC-002` Seed controlled document taxonomy.
- [ ] `TODO DOC-003` Configure private Supabase Storage bucket and policies.
- [ ] `TODO DOC-004` Validate upload MIME type, extension, size, and checksum server-side.
- [ ] `TODO DOC-005` Add PDF/image preview and Office download.
- [ ] `TODO DOC-006` Require at least one process link before document publication.
- [ ] `TODO DOC-007` Implement lifecycle, validity, review cadence, and scheduling.
- [ ] `TODO DOC-008` Prevent overlapping effective version intervals.
- [ ] `TODO DOC-009` Add metadata version comparison.
- [ ] `TODO DOC-010` Add review comments, replies, mentions, and resolution.
- [ ] `TODO DOC-011` Add rejection reason and four-eyes approval.
- [ ] `TODO DOC-012` Add required-reading assignment and acknowledgment.
- [ ] `BLOCKED DOC-013` Design Excel/CSV/PDF/DOCX importer after sample inspection.

## EPIC 7 â€” Findings & Actions

- [ ] `TODO FIND-001` Create finding, link, participant, reaction, and event migrations.
- [ ] `TODO FIND-002` Implement generated `FND-000123` codes.
- [ ] `TODO FIND-003` Implement finding workflow and role transitions.
- [ ] `TODO FIND-004` Add threaded comments, mentions, and decision comments.
- [ ] `TODO FIND-005` Add Agree/Disagree/Need-more-information reactions.
- [ ] `TODO FIND-006` Add assignment, participants, watchers, and due dates.
- [ ] `TODO FIND-007` Add severity-based SLA defaults and override.
- [ ] `TODO FIND-008` Add activity timeline.
- [ ] `TODO FIND-009` Link resolution evidence to process/document versions.
- [ ] `TODO FIND-010` Seed representative manual findings for the demo.
- [ ] `BLOCKED FIND-011` Define AI analysis only after data policy and sample review.

## EPIC 8 â€” Dashboards and notifications

- [ ] `TODO DASH-001` Build Viewer Home.
- [ ] `TODO DASH-002` Build Editor Home.
- [ ] `TODO DASH-003` Build Admin Home.
- [ ] `TODO DASH-004` Create governance SQL views/functions.
- [ ] `TODO DASH-005` Build governance dashboard and drill-down.
- [ ] `TODO DASH-006` Create finding-aging/dashboard SQL views.
- [ ] `TODO DASH-007` Build Finding dashboard and drill-down.
- [ ] `TODO NOTIF-001` Create notifications schema and event service.
- [ ] `TODO NOTIF-002` Build notification center with read/unread and deep links.
- [ ] `TODO NOTIF-003` Add review, reading, role, finding, and due-date notifications.

## EPIC 9 â€” Verification and deployment

- [ ] `TODO QA-001` Unit-test lifecycle, publication gates, completeness, SLA, and inverse labels.
- [ ] `TODO QA-002` Test RLS for all three roles and private Storage.
- [ ] `TODO QA-003` Test forbidden direct client mutations.
- [ ] `TODO QA-004` Test empty, loading, error, and long-text states.
- [ ] `TODO QA-005` Run accessibility checks and keyboard navigation review.
- [ ] `TODO QA-006` Run visual QA at 1024, 1280, and wide desktop widths.
- [ ] `TODO QA-007` Run the golden demo Playwright flow in Chrome and Edge.
- [ ] `TODO QA-008` Run security review for Auth, RLS, uploads, signed URLs, and secrets.
- [x] `DONE DEPLOY-001` Configure Vercel environment variables.
- [ ] `TODO DEPLOY-002` Deploy and verify the golden flow against Supabase.
- [ ] `TODO DEPLOY-003` Update `PROJECT_STATE.md` with verified implementation status.

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
