# Project State

## Product and stack

Process Map is a desktop-first internal demo for browsing and governing enterprise processes aligned to APQC PCF v8.0. Enterprise processes remain independent from the immutable APQC reference taxonomy.

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Supabase Auth, PostgreSQL, Row Level Security, private Storage, and versioned migrations.
- GitHub `apqc-process-map/apqc-platform` deploys automatically to Vercel project `apqc-platform`.
- UI language is Vietnamese; APQC source wording remains English.

## Verified data

- APQC import: 2,017 elements, 3,284 metrics, 13 categories, levels 1–5, no missing parents, duplicate PCF IDs, or orphan metrics.
- Base demo sandbox: 10 disposable enterprise processes with Executive Summary metadata, 10 applicability-covered versions, 6 controlled tags/15 process tag assignments, and 38 verified relationships (including 6 role-to-document knowledge mappings). The preexisting finding/document fixture counts below predate the tab 06 seed.
- Existing original documents: 3 disposable documents / 4 versions covering draft, in-review and effective states. In addition, the 2026-10-21 finding demo contributes **16 separate metadata-only draft documents/versions**, yielding **19 document identities and 20 versions** at the seed snapshot; 2 original reading assignments remain.
- Six active Auth accounts use the approved mix of three Admin and three Viewer. Credentials are not stored in Git. There is no Editor account.
- Licensed APQC source files and private documents remain outside Git.

## Implemented capabilities

- Authenticated route protection, login/session/logout, role-aware navigation, and Admin/Viewer RLS boundaries.
- APQC catalog search/detail, hierarchy, descriptions, metrics, and attribution.
- Data-driven Process Map with breadcrumbs, URL-persisted selection, scoped descendants, search, card/table views, APQC reference handoff, and persistent detail.
- Centered relationship network with governed object codes, controlled labels placed on Source → Target connectors, direct inbound/outbound lanes, optional neighbor expansion, document-center filtering, table, and collapsed legend. Admin/Editor now have a governed create/edit metadata form; Viewer remains read-only.
- Dedicated “Vai trò của tôi” view groups verified business-role-to-document mappings into “Bắt buộc phải biết”, “Nên biết / tham chiếu”, and “Không áp dụng”; restricted document metadata stays hidden behind RLS while the requirement remains visible. Unselected roles remain unclassified.
- RLS-gated direct authenticated-browser upload to private Storage with a 25 MB client-side MIME/extension guard, SHA-256 checksum, file metadata, and cleanup if metadata recording fails.
- Tab 02 Document intake uses a single Loại tài liệu with automatically derived Nhóm tài liệu and Admin-managed multi-selection of active business roles in three exclusive knowledge groups. This is not access authorization and does not automatically assign individual reading tasks.
- Signed private file route, PDF/image preview, Office download, role-gated lifecycle action, field-level version comparison, and disposable document fixtures.
- Finding workflow with explicit role transitions, assignment, resolution checks, participants/watchers, reactions, comments, readable event timeline, SLA defaults, and evidence links. Tab 06 now restricts its listing and creation to **2+ distinct-document** overlap/conflict findings, with evidence excerpts, action decisions, an individual corrective-action tracker and progress history.
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
- Document-finding migrations `20261021000027`–`20261021000029` implement action decisions, tracker, action-event history and restricted RLS; `20261021000033` blocks `resolved/closed` states without evidence from two distinct `documents.id` identities.
- Applied migration `20261021000034_document_knowledge_audience.sql`: third Not Applicable knowledge relation and Admin-only atomic `SECURITY INVOKER` function. SQL role simulation denied Viewer writes; existing document/Storage RLS is unchanged.
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


## Layered Process metadata card milestone — 2026-10-21

- Selecting an enterprise process now drives an M-Files-inspired metadata card in the persistent right panel; Document metadata remains in the Document module.
- The card exposes all currently modelled Process properties across classification/hierarchy, governance, Executive Summary, business flow, controlled lookups, APQC mappings, lifecycle and audit groups.
- Empty properties remain visible with an explicit warning state. Overall completion and per-group missing counts make metadata gaps discoverable without entering edit mode.
- Process Map now reads source code, allowed roles, all assignments, structured applicability, APQC mapping details, superseded version, lifecycle events, actors, and timestamps through the authenticated Supabase client and existing RLS.
- No database migration, new dependency, custom metadata-field creation, or authorization change is required.
- Authenticated Vercel Preview QA passed for all six metadata sections, 45 visible properties, process switching, long values, explicit missing states, and Escape-dismissible previews. A PostgREST self-relationship schema-cache error was removed by resolving supersedes_version_id from the already-authorized version result set instead of requesting an unavailable embedded self-join.
- Local ESLint, TypeScript, and production build verification passed. Authenticated Vercel Preview QA passed; production smoke testing remains pending until PR merge.
## 2026-10-21 — Cross-document Finding & Action (current scope)

