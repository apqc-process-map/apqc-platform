# Project State

Last reviewed: 2026-10-28.

## Product and architecture

Process Map is a desktop-first internal application for browsing and governing enterprise processes aligned to APQC PCF 8.0. APQC is an immutable reference taxonomy; enterprise processes, documents, relationships and findings are separate governed objects.

- Next.js 16 App Router, React 19, TypeScript and CSS/Tailwind tooling.
- Supabase Auth, PostgreSQL with RLS, private Storage and versioned SQL migrations.
- GitHub `apqc-process-map/apqc-platform`; Vercel builds previews from feature branches and production from `main`.
- UI is Vietnamese; APQC source IDs/wording remain English.

## Verified production data

- APQC: 2,017 elements, 3,284 metrics, 13 categories, levels 1–5, no known orphan/duplicate import defects.
- Controlled installment scope: 12 document identities/versions with 12 private binaries; 11 process nodes (L0, L1 and nine L2); 11 proposed APQC mappings; 35 findings; 22 corrective actions; 104 document-version links; 35 process-version links; 113 source-evidence cells. Six dangling `[DEMO]` relationship fixtures were removed after confirming that their source roles and target documents no longer existed. Twelve confirmed document-process links are now represented as proposed `documented_by` relationships.
- Six active accounts: three Admin and three Viewer; no Editor account. Credentials are not stored in Git.
- APQC workbook and supplied business documents remain outside Git.

## Implemented behavior

- Authenticated route protection, role-aware navigation and database-enforced RLS.
- APQC catalog/search/detail and data-driven Process Map with L0–L4 bands, search, selection, metadata detail/editing and linked documents.
- Process Map landscape now uses APQC PCF level 1 as L0 and APQC PCF level 2 as L1; L2 is evidence-gated and shows only enterprise records with visible linked documents. Repository process levels and proposed mappings remain unchanged.
- Process Map marks APQC L0/L1 branches with mapped lower-level process data plus document evidence, mapped lower-level data without documents, and branches without mapped data using three intensity states; L2 remains based on directly linked documents.
- Process Map uses a focus-and-context hierarchy layout: compact L0 overview, descriptive L1 cards, selected-path highlighting and a drill-down connector to document-backed L2 cards.
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

- TypeScript: passed.
- ESLint: passed with zero warnings after replacing the raw image element and fixing dead bindings.
- Migration integrity: 45 SQL files with unique 14-digit versions, no UTF-8 BOM and no detected credentials.
- Search helper unit tests: 3 passed (required an unsandboxed Node test runner because Windows blocked child-process spawn in the restricted sandbox).
- Supabase production: four hardening migrations applied and migration-ledger filenames synchronized. Viewer simulation returned 12 visible non-effective documents and zero rows outside Viewer `allowed_roles`; Viewer mutation RPC was denied. Admin rollback probe passed create/update Document, create Finding and create Action atomically, with zero probe rows persisted.
- Final Next.js 16.4.1 production build passed all 15 routes. Authenticated Preview QA at 1024 px passed for Viewer document access (including Draft metadata/private PDF), special-character search, Admin 35/35 Finding Matrix links and Relationship loading with no horizontal overflow or console errors.
- PR #72 merged as `393aa4a`. Vercel production deployment `dpl_AJm7tSBQkkqyAFMWA17fvdRg5oEn` reached READY on `pnj-apqc-platform.vercel.app`; authenticated production smoke tests passed for Documents 12/12, Process Map L0–L2, Findings 35/35 and Relationship 12/12 proposed document links, with no browser-console or recent Vercel runtime error.

## Remaining gates

1. Process Owner must still validate proposed APQC mappings, unknown metadata/effective dates and 113 evidence cells; source binaries 13–14 remain unavailable.
2. Editor-specific QA needs an approved Editor account or a temporary role change.

## Deferred scope

Entra SSO, custom metadata-field creation, AI/OCR document analysis, BPMN editing, mobile-specific UI, fine-grained ACLs, full immutable relationship history and operational KPI observations remain outside the MVP unless explicitly approved.

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
