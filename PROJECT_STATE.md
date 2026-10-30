# Project State

Last reviewed: 2026-10-30.

## Product and architecture

Process Map is a desktop-first internal application for browsing and governing enterprise processes aligned to APQC PCF 8.0. APQC is an immutable reference taxonomy; enterprise processes, documents, relationships and findings are separate governed objects.

- Next.js 16 App Router, React 19, TypeScript and CSS/Tailwind tooling.
- Supabase Auth, PostgreSQL with RLS, private Storage and versioned SQL migrations.
- GitHub `apqc-process-map/apqc-platform`; Vercel builds previews from feature branches and production from `main`.
- UI is Vietnamese; APQC source IDs/wording remain English.

## Verified production data

- Active controlled APQC framework: 449 elements total (13 L0, 74 L1, 362 L2/APQC-L3) from `APQC_CAT_ver2_Chi tiết Level 3`; the former 2,017-element framework is inactive and retained for audit.
- Active document library: 1,837 identities and 1,844 versions imported from `Process_MAP_VBC1009`, with seven duplicate codes represented as versions and 1,154 exact links to the active APQC framework. Twenty invalid/non-code classifications remain in source metadata for owner review. The former 12 installment documents are archived/superseded, not deleted.
- Six active accounts: three Admin and three Viewer; no Editor account. Credentials are not stored in Git.
- APQC workbook and supplied business documents remain outside Git.

## Implemented behavior

- Authenticated route protection, role-aware navigation and database-enforced RLS.
- APQC catalog/search/detail and data-driven Process Map with L0–L4 bands, search, selection, metadata detail/editing and linked documents.
- Process Map landscape uses active APQC level 1 as L0 and active APQC level 2 as L1. L1 cards show reference code and process name only; description and PCF ID are omitted. L2 enterprise records remain separate from APQC classification.
- Process Map marks APQC L0/L1 branches with mapped lower-level process data plus document evidence, mapped lower-level data without documents, and branches without mapped data using three intensity states; L2 remains based on directly linked documents.
- Process Map uses a focus-and-context hierarchy layout: compact L0 overview, concise L1 cards, selected-path highlighting and a drill-down connector to L2 cards.
- Relationship network/table with controlled types, direction labels, document focus, governed create/edit and collapsed legend.
- Confirmed document-process links are exposed in Relationship as proposed `documented_by` edges; document-to-document links are not inferred from names alone.
- Document library with metadata intake/editing, filter/sort/group, private direct browser upload, signed file route, PDF/image preview, Office download, lifecycle, comparison, process/applicability/tag links and role-knowledge classification.
- “Vai trò của tôi” groups verified knowledge mappings into required, reference and not-applicable; these mappings do not grant access.
- Finding register contains all 35 controlled workbook issues, consolidated related-document/process evidence, resizable columns, governed metadata and action workflow.
- Action Log includes corrective-action progress and notification history; due-date scheduler runs daily.
- Main Document, Finding and Relationship lists now use server pagination. Raw PostgREST search text is quoted/escaped before use in `.or()` filters.

## Security and data integrity

- RLS is enabled on protected process, relationship, document, finding, comment and notification tables; private files are served through authenticated short-lived signed URLs.
- Client code uses only public Supabase configuration. Privileged keys and user passwords are not in Git.
- Existing lifecycle triggers retain four-eyes/publication and finding-closure checks.
- Production migrations `20261027004304`–`20261027004641` are applied: document reads are status-independent while preserving `allowed_roles`; Document/Finding/Action multi-table writes use atomic `SECURITY INVOKER` RPCs; overlapping RLS write policies are separated; all foreign keys reported by the Advisor now have covering indexes.
- Supabase Security Advisor reports only the account-level leaked-password-protection warning. Enabling it requires replacing the shared demo password first. Performance Advisor reports no unindexed foreign keys; fresh/low-traffic indexes are listed as unused until production traffic exercises them.

## Repository quality

- `.env*` is ignored while `.env.example` remains tracked.
- `pnpm quality` covers ESLint, TypeScript, migration filename/BOM/credential checks and Node unit tests for PostgREST search filtering.
- GitHub Actions runs quality and production build for pull requests/main without triggering a second deployment path.
- Historical migration filenames are aligned to the connected Supabase migration ledger; local-only baseline migrations retain unique timestamps.

## Verification in this worktree

