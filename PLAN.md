# Process Map — Implementation Plan

## 1. Delivery strategy

Build the MVP as vertical slices that each produce a demonstrable user outcome. Do not scaffold every proposed module before the first end-to-end path works.

The first release uses one Supabase project for local/preview/demo data. Changes must therefore be migration-driven and non-destructive by default.

## 2. Proposed architecture

### Web

- Next.js App Router with TypeScript.
- Server Components for initial reads and permission-aware page composition.
- Server Actions or route handlers for governed mutations.
- Client Components only for interaction-heavy surfaces: map, relationship graph, tables, form state, and charts.

### Data

- Supabase PostgreSQL as the source of truth.
- Supabase Auth with six seeded email/password demo users.
- RLS for read/write authorization.
- Private Supabase Storage for document files.
- SQL migrations under source control.
- APQC importer reads the licensed workbook outside Git and upserts reference data.

### UI

- Tailwind CSS and CSS-variable design tokens.
- Radix primitives and customized shadcn/ui.
- React Flow for the relationship network only.
- Layered hierarchy uses custom column-browser components, not React Flow.
- TanStack Table for catalogs, review queues, scope tables, and finding lists.
- Recharts for governance/finding dashboards.

### Validation and testing

- Zod schemas shared by forms and server mutations where practical.
- Unit tests for scoring, lifecycle, date, inverse relationship, and publication-gate logic.
- Database tests for RLS and critical constraints.
- Playwright for golden demo flows.
- axe-core plus visual QA for desktop accessibility and layout.

## 3. Phase plan

### Phase 0 — Repository and product foundation

- Scaffold Next.js/TypeScript.
- Add formatting, linting, tests, and environment examples.
- Establish design tokens and desktop shell.
- Create Supabase project linkage and migration workflow.
- Add safe configuration rules; no secrets in Git.

Exit: app shell runs locally, checks pass, and a no-data Vercel preview can build.

### Phase 1 — Authentication and authorization

- Create profiles and role model.
- Create six demo accounts securely.
- Implement sign-in/sign-out/session handling.
- Add route and action authorization.
- Add foundational RLS tests.

Exit: Viewer, Editor, and Admin see different navigation/actions; forbidden database writes fail.

### Phase 2 — APQC reference import

- Implement framework/element/metric schema.
- Build read-only workbook importer.
- Derive parent/level/order from hierarchy IDs.
- Import v8.0 elements and metrics.
- Add attribution and source/version UI.
- Validate expected counts and uniqueness.

Exit: 2,017 elements and 3,284 metrics are queryable with correct five-level hierarchy.

### Phase 3 — Enterprise process foundation

- Implement stable process identity and version schema.
- Add enterprise hierarchy and generated process codes.
- Add Executive Summary, ownership, applicability, lifecycle, and APQC mappings.
- Seed 20–30 coherent demo processes when samples are available; use clearly labeled synthetic fixtures only if necessary.
- Implement publication-gate validation and completeness scoring.

Exit: Editor can create a complete draft, map it to APQC, and submit it.

### Phase 4 — Process Map and Catalog

- Build Enterprise Landscape.
- Build layered column drill-down with breadcrumb and URL state.
- Add all-descendants scope Tree/Table.
- Add accessible preview and persistent detail panel.
- Build APQC reference/coverage view.
- Build global search and Catalog filters/sorts.

Exit: Viewer can navigate the hierarchy, understand a process in 60 seconds, and find content by metadata.

### Phase 5 — Relationships and context

- Add controlled relationship taxonomy.
- Add Business Objects and lightweight System/Risk/KPI/Business Role catalogs.
- Build relationship CRUD and verification.
- Build centered inbound/outbound network and relationship table.
- Keep hierarchy and cross-links visually separate.

Exit: Viewer can trace inputs/outputs and related context; Editor can propose and Admin can verify relationships.

### Phase 6 — Documents and review workflow

