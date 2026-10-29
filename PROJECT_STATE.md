# Project State

Last reviewed: 2026-10-29.

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
- `pnpm quality` passes: ESLint, TypeScript, 51-migration integrity check and all three Node unit tests.
- Next.js 16.4.1 production build passes all 15 routes. Supabase Security Advisor reports only the existing leaked-password-protection setting; Performance Advisor reports no unindexed foreign keys after `20261029020000` was applied; governance coverage is active-framework-only via `20261029021000`. Browser/visual QA, Git merge and final Vercel deployment remain pending for this branch.
## Remaining gates

1. Process Owner must still validate proposed APQC mappings, unknown metadata/effective dates and 113 evidence cells; source binaries 13–14 remain unavailable.
2. Editor-specific QA needs an approved Editor account or a temporary role change.

## Deferred scope

Entra SSO, custom metadata-field creation, AI/OCR document analysis, BPMN editing, mobile-specific UI, fine-grained ACLs, full immutable relationship history and operational KPI observations remain outside the MVP unless explicitly approved.
## Recent substantial changes

- Replaced the active APQC reference and company document library from the two controlled workbook sheets while preserving prior frameworks/documents for audit.
- Added active-framework enforcement, controlled APQC interpretation metadata, source-row audit metadata, exact document/APQC mappings and workbook checksum logging.
- Scoped product reads to active/current records and added controlled interpretation to APQC detail.