- **Tab 06 is exclusively a multi-document comparison register** for duplicate/semantic overlap, applicability overlap, contradictory conditions, version/effective-date differences, relationship conflicts and supersession candidates. Every displayed issue must link at least two different `documents.id` values using concrete `document_version` subject references. An alternate two-version pairing within one document does **not** qualify; no single-document exception is allowed, even for Other.
- The prior all-findings/single-document option is **not** present on tab 06; historical `finding_domain=general` rows remain in the database for continuity. Server-side creation validates 2–20 version selections with at least two independent document identities. An additional Supabase trigger forbids resolving/closing findings lacking cross-document evidence.
- Per-version evidence includes an illustrative clause excerpt; case details include operational impact, severity, issue owner/deadline and explicit action decision (`pending`, `required`, `not_required` with a reason). Each required action tracks assignee, deadline, state, percent complete, blockers and outcome evidence; creation/progress updates append finding timeline events.
- QA verified in a rolled-back database transaction: closing an issue with only two versions of one document was rejected; adding a second document allowed closure. Preview and production builds for PR #46 (production `eca17a0`) passed. Authenticated full-browser issue/action E2E and Editor-role matrix remain pending.
- Document conflict inference/AI, full-text analysis and OCR are **not** implemented.

## 2026-10-21 — Seeded document Finding & Action DEMO

- Live Supabase seeded with **8** `[DEMO 06/F01..F08]` cross-document findings, each linking **2 distinct** `DEMO-FND-DOC-01..16` draft metadata-only document identities (16 total), 10 corrective actions and 16 fictional per-version excerpts. These demos relate to all 10 existing `PROC-000011..PROC-000020` enterprise processes.
- No actual document content was reviewed or uploaded: all contradictory clauses, dates and business impacts are explicitly illustrative and should never be treated as verified findings.
- Scenario diversity: exact/semantic duplication, scope overlap, payment conflict, effective-date conflict, KPI-version issue, approval-relationship uncertainty and supersession decision.
- Covers new / triage / in progress / pending decision / resolved / closed findings; action pending / in progress / blocked / done, varied progress %, owner and due date.
- Script `supabase/migrations/20261021000030_seed_document_findings_demo.sql` is idempotent for tagged records. Follow-up migrations `31` and `32` complete and clean up process evidence. Opt-in guarded cleanup available at `scripts/delete-demo-document-findings.sql`.
- Verified in Supabase: 16 draft documents, 8 document findings, 10 actions, 16 document evidence references, 16 process evidence references, 3 finished actions, one blocked, one overdue; none of the preexisting non-document findings modified. DEMO-triggered notifications were cleared.
- Viewer RLS returns zero document findings and actions; authenticated Admin role simulation reads all eight and ten actions. No Vercel application code changes needed; the live tab consumes Supabase data.


## 2026-10-21 — Load/reload responsiveness and render stability

- Investigated **Next.js 16.4.1 + Cache Components/PPR** production errors: recurring `Math.random()` blocking-prerender and `HANGING_PROMISE_REJECTION` for routes including Home, Findings, Governance, Process Map and Action Log. Production runtime errors are established; a successful build alone does **not** prove user-session runtime recovery.
- Supabase gateway baseline (recent 24-hour sample, uncorrelated across users): `/auth/v1/user` 582 requests, avg 244 ms, P95 386 ms; `/rest/v1/profiles` avg 621 ms, P95 1,044 ms; `findings` avg 554 ms, `document_versions` avg 529 ms. These are service timings, **not whole-page TTFB or Core Web Vitals**.
- Auth route is now guarded by request-time `await connection()` *before* the Supabase client accesses cookies/crypto. Server identity uses validated `getClaims()` and request-scoped `React.cache`; Proxy also uses `getClaims()` (not unverified `getSession()`). Existing active-profile DB/RLS checks remain intact. Proxy protects Process Map and Role Knowledge as well.
- GET search/filter forms in Documents, Findings, Catalog, Relationships and Role Knowledge now use Next `<Form action="/..." scroll={false}>` client navigation instead of native full reload; internal preview/edit/compare/action links use Next `<Link>`. File downloads remain native HTTP.
- Sidebar prefetch is now **intent-based** on pointer-enter/keyboard focus, rather than eager prefetch of nine protected routes. A route-level accessible skeleton replaces the blocking spinner with a reduced-motion fallback.
- Documents initially fetches its version list and independent metadata/reading lists concurrently. Relationships fetches the relationship graph with its independent catalogs, not after them. Findings reuses its initial document-version metadata for linked evidence and fetches only missing older versions.
- Added `vercel.json` `regions=["syd1"]` to co-locate Server Functions with the Supabase project in Sydney `ap-southeast-2`, confirmed on Vercel Preview deployment. The tradeoff for Vietnamese clients must be assessed with production latency data.
- Preview TypeScript/Next build succeeded. **Outstanding**: authenticated browser E2E page navigation, route-level P75 TTFB/LCP/INP baseline and postdeploy comparisons; monitor Vercel runtime errors and revert or refine dynamic boundaries if PPR errors persist. No database schema/business data changes.