- Add documents, versions, private files, process links, and taxonomy.
- Validate file type/size in the intake flow, compute SHA-256 in the authenticated browser, and record the checksum with private Storage metadata.
- Add PDF/image preview and Office download.
- Add review threads, mentions, rejection reason, and four-eyes approval.
- Add scheduled/effective/superseded lifecycle behavior.
- Add metadata version comparison.
- Offer one controlled document type with an automatically derived group; preserve group values on untyped legacy drafts.
- Let Admin multi-select business roles by required/reference/not-applicable knowledge groups, leaving unselected roles unclassified. Surface them in Tab 05.
- Keep knowledge classification separate from document access and individual reading/acknowledgment workflows.
- Add reading assignments and acknowledgment.

Exit: the document/process authoring, approval, effective publication, and acknowledgment path works end-to-end.

### Phase 7 — Cross-document Findings & Corrective Actions

- Preserve the existing generic finding schema/workflow and history without surfacing generic findings on tab 06.
- Build the `/findings` register around **cross-document** overlap, duplication, inconsistent clauses, conflicting validity/version, relationship conflict, and supersession cases.
- Require at least two **distinct stable document IDs** (linked by specific version and excerpt) for every issue type, including Other. Server creation rejects invalid selections; database resolution/closure rejects insufficient evidence.
- Record operational impact and an explicit action decision (`pending / required / not_required` with a mandatory no-action rationale).
- Track multiple corrective actions per issue with owner, deadline, status, percentage, blockers, completion evidence and a durable event timeline. Retain the finding's existing assignment, comment and closure workflows and SLA calculation.
- Seed 8 clearly labeled *fictional* cross-document findings linking 16 draft metadata-only DEMO documents to the 10 enterprise processes; 10 action fixtures exercise varied progress and outcomes. Never present seed content as extracted or verified real evidence.

Exit: a cross-document finding can be created with two distinct documents, triaged and actioned (or explicitly dispositioned without action), updated by an authorized worker, and resolved/closed only after the database gates pass. **Status (2026-10-21):** implementation, Supabase transactional gate tests and production build completed; full signed-in browser/Editor-role E2E validation still pending.

### Phase 8 — Dashboards and Action Log

- Build role-specific Home views.
- Add governance dashboard and transparent completeness breakdown.
- Add Finding dashboard with drill-down.
- Add Action Log backed by notification event generation.

Exit: dashboards and Action Log update from actual state transitions in the golden flow.

### Phase 9 — Hardening and deployment

- Run security review of Auth, RLS, server actions, upload validation, and signed URLs.
- Run responsive desktop visual QA at 1024, 1280, and wide layouts.
- Run Edge/Chrome golden-flow tests.
- Review accessibility, empty/loading/error/long-text states.
- Deploy to Vercel and verify Supabase environment configuration.
- Update `PROJECT_STATE.md` with verified results.

Exit: golden demo flow passes on the deployed Vercel URL.

## 4. Recommended schema/migration sequence

1. Extensions, enums, profiles, helper authorization functions.
2. APQC framework, elements, metrics.
3. Processes, process versions, assignments, mappings.
4. Controlled vocabularies and applicability.
5. Context objects, relationship types, relationships.
6. Documents, document versions, files, process links.
7. Reviews, comments, mentions, reading acknowledgment.
8. Findings, links, participants, reactions, events.
9. Notifications and governance views/functions.
10. RLS policies and policy tests after each owning table, not only at the end.

## 5. Key design decisions

- Enterprise hierarchy is the default map; APQC is a reference/coverage view.
- Column drill-down handles hierarchy; graph handles relationships.
- Process Executive Summary is structured, not a single abstract field.
- Process and document content are versioned independently.
- Relationship history is deferred; relationships represent current state.
- Findings are manually seeded/entered for MVP; AI remains replaceable behind the same interface later.
- One Supabase project increases migration risk; avoid destructive reset-based workflows.

## 6. Main risks and mitigations

### Real sample structure is unknown

Mitigation: keep import tasks blocked until representative files arrive. Do not overfit to the M-Files HTML demo.

