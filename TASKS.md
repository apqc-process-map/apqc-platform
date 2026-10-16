# Process Map Ã¢â‚¬â€ MVP Tasks

Statuses use: TODO, BLOCKED, DONE, and PARTIAL. E0 is complete. E1-E6 are tracked from repository, Supabase, build, and deployment evidence; schema-only work is not counted as a completed user flow.

## EPIC 0 Ã¢â‚¬â€ Foundation

- [x] `DONE FND-001` Scaffold Next.js App Router with TypeScript.
- [x] `DONE FND-002` Configure lint, formatting, typecheck, and test commands.
- [x] `DONE FND-003` Add `.env.example` with placeholders only.
- [x] `DONE FND-004` Add secret/file ignore rules.
- [x] `DONE FND-005` Establish PNJ-inspired Process Map design tokens.
- [x] `DONE FND-006` Build desktop application shell and permission-aware navigation.
- [x] `DONE FND-007` Configure Vercel project linkage without committing credentials.

## EPIC 1 Ã¢â‚¬â€ Supabase and authentication

- [x] DONE AUTH-001 Link the single MVP Supabase project and migration workflow.
- [x] DONE AUTH-002 Create profile and system-role schema.
- [x] `DONE AUTH-003` Seed the user-approved demo mix: three Viewer and three Admin profiles securely.
- [x] DONE AUTH-004 Implement sign-in, session refresh, and sign-out.
- [~] PARTIAL AUTH-005 Add route/action authorization helpers.
- [~] PARTIAL AUTH-006 Define and test the initial RLS policy matrix.
- [~] PARTIAL AUTH-007 Verify the last author cannot approve their own draft.

## EPIC 2 Ã¢â‚¬â€ APQC reference

- [x] DONE APQC-001 Create framework, element, and metric migrations.
- [x] DONE APQC-002 Implement read-only APQC v8.0 Excel importer.
- [x] DONE APQC-003 Derive parent, level, and display order from hierarchy IDs.
- [x] `DONE APQC-004` Validate 2,017 elements, five levels, 13 categories, and no duplicate PCF IDs.
- [x] `DONE APQC-005` Validate and import 3,284 metric definitions.
- [x] `DONE APQC-006` Store and display APQC attribution/version metadata.
- [~] `PARTIAL APQC-007` Add APQC reference search and detail view.

## EPIC 3 Ã¢â‚¬â€ Enterprise processes

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
- [ ] `BLOCKED PROC-011` Seed 20Ã¢â‚¬â€œ30 real enterprise processes after samples arrive.

## EPIC 4 Ã¢â‚¬â€ Process Map and discovery

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

## EPIC 5 Ã¢â‚¬â€ Relationships and context

- [x] DONE REL-001 Create context-object and relationship migrations.
- [x] DONE REL-002 Seed controlled relationship groups/types and inverse labels.
- [x] DONE REL-003 Add Business Object catalog and process input/output flows.
- [x] DONE REL-004 Add System, Risk, KPI, and Business Role catalogs.
- [x] DONE REL-005 Implement relationship propose/verify/reject workflow.
- [~] PARTIAL REL-006 Build inbound/outbound centered network.
- [x] DONE REL-007 Build filterable relationship table and legend.
- [~] PARTIAL REL-008 Add one-hop default and explicit graph expansion.
- [x] DONE REL-009 Keep hierarchy and cross-links visually separate.

## EPIC 6 Ã¢â‚¬â€ Documents and versions

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

## EPIC 7 Ã¢â‚¬â€ Findings & Actions

- [x] `DONE FIND-001` Create finding, link, participant, reaction, and event migrations.
- [x] `DONE FIND-002` Implement generated `FND-000123` codes.
- [~] `PARTIAL FIND-003` Implement finding workflow and role transitions.
- [~] `PARTIAL FIND-004` Add threaded comments, mentions, and decision comments.
- [~] `PARTIAL FIND-005` Add Agree/Disagree/Need-more-information reactions.
- [~] `PARTIAL FIND-006` Add assignment, participants, watchers, and due dates.
- [x] `DONE FIND-007` Add severity-based SLA defaults and override.
- [~] `PARTIAL FIND-008` Add activity timeline.
- [x] `DONE FIND-009` Link resolution evidence to process/document versions.
- [x] `DONE FIND-010` Seed representative manual findings for the demo.
- [ ] `BLOCKED FIND-011` Define AI analysis only after data policy and sample review.

## EPIC 8 Ã¢â‚¬â€ Dashboards and notifications

- [x] `DONE DASH-001` Build Viewer Home.
- [~] `PARTIAL DASH-002` Build Editor Home.
- [x] `DONE DASH-003` Build Admin Home.
- [x] `DONE DASH-004` Create governance SQL views/functions.
- [~] `PARTIAL DASH-005` Build governance dashboard and drill-down.
- [x] `DONE DASH-006` Create finding-aging/dashboard SQL views.
- [~] `PARTIAL DASH-007` Build Finding dashboard and drill-down.
- [~] `PARTIAL NOTIF-001` Create notifications schema and event service.
- [~] `PARTIAL NOTIF-002` Build notification center with read/unread and deep links.
- [ ] `TODO NOTIF-003` Add review, reading, role, finding, and due-date notifications.

## EPIC 9 Ã¢â‚¬â€ Verification and deployment

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