- Supabase migrations `20261029013000` and `20261029014500` are applied to project `eksftbalhnqpguecdcaj`.
- Workbook checksum `bcf6c1e3f5f3950c4fe02cf190ab5d2e3834c97f522b475b2b1e53494b9da41f` passed controlled import validation: 362 APQC L2 rows, 1,837 documents, 1,844 versions and 1,154 active mappings.
- `pnpm quality` passes: ESLint, TypeScript, 54-migration integrity check and all three Node unit tests.
- Next.js 16.4.1 production build passes all 15 routes. Supabase Security Advisor reports only the existing leaked-password-protection setting; Performance Advisor reports no unindexed foreign keys after `20261029020000` was applied; governance coverage is active-framework-only via `20261029021000`. Browser/visual QA, Git merge and final Vercel deployment remain pending for this branch.
## Remaining gates

1. Process Owner must still validate proposed APQC mappings, unknown metadata/effective dates and 113 evidence cells; source binaries 13–14 remain unavailable.
2. Editor-specific QA needs an approved Editor account or a temporary role change.

## Deferred scope

Entra SSO, custom metadata-field creation, AI/OCR document analysis, BPMN editing, mobile-specific UI, fine-grained ACLs, full immutable relationship history and operational KPI observations remain outside the MVP unless explicitly approved.
## Recent substantial changes

- Replaced the active APQC reference and company document library from the two controlled workbook sheets while preserving prior frameworks/documents for audit.
- Added active-framework enforcement, controlled APQC interpretation metadata, source-row audit metadata, exact document/APQC mappings and workbook checksum logging.
- Process Map L1 cards now use a compact content-based minimum and show APQC plus hierarchy number; coverage legend samples and branch-scoped wording match the actual evidence styles.
- Scoped product reads to active/current records and added controlled interpretation to APQC detail.

## 2026-10-29 — Home operational quick-insight dashboard

- **Implementation:** 01 Home now contains a period-filtered analytics module: 7 trailing Vietnam calendar days including today by default; 30/90-day presets and custom inclusive dates (up to 366 days); four KPI tiles, document/finding activity trends, new-document distribution by issuing department, and current unresolved finding/overdue action/missing-department indicators. Existing cumulative reference/process totals and role work queues remain separately visible.
- **Data / definitions:** `documents.created_at` measures newly registered document identities; `document_files.uploaded_at` measures uploaded file objects, with a distinct stable-document metric to prevent double counts; `findings.created_at` measures document finding discoveries; `COALESCE(findings.resolved_at,findings.closed_at)` with resolved/closed status and action required measures actual remediation. Backlog counts are current rather than a historical ending balance.
- **Source / security:** Applied `supabase/migrations/20261029000001_home_document_finding_summary.sql`; `home_document_finding_summary(date,date)` is `SECURITY INVOKER` and executes under authenticated user's document/file/finding RLS permissions. No service-role access or mutations of existing records.
- **Verified date snapshot (2026-10-29):** Admin, 2026-10-23…29 inclusive: 1,837 new document identities, 0 file objects uploaded, 0 newly discovered or remediated document findings, **35 unresolved document findings at time of observation**. Most new records are metadata registrations, **not** files. For 2026-09-30…10-29, total documents 1,849; files uploaded 12; findings discovered 35. The daily and department sums exactly reconcile to headline totals.
- **Role test:** Admin and Viewer SQL simulations passed; Viewer does not see restricted document findings. Build: latest tested Vercel Preview for Home report compiled and passed TypeScript.
- **Remaining gate:** Verified Production deployment after main merge and authenticated browser QA for filters, responsiveness and navigation. Keep runtime verification separate from compilation/database tests.

### Home report Production verification — 2026-10-29