### One shared Supabase environment

Mitigation: migration-only schema changes, idempotent seeds, backups before material migrations, no automatic preview reset.

### RLS complexity

Mitigation: define policy matrix first, test each role directly against Supabase, keep privileged mutations server-side.

### Dense process relationships

Mitigation: one-hop network by default, filters, explicit expansion, and table fallback.

### Metadata overload

Mitigation: progressive disclosure, publication-gate checklist, inheritance, controlled vocabularies, and Must-have/Nice-to-have separation.

### Licensed and internal data leakage

Mitigation: source workbook and business documents stay outside Git; private Storage and server-authorized access only.

## 7. Deferred discovery checkpoints

Reopen the following after receiving real samples:

- Demo end-to-end process selection.
- Enterprise import mapping and validation.
- PDF/DOCX structure extraction.
- AI overlap/conflict architecture and data policy.
- Fine-grained organizational access model.
- Relationship and full audit temporal models.


## 8. Completion audit — 2026-10-20

Implemented MVP phases now include global Catalog filtering/sorting, role-specific Home views, governance/finding drill-downs, governed document metadata and lifecycle controls, relationship exploration, Action Log, and version-safe Process Map editing.

The remaining work is limited to:

1. Authenticated multi-browser and multi-viewport QA, including keyboard/focus evidence.
2. Complete Editor RLS/action testing, blocked by the confirmed six-user mix containing no Editor account.
3. Extend the evidenced enterprise hierarchy beyond the 11 live L0–L2 nodes only when additional process samples are supplied; define a reusable batch-import contract before implementing a generic importer.
4. Obtain Process Owner validation for APQC proposals, effective dates, missing metadata and the 113 evidence cells; obtain source binaries 13–14.
5. AI analysis and deferred backlog remain blocked by data policy or explicit non-MVP scope.

Do not mark these blockers complete using fabricated data, invented browser evidence, or an unauthorized role/account change.


### Phase 10 — Render reliability & performance hardening (2026-10-21)

- Fix Next 16 Cache Components PPR/auth dynamic boundaries and replace per-request remote `getUser()` with signed JWT `getClaims()` (without bypassing role and RLS checks).
- Move all GET filters and internal navigation to soft transitions. Use intent-driven sidebar prefetch and preserve file-download semantics.
- Cut dependent Supabase query waves; avoid cross-user cached private data. Co-locate server functions with Supabase in Sydney and validate against Vietnam clients.
- Show accessible route-level skeleton while server content streams.
- Verification gates: Preview build/TypeScript; Admin/Viewer/Editor auth and CRUD E2E; route P75 TTFB <800 ms, navigation content visible <1s, LCP <2.5s, INP <200ms (targets, **not measured achievements**); zero prerender/fetch cancellation runtime errors after release.

### Phase 11 — Document knowledge audience and taxonomy cleanup (2026-10-21)

- [DONE] Make Nhóm tài liệu read-only and automatically derive it from the selected Loại tài liệu (23 controlled types, 7 groups); keep legacy untyped group data.
- [DONE] Offer three exclusive multi-select groups of existing active business roles: Phải biết, Nên biết / tham chiếu, Không áp dụng. Unselected roles remain Chưa xác định.
- [DONE] Reuse two existing controlled knowledge links; add role_not_applicable_document via migration 20261021104055_document_knowledge_audience.sql.
- [DONE] Add Admin-only atomic classification with Security Invoker; old reclassified links become rejected, not deleted. Leave Storage/RLS access controls and individual reading assignments unchanged.
- [DONE] Display knowledge metadata in Document cards and Tab 05; PR #50 merged; Vercel Production commit 9868f9726f604aa2d7000a88e59f8b760ead0ece READY.
- [VERIFIED] Rollback-only SQL Admin insert/reclassification and Viewer-denial tests passed; 20 versions and six original knowledge mappings preserved. Next.js/TypeScript Preview build passed.
- [PENDING] Authenticated browser acceptance for create/edit/reopen, exclusivity, returning to unclassified, Tab 05 and document-card synchronization, and Editor read-only behavior. Build and SQL tests do not replace end-to-end testing.

