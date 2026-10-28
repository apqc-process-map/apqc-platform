# Project State

Last reviewed: 2026-10-27.

## Product and architecture

Process Map is a desktop-first internal application for browsing and governing enterprise processes aligned to APQC PCF 8.0. APQC is an immutable reference taxonomy; enterprise processes, documents, relationships and findings are separate governed objects.

- Next.js 16 App Router, React 19, TypeScript and CSS/Tailwind tooling.
- Supabase Auth, PostgreSQL with RLS, private Storage and versioned SQL migrations.
- GitHub `apqc-process-map/apqc-platform`; Vercel builds previews from feature branches and production from `main`.
- UI is Vietnamese; APQC source IDs/wording remain English.

## Verified production data

- APQC: 2,017 elements, 3,284 metrics, 13 categories, levels 1–5, no known orphan/duplicate import defects.
- Controlled installment scope: 12 document identities/versions with 12 private binaries; 11 process nodes (L0, L1 and nine L2); 11 proposed APQC mappings; 35 findings; 22 corrective actions; 104 document-version links; 35 process-version links; 113 source-evidence cells. Six dangling `[DEMO]` relationship fixtures were removed after confirming that their source roles and target documents no longer existed.
- Six active accounts: three Admin and three Viewer; no Editor account. Credentials are not stored in Git.
- APQC workbook and supplied business documents remain outside Git.

## Implemented behavior

- Authenticated route protection, role-aware navigation and database-enforced RLS.
- APQC catalog/search/detail and data-driven Process Map with L0–L4 bands, search, selection, metadata detail/editing and linked documents.
- Process Map landscape now uses APQC PCF level 1 as L0 and APQC PCF level 2 as L1; L2 is evidence-gated and shows only enterprise records with visible linked documents. Repository process levels and proposed mappings remain unchanged.
- Process Map marks direct document evidence, APQC ancestors with evidenced descendants, and branches without visible evidence using distinct intensity states with an on-screen legend.
- Relationship network/table with controlled types, direction labels, document focus, governed create/edit and collapsed legend.
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
- PR #72 merged as `393aa4a`. Vercel production deployment `dpl_AJm7tSBQkkqyAFMWA17fvdRg5oEn` reached READY on `pnj-apqc-platform.vercel.app`; authenticated production smoke tests passed for Documents 12/12, Process Map L0–L2, Findings 35/35 and Relationship 0/0 empty state, with no browser-console or recent Vercel runtime error.

## Remaining gates

1. Process Owner must still validate proposed APQC mappings, unknown metadata/effective dates and 113 evidence cells; source binaries 13–14 remain unavailable.
2. Editor-specific QA needs an approved Editor account or a temporary role change.

## Deferred scope

Entra SSO, custom metadata-field creation, AI/OCR document analysis, BPMN editing, mobile-specific UI, fine-grained ACLs, full immutable relationship history and operational KPI observations remain outside the MVP unless explicitly approved.