## 2026-10-21 — Performance follow-up: remaining query waves and observability

- **Auth refresh cache headers:** Supabase SSR is pinned at `@supabase/ssr 0.7.0`; the Next Proxy now explicitly sets `Cache-Control: private, no-store` on token-refresh responses and forwards refreshed cookies on login/protected-route redirects. This prevents accidental shared caching of a refreshed session while preserving the existing signed-claims check and database RLS.
- **Finding detail:** the ten independent read requests (finding, profiles, events, reactions, comments, participants, corrective actions, document evidence, document versions and finding types) now start together, removing one Supabase request wave. Finding events read is capped at the latest 100 entries (UI displays a recent timeline).
- **Vai trò của tôi:** role-to-document relationships are read in parallel with role catalog, type vocabulary and available documents. The response is filtered to the selected role in server code; currently capped at 300 links for bounded reads.
- **Observability:** `src/lib/page-perf.ts` records anonymized slow-route server timing after the response (only >=850 ms) on Documents, Findings, Finding detail, Catalog, Relationships, Role Knowledge and Governance. Authentication/profile validation logs anonymously at >=450 ms. Logs have no IDs, tokens, query strings or document text.
- **QA:** latest Preview Next/TypeScript build READY with region `syd1`. Authenticated end-user timing and mutation E2E are still pending; no runtime-log traffic is not proof of zero latency/errors. Do not describe these log thresholds as fulfilled LCP/INP metrics.

## 2026-10-21 — Document classification and knowledge audience (Production PR #50)