### Phase 12 — Tab 02 content and terminology review (2026-10-21)

- [DONE] Audit all 23 document type names against the seven canonical groups; simplify nine confusing/duplicative labels without changing taxonomy IDs or codes.
- [DONE] Separate the derived-group caption, read-only group value and help text visually on desktop and mobile; clarify blank-type and historical-group behavior.
- [DONE] Consolidate Vietnamese presentation labels for group, status, language, access level, risk and date format; align create/edit, document filters, cards, comparison and file-uploader copy.
- [DONE] Make the Document group filter case-insensitive to preserve visibility of legacy `Execution`/`Governance` values.
- [DONE] Apply controlled-vocabulary label migration `20261021110248_normalize_document_type_labels.sql` without rewriting any business document/version relation.
- [PENDING] Authenticated browser visual QA and end-to-end user testing for create/edit, type-to-group, group filtering, upload, card data, and lifecycle flows, beyond successful compilation/production build.

### Phase 10 — Controlled installment source onboarding (2026-10-22)

- Replace tagged synthetic fixtures with the user-supplied installment document set without deleting unrelated production records.
- Keep all 12 source binaries outside Git and upload them to private Supabase Storage only after the compatible application release is live.
- Represent the sources as 12 governed documents and derive only the evidenced L0–L2 process hierarchy; keep unknown metadata blank.
- Import Issue List.xlsx as Findings and child Actions, link evidence to document versions and the end-to-end installment process, and expose all six active profiles as assignment candidates without widening Viewer write access.
- Require proposed APQC mappings and draft documents to pass owner review before verification/publication.

Exit: database counts and authorization boundaries are verified, the production build is healthy, 12 private files are attached to the correct versions, and signed-in browser smoke tests cover Documents, Process Map, Findings, and Action Log.

### 2026-10-23 — Production QA continuation

Authenticated Production acceptance covers the current installment dataset across Documents, Process Map, Finding Matrix and Action Log. The next delivery boundary is external validation, not additional inferred metadata: Process Owner review, missing sources 13–14, an approved Editor test identity, and any additional real process samples.

## 9. Current hardening release — 2026-10-27

- Repository checks, pagination, search-input hardening, migration integrity and CI are implemented locally.
- Database delivery is split into four non-destructive units: document read policy, atomic mutation RPCs, RLS/index hardening, and the three remaining foreign-key indexes.
- All four production migrations are applied. Viewer read/denial checks, Admin rollback-only atomic workflow probes and Security/Performance Advisors passed; no probe data persisted.
- Remaining release path: run final build and authenticated browser/visual QA, then perform one GitHub merge and one final Vercel production deployment.

### Phase 13 — Process Map workbook onboarding (2026-10-28)

- Import only the 34 source rows classified as enterprise processes; retain the workbook outside Git.
- Update the existing installment process identity in place and preserve all current document links.
- Store source-backed code/name, effective date, department/unit and APQC path; leave unsupported content blank and mappings Proposed.
- Display every mapped L2 process while retaining evidence intensity based only on visible document links.
- Exit: migration/data counts, RLS/security checks, authenticated Process Map QA, GitHub merge and one final Vercel Production deployment are verified.

### Phase 14 — Home document/finding quick insights (2026-10-29)

