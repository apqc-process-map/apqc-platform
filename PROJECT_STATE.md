# Project State

## Product and stack

Process Map is a desktop-first internal demo for browsing and governing enterprise processes aligned to APQC PCF v8.0. Enterprise processes remain independent from the immutable APQC reference taxonomy.

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Supabase Auth, PostgreSQL, Row Level Security, private Storage, and versioned migrations.
- GitHub `apqc-process-map/apqc-platform` deploys automatically to Vercel project `apqc-platform`.
- UI language is Vietnamese; APQC source wording remains English.

## Verified data

- APQC import: 2,017 elements, 3,284 metrics, 13 categories, levels 1–5, no missing parents, duplicate PCF IDs, or orphan metrics.
- Demo sandbox: 10 disposable enterprise processes with complete Executive Summary metadata, 10 applicability-covered versions, 6 controlled tags/15 process tag assignments, 32 verified relationships, 5 typed findings, 3 documents with metadata/tags, and existing workflow fixtures.
- Documents: 3 disposable documents with 4 versions covering draft, in-review, and effective states; every version has a process link and 2 document reading assignments exist.
- Six active Auth accounts use the approved mix of three Admin and three Viewer. Credentials are not stored in Git. There is no Editor account.
- Licensed APQC source files and private documents remain outside Git.

## Implemented capabilities

- Authenticated route protection, login/session/logout, role-aware navigation, and Admin/Viewer RLS boundaries.
- APQC catalog search/detail, hierarchy, descriptions, metrics, and attribution.
- Data-driven Process Map with breadcrumbs, URL-persisted selection, scoped descendants, search, card/table views, APQC reference handoff, and persistent detail.
- Centered relationship network with inbound/outbound labels, one-hop default, explicit two-hop expansion, filtering, table, and legend.
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
- Supabase Security Advisor now reports only the account-level warning that leaked-password protection is disabled. Coordinate enabling it with replacement of the shared demo password.

## Verification

- `supabase/tests/lifecycle_and_notifications.sql` passed in a rolled-back transaction for severity SLA, completeness output, inverse labels, document publication gate, and four-eyes approval.
- Vercel preview builds for the implementation branch are succeeding; Vercel is the build gate because Node.js is unavailable on the laptop.
- Unauthenticated web checks return the Vietnamese login page and protected routes redirect to `/login?error=required`.
- Local lint/build was not rerun in this session because Node.js is unavailable.
- Authenticated browser visual QA at 1024/1280/wide, Edge golden flow, and a real private file upload/preview remain unexecuted.

## Pending and blocked

- Notification scheduler migration `20261019000012_notification_scheduler.sql` is applied. `pg_cron` job `process-map-due-notifications` is active daily at 01:00 UTC (08:00 Asia/Ho_Chi_Minh).
- Editor RLS behavior cannot be executed without changing the user-approved account mix or temporarily changing a production profile role.
- Document lifecycle remains partial until a complete metadata editor exposes validity, review dates, and scheduled publication.
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
