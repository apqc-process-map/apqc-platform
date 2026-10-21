# Project State

## Product and stack

Process Map is a desktop-first internal demo for browsing and governing enterprise processes aligned to APQC PCF v8.0. Enterprise processes remain independent from the immutable APQC reference taxonomy.

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Supabase Auth, PostgreSQL, Row Level Security, private Storage, and versioned migrations.
- GitHub `apqc-process-map/apqc-platform` deploys automatically to Vercel project `apqc-platform`.
- UI language is Vietnamese; APQC source wording remains English.

## Verified data

- APQC import: 2,017 elements, 3,284 metrics, 13 categories, levels 1–5, no missing parents, duplicate PCF IDs, or orphan metrics.
- Demo sandbox: 10 disposable enterprise processes with complete Executive Summary metadata, 10 applicability-covered versions, 6 controlled tags/15 process tag assignments, 38 verified relationships (including 6 role-to-document knowledge mappings), 5 typed findings, 3 documents with metadata/tags, and existing workflow fixtures.
- Documents: 3 disposable documents with 4 versions covering draft, in-review, and effective states; every version has a process link and 2 document reading assignments exist.
- Six active Auth accounts use the approved mix of three Admin and three Viewer. Credentials are not stored in Git. There is no Editor account.
- Licensed APQC source files and private documents remain outside Git.

## Implemented capabilities

- Authenticated route protection, login/session/logout, role-aware navigation, and Admin/Viewer RLS boundaries.
- APQC catalog search/detail, hierarchy, descriptions, metrics, and attribution.
- Data-driven Process Map with breadcrumbs, URL-persisted selection, scoped descendants, search, card/table views, APQC reference handoff, and persistent detail.
- Centered relationship network with governed object codes, controlled labels placed on Source → Target connectors, direct inbound/outbound lanes, optional neighbor expansion, document-center filtering, table, and collapsed legend. Admin/Editor now have a governed create/edit metadata form; Viewer remains read-only.
- Dedicated “Vai trò của tôi” view groups assigned documents into “Bắt buộc phải biết” and “Nên biết / tham chiếu”; restricted document metadata stays hidden behind RLS while the knowledge requirement remains visible.
- RLS-gated direct authenticated-browser upload to private Storage with a 25 MB client-side MIME/extension guard, SHA-256 checksum, file metadata, and cleanup if metadata recording fails.
- Signed private file route, PDF/image preview, Office download, role-gated lifecycle action, field-level version comparison, and disposable document fixtures.
- Finding workflow with explicit role transitions, assignment, resolution checks, participants/watchers, reactions, comments, readable event timeline, SLA defaults, and evidence links.
- Action Log (backed by notification events) with per-item/bulk read actions, live finding/assignment/review/reading triggers, and a daily due-date scheduler.
- Governance and finding summary views.

## Security status

- RLS is enabled on protected process, relationship, document, finding, comment, and notification tables.
- Viewer mutation probes were denied; an Admin document update probe succeeded inside a rollback transaction.
- Document lifecycle is gated in both Server Actions and `enforce_document_version_role()`; Editor cannot directly approve, publish, supersede, or archive.
- Storage is private. Active users may read; Editor/Admin may upload; uploader or Admin may delete for rollback/cleanup.
- Migration `20261019000013_notification_security_hardening.sql` removed public/authenticated execution from privileged notification functions and fixed the mutable `search_path`.
- Migration `20261019000013_harden_demo_tag_policies.sql` separates tag write policies from read policies and adds the `object_tags.assigned_by` index; the tag-specific performance warning is cleared.
- Relationship migrations `20261021000023`–`20261021000026` enforce active endpoints, controlled source/target types, unique non-self links, valid dates/lengths, evidence before verification, audit stamping, and consolidated Editor/Admin write RLS.
- Supabase Security Advisor now reports only the account-level warning that leaked-password protection is disabled. Coordinate enabling it with replacement of the shared demo password.

## Verification