**Released:** GitHub [PR #50](https://github.com/apqc-process-map/apqc-platform/pull/50) merged to `main` as `9868f9726f604aa2d7000a88e59f8b760ead0ece`. Vercel Production deployment `dpl_ERNmxGYhaB3GEjifrYLMMN3zNJiG` reached **READY**, and `pnj-apqc-platform.vercel.app` is associated with that release.

- **Tab 02 /documents:** The Loại tài liệu control is editable; Nhóm tài liệu is derived/read-only (23 types, 7 groups). Untyped legacy drafts retain their stored group on edit. Admin multi-selects active business roles in Phải biết, Nên biết / tham chiếu, Không áp dụng. Unselected roles remain Chưa xác định; a role cannot occupy multiple confirmed groups on a document. Document cards show verified knowledge classifications.
- **Tab 05 /role-knowledge:** Displays three confirmed knowledge categories and preserves RLS restrictions; restricted-document placeholders are retained. These relationships link business role to **stable document identity**, not to versions or individual profiles.
- **Database:** Migration `20261021000034_document_knowledge_audience.sql` applied. Admin-only `set_document_knowledge_audience(uuid, jsonb)` atomically reclassifies active business roles. Former mapping rows are marked rejected, not physically deleted; this is not a full immutable audit history. Access permissions, private Storage, individual reading assignments, and notification workflows remain separate.
- **Verified on 2026-10-21:** 3 active business roles, 20 document versions and six existing must/should confirmed mappings retained; Not Applicable controlled type present (zero actual assignments before user use). Admin first-time classification and reclassification passed in rolled-back SQL transactions; Viewer write denied; no test business-data changes persisted. Vercel Preview Next.js/TypeScript build READY and Production deployment READY. No new schema-level Security Advisor finding; the existing leaked-password-protection warning remains.
- **Outstanding:** Real signed-in browser create/edit/reopen/multiselect/remove-to-unclassified, Tab 05 and Document card roundtrip, Editor read-only behavior, and Production smoke test. These are tracked separately in `TASKS.md`.

## 2026-10-21 — Document type terminology and Tab 02 presentation audit

- Taxonomy: audited all 23 active document types in seven groups; replaced nine confusing Vietnamese labels in place using migration `20261021000035_normalize_document_type_labels.sql`. Types still have the same codes and IDs, and existing document-version references are untouched. Examples: `form_template` is now `Biểu mẫu`, `checklist` is `Bảng kiểm`, `rca_report` is `Báo cáo phân tích nguyên nhân gốc rễ`.
- UI: the automatic group now has a visually separate field title, value and descriptive help text. Seven group labels are short Vietnamese terms, consistent in the Type select, Document filter and cards. Untyped new documents show `Chưa phân loại`; old untyped versions retain their saved group.
- Library: group filtering is case-insensitive for legacy stored `Execution`, `Governance` and `Evidence`. Lifecycle names, access levels, risk, language, comparison metadata, visible dates and uploader controls use Vietnamese presentation labels while DB codes remain stable.
- No schema changes or permission changes were made. Knowledge-audience groups (Phải biết, Nên biết, Không áp dụng) and reading/acknowledgment workflows remain unchanged.
- Verification: Supabase post-migration queries confirmed 23 active type labels, nine updated names, and preserved references for existing versions. Vercel Preview build and TypeScript are the available compile gates. Authenticated browser visual/E2E testing is still pending and should not be inferred from a READY build.

### Release verification / external deployment blocker (2026-10-21)

- PR #52 merged to `main` at commit `ad9ee0207ee9d46fc6b687e632e971b27a7d691e`; the 6 canonical Markdown docs are also updated in that commit.
- Supabase controlled-type label migration is **already applied** and its label changes can be observed via the existing production code because type labels are read from live data.
- **The latest UI/CSS changes are NOT yet on Production.** Vercel returned HTTP 402 `api-deployments-free-per-day` (>100 deployments/day) when a new preview build was requested. The main commit shows a failed Vercel status pointing to a build-rate-limit upgrade page. At the check, Production is still running the previous main commit `0c2a11ca2ce696943369c1bd21bb77b841a1b197`.
- Production publication needs the Vercel account owner to resolve/reset the deployment quota and trigger or retry the blocked main commit. Do not report feature publication until Vercel Production identifies commit `ad9ee020...` as READY and its domain alias targets that deployment. Latest app build and authenticated browser QA remain pending.

## Metadata-driven discovery increment — 2026-10-22

- Process and Document detail now share one property-card renderer with Object Type, Class, grouped properties, origin, required state, explicit missing values, and completeness.
- Document Class rules are version-controlled in application code; no custom metadata-field creation or database migration was introduced.
- Document Views cover effective, review-due, missing-metadata, and process-linked records. Indirect discovery uses only RLS-visible process, applicability, tag, and role-knowledge rows and explains why each result appears.
- Verification passed: TypeScript, ESLint, production build, authenticated Production View/search/card smoke tests, Vietnamese-label mojibake scan, and browser console check. Production merge commit 2a15a62 is READY.
## Finding workflow validation UX — 2026-10-22

- Production logs identified two expected governance rejections on Finding FND-000024: missing resolution summary and three incomplete corrective actions. These were previously surfaced as a generic Next.js error page.
- The Server Action now preflights document-finding closure requirements and returns coded, non-sensitive messages to the workflow panel. Database triggers and RLS remain authoritative and unchanged.
- TypeScript, targeted ESLint, production build, and authenticated Production smoke tests passed. Both closure guards return inline Vietnamese alerts without invalid writes or browser console errors; Production merge commit 49670f3 is READY.
## Desktop QA evidence — 2026-10-22

- Authenticated Production visual QA passed at 1024 px for Process Map and Relationship, 1280 px for Document, and 1600 px across all nine main routes. No horizontal overflow, page alerts, browser console errors, or recent Vercel runtime errors were observed.
- Process Map keyboard focus exposes the L2 tooltip inside the viewport and Escape dismisses it; input focus styling is visible. Empty L3/L4 states render intentionally.
- This evidence does not cover a separate Microsoft Edge engine run, Editor role, real-file upload, every loading/empty/error state, or a populated deep L3/L4 hierarchy.
- Historical Vercel quota-blocked deployment tasks are superseded: current main deployments are reaching READY.
## In progress — issue taxonomy / Action Log (2026-10-22)

Branch `codex/issue-taxonomy-action-log` adds the governed Issue.xlsx taxonomy, a dependent classifier and decision helper, workbook metadata on findings, and a corrective-action register at `/notifications`. Migration `20261022000034_issue_taxonomy_action_log.sql` is applied to project `eksftbalhnqpguecdcaj`; verification returned A=3, B=3, C=2, D=3. TypeScript passes. Repository-wide lint remains blocked by pre-existing React purity errors in catalog/findings/governance/relationships/role-knowledge and an existing unescaped-quote error in document-intake. Security advisor reports only the existing leaked-password-protection warning; no new RLS warning was introduced.