- GitHub PR [#85](https://github.com/apqc-process-map/apqc-platform/pull/85) was merged into `main` as `b5cae354e9410fc4de7d350d799f7f613128fe0d`.
- Vercel Production deployment `dpl_Hgy9xAYGFxmsu738MsZEwwcqtEkc` reached **READY** and the official `pnj-apqc-platform.vercel.app` alias was verified on that deployment.
- The report's Supabase aggregation was tested against Admin and Viewer RLS and reconciled at the daily/department grain. Actual authenticated browser filter/render/E2E tests remain pending; Production READY does not prove these workflows.

## 2026-10-29 — Executive Home hierarchy and APQC coverage

- Home top header integrates the current user's control-center label, scoped time filters, four in-period KPIs, and compact cumulative APQC L1/L2/L3, enterprise-process, document-identity and role-workload context. Redundant lower summary/report filter was removed.
- Executive reading path is now **01 — in-period outcomes**, **02 — APQC L1→L2→L3 linked-document coverage**, **03 — operational exceptions, department distribution, finding/document trends**. Role-specific work queues and quick links are preserved below.
- New interactive `src/components/home-apqc-explorer.tsx` shows L1 Vietnamese short labels and L2/L3 source names with drill-through; data is drawn only from the controlled PNJ APQC interpretation, not both frameworks together.
- Migration `20261029000002_home_executive_apqc_hierarchy.sql` is applied, with RLS-scoped, invoker-rights `home_apqc_hierarchy_summary()` returning document mapping coverage: **13 L1, 74 L2, 362 L3; 68 mapped L3; 1,149 distinct linked document identities**. These numbers are cumulative inventory links, not compliance or process effectiveness. Admin and Viewer read tests pass, anon denied, L1/L2/L3 mapped counts reconcile.
- Implementation is built and type checked in Vercel Preview. Signed-in browser/visual QA and Production verification tracked in `TASKS.md`.

### Executive Home Production verification — 2026-10-29

- GitHub PR [#87](https://github.com/apqc-process-map/apqc-platform/pull/87) merged to `main` as commit `ab895bcb2751650a0040174217f44d7f4910ae5c`.
- Vercel Production deployment `dpl_5ZHdGPyJtAQpqLRx5JEVhFw8r1bp` reached **READY** for this feature commit; `pnj-apqc-platform.vercel.app` confirmed as its alias.
- SQL execution cost checked under simulated authenticated Admin (execution ~95 ms on sample, not an end-user page-latency guarantee). Admin/Viewer data and anon permissions validated. Browser-authenticated end-to-end and visual acceptance remain outstanding.
- Current evidence is insufficient to allocate the 35 open document findings reliably across APQC L1–L3; no finding-by-APQC metric was fabricated. Only supported linked-document mappings are shown in hierarchy.

## 2026-10-29 — Home APQC distribution section removed (latest UI decision)

- At the user's request, **“02 / PHÂN BỔ DANH MỤC THEO APQC”** was removed entirely from Tab 01 Home. This supersedes the interactive hierarchy layout described in the earlier Executive Home section of this file; it is historical implementation detail, not current Home scope.
- Current Home reading path: integrated control-center header with date filter, four period KPIs and compact portfolio totals (including PNJ APQC L1/L2/L3 inventory counts) → **02 / Diễn biến & ưu tiên xử lý** (department distribution, finding/action indicators and trends) → role queue and quick links.
- Removed the Home L1/L2/L3 React explorer and its CSS. Home now reads only the PNJ framework's L1/L2/L3 node levels, not the former JSON mapping RPC/linked-document payload. If the count query fails, the header renders a dash in place of an invented zero.
- The pre-existing `home_apqc_hierarchy_summary()` Supabase function and migration remain installed; no data, permission or schema rollback. APQC details remain reachable in the existing Process Map and Catalog.
- Final build/deploy and signed-in browser validation are separate evidence gates; record them in TASKS after verification.

### Home APQC panel removal — Production verification (2026-10-29)

- PR [#89](https://github.com/apqc-process-map/apqc-platform/pull/89) merged to `main` as `c6afa12295ecefee31f9cf6c9665b5b4cbf2563b`.
- Vercel Production `dpl_4iZf6cFgiPXiV7V17QfSKhn543BZ` reached **READY**, and the `pnj-apqc-platform.vercel.app` alias was verified. The complete APQC distribution panel is no longer part of Home.
- Remaining QA: authenticated interactive browser acceptance, mobile layout and filters; READY confirms deployment/build, not that every click path has been tested.

## 2026-10-29 — CEO Home simplification (current UI scope)

- Home now answers three executive questions: what document activity was recorded, which issuing departments contributed, and whether document findings were discovered or remedied. Only four period KPIs appear in the top control center. Body **02** combines document registration/upload time trend with a top-five issuing-department ranking and source-backed top-three share; body **03** ends with **one** Finding discovered/remedied trend and one concise footer showing current unresolved/overdue stocks.
- The separate **"Tồn đọng và chất lượng dữ liệu"** block (three large numbers, detailed status chips and metadata-completeness note) and duplicated **"Điểm cần lưu ý"** strip are **removed**. There is no row-level finding list in Home. Detailed finding/action operations continue in Tab 06.
- The UI uses existing `home_document_finding_summary(date,date)` data with caller RLS; no schema, Supabase function or business records modified. Data definitions and historic status/role views are preserved. One-period zero uploaded-file caveat avoids claiming metadata registrations are binaries.
- Responsive layout favors a paired document-activity/issuing-department report and full-width bottom Finding chart. The removed executive card CSS is not loaded. New period-based KPI targets or comparative rates were not invented.
- Pending gates: exact Production commit/alias and authenticated browser QA after final Preview; see TASKS.

### CEO Home management layout — Production verification (2026-10-29)

- PR [#91](https://github.com/apqc-process-map/apqc-platform/pull/91) merged as commit `d0c3e3668442c56239436220d1b7357b98de42cb`.
- Vercel Production deployment `dpl_216PrtUr4woUDi4j4RurdEhFdrSS` reached **READY**; the `pnj-apqc-platform.vercel.app` alias was verified for that exact release.
- Final production build and TypeScript checks passed. Actual interactive signed-in browser visual E2E remains unverified, tracked separately in TASKS.

## 2026-10-30 — Installment Process Map restoration

- Root cause verified in Supabase: all 11 installment process identities remained active, but all mappings referenced the former inactive APQC framework, so active-framework Process Map reads correctly filtered them out.
- Migration `20261029022000_restore_installment_process_map.sql` is applied. Verified result: 11 active-framework Proposed mappings, 11 historical inactive-framework mappings retained, six exact current document links restored, and 12 archived installment document identities retained.
- Six former sources have no exact current workbook counterpart and remain intentionally unlinked rather than inferred.
- This migration changes data links only; schema, grants, RLS and client secret boundaries are unchanged.
- PR #94 merged to main as 38a54e619a215a3fefd96c05ccae480fa5c6d427; Vercel Production dpl_DbzHsEcNRF2QgBQofVqU3YaxHevv reached READY on the official alias. Authenticated Admin Preview/Production QA confirmed the end-to-end process and QTTG.1–QTTG.9, exact evidence counts, working search, no horizontal overflow at 1280 px and no console warning/error.

## 2026-10-30 — Process Map multi-view work in progress

- Landscape remains the default L0–L4 view. Explorer, Registry and Coverage are implemented as alternate presentations using the same active APQC, enterprise-process and current-document data already loaded by Process Map.
- Shared selection restores APQC Category/Process Group context when a process is selected from a cross-category view. Existing metadata detail/editing and RLS/private-file boundaries are unchanged.
- No database migration or sample data from the supplied HTML is introduced. Quality/build pass. Authenticated Preview QA at 1024/1280 px confirms all four views, shared search/selection/detail, no horizontal overflow and no console warning/error; merge and Production verification remain pending.

## 2026-10-30 — Process Map legend/registry correction

- All four Process Map views now use one shared three-state coverage legend.
- View C is an APQC Framework Registry: rows are active APQC L0–L2 nodes, while enterprise process and document data are summarized only as coverage counts.
- No database migration or business-data mutation is involved. Quality/build and authenticated Preview QA pass at 1024/1280 px with 449 APQC rows, working search/counts, one shared legend per view, no page overflow and no console warning/error.
- PR #97 merged as b21fbc227cfbcc566a0caeac1d22d00717d199f7. Vercel Production dpl_BqnBhYsKmE6xC9UKkeaTQscXmBpi is READY on pnj-apqc-platform.vercel.app; authenticated Production QA reconfirmed 449 rows, the shared legend and a clean console.
## 2026-10-30 — Document workflow synchronization

- Production Supabase migrations `20261030010000_document_workflow_relationship_sync.sql` and `20261030010500_fix_document_review_submission_order.sql` are applied. Document lifecycle changes are atomic, create/close one review task, enforce valid transitions and four-eyes approval, and notify the submitter on decision.
- Governance reads the RLS-visible open document review queue; Action Log receives decision notifications with exact Document links. Review rows are visible only to Admin, submitter or assigned Admin.
- Direct `document_process_links` now continuously synchronize system-derived proposed `documented_by` Relationship edges. Process Map continues to read the direct link; Relationship reads the governed graph. Archived objects are excluded from reconciliation and verified relationships are preserved.
- Live post-migration verification found the lifecycle RPC and both triggers present. Six active direct links coexist with eighteen active `documented_by` relationships because the graph also retains governed/manual or historical active edges; the counts are not expected to be one-to-one.
- Remaining workflow QA limitation: no Editor account exists in the six-account production set, so a true Editor-submit/different-Admin-decision browser run is still pending. Direct Storage upload also retains the low-probability orphan-object risk if the browser terminates after upload but before metadata registration.