- `supabase/tests/lifecycle_and_notifications.sql` passed in a rolled-back transaction for severity SLA, completeness output, inverse labels, document publication gate, and four-eyes approval.
- Vercel preview builds for the implementation branch are succeeding. The bundled workspace Node.js runtime is used for local lint and production builds because no system Node.js installation is required.
- Unauthenticated web checks return the Vietnamese login page and protected routes redirect to `/login?error=required`.
- Local ESLint completed with zero errors (one pre-existing Document `<img>` performance warning), and the Next.js production build/type-check passed all 15 generated routes.
- Authenticated browser functional QA passed on Vercel Preview for role selection, RLS-restricted knowledge placeholders, document deep links, document-centered relationship focus, relationship center switching, and neighbor expansion. Relationship layout had no page or board overflow at 1024 px and 1280 px, and no console errors were observed.
- Authenticated screenshots, rendered DOM geometry, and interaction checks passed at explicit 1024 px and 1280 px viewports. The full Edge golden flow and a real private file upload/preview remain unexecuted.

## Pending and blocked

- Notification scheduler migration `20261019000012_notification_scheduler.sql` is applied. `pg_cron` job `process-map-due-notifications` is active daily at 01:00 UTC (08:00 Asia/Ho_Chi_Minh).
- Editor RLS behavior cannot be executed without changing the user-approved account mix or temporarily changing a production profile role.
- Document intake/editing exposes validity and review dates; a dedicated scheduled-publication timestamp control remains a lifecycle gap.
- Dashboard drill-down, accessible/dismissible process previews, global cross-module search, and authenticated multi-viewport/browser QA remain partial.
- Real process seeding and document importer design require representative enterprise/document samples.
- AI document analysis requires an approved data-handling policy and samples.
- Deferred backlog remains deferred: Entra SSO, full retention audit, relationship history, fine-grained ACL, extraction/search pipeline, AI conflict detection, operational KPI observations, saved views/exports, mobile UI, and BPMN editor.

## Delivery state

- GitHub `main` is the Vercel production source; feature branches receive isolated Preview deployments.
- `scripts/delete-demo-processes.sql` removes demo processes, relationships, findings, documents, reading assignments, and uploaded test objects in dependency order.


## Rich demo metadata milestone — 2026-10-19

- Migration `20261019000012_rich_demo_metadata.sql` is applied and verified in Supabase.
- Process Map now reads and displays purpose, boundaries, decision points, accountability, access, review date, systems, applicability and governance tags from Supabase.
- Cleanup script removes generic applicability/tag rows before deleting demo documents and processes.
- No binary document fixtures were invented; real-file upload testing still requires a sample file.


## Value-chain Process Map milestone — 2026-10-19

- The center workspace presents live processes in L0–L4 bands: L0 value chain, L1 E2E, L2 process, L3 subprocess, and L4 activity/task.
- Hover and keyboard focus expose the five Executive Summary sections; Escape dismisses the preview and selection continues to drive the unchanged right-hand information panel.
- Verified data currently provides L0–L2 only. L3/L4 display explicit empty states, and no parent-child structure is inferred because all 10 demo processes currently have null parent IDs.
- Horizontal overflow keeps the desktop map usable at 1024 px. Authenticated multi-viewport Chrome/Edge visual QA remains pending.


## Document metadata and taxonomy enhancement — 2026-10-19

- Fixed source mojibake in all six previously seeded Vietnamese document-type labels and expanded the controlled document taxonomy to 23 types in 7 groups from PRD section 14.
- Documents intake now groups optional metadata into basic identity, scope/applicability, governance/access, and effective dates/records. Supports controlled applicability values, governance tags, document/process links, owner, proposed approver, risk rating, legal basis, retention notes, access level and date metadata.
- Draft creation requires only a filename or a manually entered title. Classification and scope can be completed later. Document type determines the canonical group when selected.
- Migrations harden document-version, file, storage-object and scope/tag visibility by role, and restrict private uploads to editable drafts.
- Replaced Server Action payload uploads with direct authenticated browser -> Supabase private Storage uploads up to 25 MB, browser-computed SHA-256 and file metadata recording; avoids Vercel Functions 4.5 MB payload ceiling.
- Verified: Vercel preview build READY; database document type labels 23/23 valid; Viewer role simulation returned only 2 eligible effective document versions; admin draft creation succeeded inside a rolled-back transaction; Supabase Security Advisor shows no new schema-level security warnings.
- Not yet verified: authenticated browser upload of a real binary sample, end-to-end metadata interaction in Chrome/Edge, user-acceptance test. Approver selection is planned responsibility metadata only; approval decisions and reading acknowledgments remain separate governed workflows.

