# Project State

## Product and stack

Process Map is a desktop-first internal demo for browsing and governing enterprise processes aligned to APQC PCF v8.0. Enterprise processes remain independent from the immutable APQC reference taxonomy.

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Supabase Auth, PostgreSQL, Row Level Security, private Storage, and versioned migrations.
- GitHub `apqc-process-map/apqc-platform` deploys automatically to Vercel project `apqc-platform`.
- UI language is Vietnamese; APQC source wording remains English.

## Verified data

- APQC import: 2,017 elements, 3,284 metrics, 13 categories, levels 1–5, no missing parents, duplicate PCF IDs, or orphan metrics.
- Demo sandbox: 10 disposable enterprise processes, 15 relationships, 8 findings, 20 finding participants, and 12 notifications.
- Documents: 3 disposable documents with 4 versions covering draft, in-review, and effective states; every version has a process link and 2 document reading assignments exist.
- Six active Auth accounts use the approved mix of three Admin and three Viewer. Credentials are not stored in Git. There is no Editor account.
- Licensed APQC source files and private documents remain outside Git.

## Implemented capabilities

- Authenticated route protection, login/session/logout, role-aware navigation, and Admin/Viewer RLS boundaries.
- APQC catalog search/detail, hierarchy, descriptions, metrics, and attribution.
- Data-driven Process Map with breadcrumbs, URL-persisted selection, scoped descendants, search, card/table views, APQC reference handoff, and persistent detail.
- Centered relationship network with inbound/outbound labels, one-hop default, explicit two-hop expansion, filtering, table, and legend.
- Private document upload Server Action with 25 MB limit, MIME/extension matching, SHA-256 checksum, Storage metadata, and rollback cleanup.
- Signed private file route, PDF/image preview, Office download, role-gated lifecycle action, field-level version comparison, and disposable document fixtures.
- Finding workflow with explicit role transitions, assignment, resolution checks, participants/watchers, reactions, comments, readable event timeline, SLA defaults, and evidence links.
- Notification center with per-item/bulk read actions, live finding/assignment/review/reading triggers, and a daily due-date scheduler.
- Governance and finding summary views.

## Security status

- RLS is enabled on protected process, relationship, document, finding, comment, and notification tables.
- Viewer mutation probes were denied; an Admin document update probe succeeded inside a rollback transaction.
- Document lifecycle is gated in both Server Actions and `enforce_document_version_role()`; Editor cannot directly approve, publish, supersede, or archive.
- Storage is private. Active users may read; Editor/Admin may upload; uploader or Admin may delete for rollback/cleanup.
- Migration `20261019000013_notification_security_hardening.sql` removed public/authenticated execution from privileged notification functions and fixed the mutable `search_path`.
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

- Current work is on `codex/complete-mvp`.
- Production remains on the previously merged `main` until this branch passes its final Vercel preview check and pull request merge.
- `scripts/delete-demo-processes.sql` removes demo processes, relationships, findings, documents, reading assignments, and uploaded test objects in dependency order.