- [DONE] Confirm data grain and actual sources for document identity creation, file upload, finding discovery, remediation, action overdue and issuing department (do not conflate metadata-only files).
- [DONE] Define 7/30/90-day and custom calendar dates (Vietnam time), default trailing seven calendar days including today, maximum 366 days.
- [DONE] Add RLS-scoped PostgreSQL report function and validate signed-in Admin/Viewer visibility, date boundaries, and reconcilable totals.
- [DONE] Build period picker, headline metric cards, document/finding time charts, top issuing-department report, operational attention panel and links on 01 Home. Preserve existing overall catalog/process/work queues below.
- [DONE] Compile Vercel Preview with Next.js and TypeScript. No new privileged table or public materialization is introduced.
- [DONE] Verified Vercel Production commit `b5cae354e9410fc4de7d350d799f7f613128fe0d` READY with official `pnj-apqc-platform.vercel.app` alias on 2026-10-29.
- [PENDING] Real authenticated browser E2E for filters, empty states, responsive charts, source drill-through and per-role permissions remains an acceptance gate.

### Phase 15 — Executive Home / L1–L3 APQC insight (2026-10-29)

- [DONE] Move Home period selector, executive role label, all four in-period KPIs and current portfolio totals into one integrated header; remove duplicate report header and lower-page summary cards.
- [DONE] Reorder content: 01 executive period KPIs → 02 cumulative APQC L1/L2/L3 inventory mapping → 03 exceptions/department distribution/time trends, preserving editor work queues and role-based quick links.
- [DONE] Build an interactive L1→L2→L3 APQC category explorer with source names, direct Catalog links and distinct linked-document counts. Show mapping coverage honestly and keep it separate from time-filtered activity.
- [DONE] Apply security-invoker reporting RPC scoped to the controlled PNJ framework. Reconcile mapped L3 across levels and test Admin/Viewer and anon denial.
- [DONE] Vercel Preview Next.js/TypeScript build after final feature changes.
- [DONE] GitHub PR #87 merged to main; Vercel Production deployment `dpl_5ZHdGPyJtAQpqLRx5JEVhFw8r1bp` built READY for commit `ab895bcb2751650a0040174217f44d7f4910ae5c`; official alias verified.
- [PENDING] Signed-in visual and interactive browser QA at desktop, tablet and phone, with keyboard and per-role validation.

### Phase 16 — Remove APQC distribution block from Home (2026-10-29)

- [DONE] Remove the entire L1→L2→L3 interactive distribution section from Home, leaving the compact APQC total in the top portfolio strip only.
- [DONE] Remove the retired explorer's source component and CSS and stop executing the full mapping hierarchy RPC on Home.
- [DONE] Renumber the operational report to section 02; preserve all in-period Document/Finding KPIs, department breakout, issue/status panels and quick links.
- [DONE] Update README, PRD, DATA_MODEL, PLAN, TASKS and PROJECT_STATE; leave existing Supabase reporting function untouched (no destructive migration).
- [DONE] PR #89 merged at `c6afa12295ecefee31f9cf6c9665b5b4cbf2563b`; Vercel Production `dpl_4iZf6cFgiPXiV7V17QfSKhn543BZ` READY with official site alias verified.
- [PENDING] Authenticated desktop/mobile UI QA and preset/custom period checks remain separate.

### Phase 17 — CEO Home report de-duplication and visual prioritization (2026-10-29)

- [DONE] Review Home against executive questions: scale/activity, source department contribution and finding remediation trajectory.
- [DONE] Remove the redundant "Tồn đọng và chất lượng dữ liệu" card, detailed status chips, second finding action link and "Điểm cần lưu ý" strip.
- [DONE] Recompose the report into 02 Document activity (paired trend plus top five departments and grounded top-three concentration) and 03 Finding trend (last chart, with a compact current-backlog footer).
- [DONE] Keep four filtered KPI cards in the unified top header, cohort/period semantics, role-based access, and existing work queue/quick links.
- [DONE] Refine responsive executive styling and discard unused legacy Home card CSS; no Supabase data/schema changes.
- [DONE] Verify Next/TypeScript Vercel Preview build after UI source and style changes.
- [DONE] PR #91 merged into `main` as `d0c3e3668442c56239436220d1b7357b98de42cb`. Vercel Production `dpl_216PrtUr4woUDi4j4RurdEhFdrSS` READY, with official site alias verified.
- [PENDING] Signed-in authenticated browser and responsive QA (separate from successful build/deployment).