- Process Map polish: redundant center titles were removed and the overview preview now uses viewport-aware fixed positioning with bounded scrolling to prevent clipped long text.


## Process Map canvas and governed metadata editing — 2026-10-19

- The retired left value-chain navigator is replaced by a wide center L0–L4 canvas. Search finds live process code, Vietnamese/English name, owner, tag and overview text; chips filter levels without hiding the hierarchy bands.
- The right panel persists the five hover-summary sections together with operational metadata. Admins can edit these fields; Viewer remains read-only.
- Saving a draft/rejected version updates it in place. Saving a currently approved/effective version preserves that source and creates draft v+1, then reopens that exact draft. Assignments, tags and applicability are copied; APQC mappings are copied as `proposed` so verification is explicit.
- Applied migrations `20261019000019_process_map_metadata_editing.sql` and `20261019000020_consolidate_draft_applicability_policies.sql`. Admin/Viewer RLS and relation-copy checks passed in rollback-only SQL transactions; no test drafts persisted. The Vercel Preview build compiled and type-checked successfully.
- Security Advisor has no new schema-level security findings from this feature. The inherited account-level leaked-password-protection warning remains; authenticated browser/visual QA still requires a signed-in browser session.


## Compact Process Map workspace header — 2026-10-19

- The Process Map header is a single compact workspace control block: **PROCESS LANDSCAPE · Process Map** stays on one row with the control summary and collapse control.
- Its expanded details contain the description, return-to-menu action, Enterprise/APQC mode switch, and selected-process breadcrumb; collapsing preserves the short heading and restores vertical space for the canvas.
- The control is expanded by default, uses a real button with `aria-expanded`, and has a 1024-px layout fallback that wraps secondary controls rather than clipping them.


## Simplified Process Map toolbar — 2026-10-19

- The compact Process Map workspace card now shows only **PROCESS LANDSCAPE**, left-aligned Enterprise/APQC Reference controls, and the enterprise-process search field; redundant title, count, description, return action, and breadcrumb were removed.
- The search keeps its existing live filtering behavior and is hidden in APQC Reference mode because that mode hands off to the separate Catalog reference view.
- The card remains expanded by default and collapsible; at 1024 px its controls wrap inside the same frame instead of clipping.


## Document library management — 2026-10-20

- Document intake retains PRD-aligned draft metadata: controlled type/group, language, abstract, keywords, process link, applicability, tags, owner, designated approver, access level, validity/review dates, risk, legal basis, retention, and change summary.
- Document library management supports URL-backed search, governed metadata filters, and sorting by update, title, review due date, and validity start.
- No database migration is required; the implementation uses the existing RLS-protected metadata schema and private Storage flow.


## Remaining MVP audit — 2026-10-20

- Global Catalog supports Enterprise/APQC search, source/status/level filters, sorting, and deep links.
- Home has explicit Viewer, Editor, and Admin compositions; Editor queues remain RLS-scoped.
- Governance and Finding dashboards expose URL-backed drill-downs for coverage, review, open/overdue, and assigned queues.
- Process Map lint regressions were removed; full ESLint has zero errors and production build/type-check passes 14 routes.
- Security review found no new authorization bypass, secret exposure, service-role client use, or public document URL.
- Remaining evidence gaps are authenticated 1024/1280/wide and Chrome/Edge/keyboard QA plus the Editor role matrix.
- Real process seeding, importer design, and AI analysis remain blocked on representative samples/data policy; deferred backlog remains outside MVP.


## Required reading and relationship language — 2026-10-20

- Relationship wording now explains controlled types, Source → Target direction, and inverse labels in Vietnamese with a concrete example.
- Documents now has a personal “Tài liệu cần đọc của tôi” queue with search, pending/overdue/completed/required filters, assignment metadata, secure file access, and acknowledgment.
- Reading-assignment visibility is restricted by RLS to the recipient or Editor/Admin; acknowledgment insertion is restricted to the recipient.


## Role knowledge and document relationship focus — 2026-10-20

- Relationship can be focused directly on a document from the filter row; the network selects that document as center and shows its current inbound/outbound links.
- Navigation includes “05. Vai trò của tôi”. Active business roles can be selected to view controlled must-know and should-know document mappings.
- Migration `20261020000022_role_knowledge_profiles.sql` adds two controlled relationship types and six disposable demo mappings without adding a new table or bypassing existing RLS.
- A restricted target document is represented by a neutral placeholder and included in the role requirement count; protected code, title, and metadata are not exposed.
- Verified on Vercel Preview with Viewer `linhdoan`: role changes, counts, restricted state, document deep link, and Relationship document focus passed. Supabase data queries confirmed 2 must-know + 1 should-know mappings for “Quản lý cửa hàng”.


## Coded Relationship network milestone — 2026-10-20

- Relationship nodes and the relationship table show governed process, document, role, system, risk, KPI, business-object, and finding codes when available.
- Direct inbound/outbound connectors display the controlled relationship label on the Source → Target path; neighboring relationships remain in a separate optional expansion so direction is not ambiguous.
- The network reflows from three lanes to a two-column laptop layout without horizontal overflow. Authenticated Vercel Preview checks passed at 1024 px and 1280 px, including center switching, document focus, expansion/collapse, long Vietnamese labels, and zero console errors.
- No database migration was required; the page reads existing code columns through the authenticated Supabase client and existing RLS.


## Relationship connector endpoint polish — 2026-10-21

- Direct connectors use rounded 2 px strokes with a hollow source point and an open target chevron, making Source → Target direction visible without relying only on the relationship label.
- Inbound connectors terminate at the center card; outbound connectors originate at the center card. Rail junctions remain visually secondary, and hover/focus strengthens the active path.
- At 1024 px the network keeps its compact two-column reflow and replaces shared rails with inline source/label/target strips to avoid overlap.
- Verified on the authenticated Vercel Preview at 1280 px and 1024 px: node/card alignment, endpoint styles, no horizontal overflow, center switching, node drill-down, and zero browser-console errors. Full ESLint passed with one pre-existing `<img>` warning, and the production build/type-check passed all 15 routes.
- No database, Supabase policy, environment-variable, or data migration change was required.


## Relationship metadata intake milestone — 2026-10-21

- The metadata audit found no missing MVP business columns for Process, Document, or Relationship. The actionable gap was Relationship end-user input, which now exposes Source, controlled relationship type, Target, label, description, evidence, validity, and workflow status while audit fields remain system-managed.
- Viewer is read-only. Editor may create proposed records and revise only their own proposed/rejected records; Admin may manage and verify any relationship. Verified records require both description and evidence.
- Supabase migrations 20261021000023 through 20261021000026 are applied. Admin insert/update and Viewer-denial probes passed inside rollback transactions; no test relationship persisted.
- Vercel Preview QA passed for Admin create/edit rendering, metadata prefill, controlled-type filtering, Viewer control hiding, 1280/1024 px layout without horizontal overflow, and zero console errors. Editor browser QA remains unavailable because the approved account set contains no Editor.


## 2026-10-21 — Document-centric Finding & Action

- Tab 06 now prioritizes document-overlap/conflict findings and retains legacy general findings in a secondary all-findings view.
- Added manually classified categories for exact/semantic duplication, scope overlap, inconsistent clauses, conflicting effective dates or versions, contradictory inter-document relationships, supersession candidate, and other document issue.
- Each issue links concrete document versions with per-version cited excerpts and an operational-impact statement. Comparisons require two or more version references; other single-document findings can use one.
- Document finding actions now have an explicit decision (required, not required with reason, pending), multiple corrective actions with assignees, deadlines, progress, blockers, closure evidence, and a chronological activity history. Closure is blocked by DB unless the decision and applicable actions are completed.
- Database migrations 20261021000027/28/29 are applied; Preview deployment and TypeScript build READY. Read-boundaries were tested: Viewer sees legacy general findings but no restricted document findings.
- Transactional Supabase smoke test succeeded: two linked versions, one action 0%→60%→100%, a resolved finding, and three action events; all test data rolled back.
- Automated AI detection and file-content comparison are not implemented. Real authenticated browser E2E testing remains pending.
