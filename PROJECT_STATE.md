# Project State

## Project summary

Process Map is a desktop-first internal demo for navigating and governing enterprise processes aligned to APQC PCF v8.0. Enterprise processes remain independent from the immutable APQC reference taxonomy.

## Current stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Supabase Auth, PostgreSQL, Row Level Security, and private Storage.
- GitHub repository deployed to Vercel.

## Verified architecture and data

- Server-rendered protected routes use the public Supabase client with user cookies; authorization remains enforced by RLS.
- Protected navigation now covers Catalog, Relationships, Documents, Findings, Governance, and Notifications.
- Versioned migrations define E1-E8 data foundations, including findings, notifications, governance views, APQC Admin policies, and private document storage.
- APQC PCF v8.0 import contains exactly 2,017 elements, 3,284 metrics, five levels, and 13 categories; validation found no duplicate IDs, missing parents, or orphan metrics.
- Six demo Auth accounts exist using the user-approved role mix: three Admin and three Viewer. Credentials are not stored in Git.

## Completed capabilities

- E0 application, GitHub, Vercel, and Supabase foundation.
- Supabase Auth, profile roles, login/session refresh/logout, and Admin/Viewer RLS checks.
- APQC workbook validation/import, hierarchy reconstruction, metrics, attribution, and Catalog search.
- Enterprise process/version hierarchy, assignments, APQC mappings, completeness, publication gates, overlap checks, and four-eyes database validation.
- Process Catalog, relationship workflow/table, document/version/review/reading schema, and private Storage foundation.
- Layered Process Map prototype with synthetic fixtures.
- Finding schema with generated codes, links, participants, reactions, SLA defaults, events, evidence links, RLS, and three representative findings.
- Role-aware Home, Governance, Findings, and Notifications surfaces backed by Supabase views/tables.

## In progress or blocked

- Editor role behavior is not verified because the approved six-user mix contains no Editor account.
- APQC dedicated detail page remains outstanding; imported search and attribution are available.
- Real enterprise process seed data remains blocked pending representative samples; Process Map still uses synthetic fixtures.
- Finding workflow actions, comments/reactions UI, assignment UI, activity timeline UI, and notification event/read actions remain partial.
- Secure document upload, signed preview/download, full lifecycle actions, and field-level comparison remain partial.
- Interactive centered relationship graph and explicit expansion remain partial.

## Security and operational notes

- Supabase security advisor reports no exposed tables or missing-RLS findings after the latest migrations.
- One WARN remains: Auth leaked-password protection is disabled. Enabling it should be coordinated with replacement of the shared demo password.
- Admin and Viewer sessions can read APQC/findings; a Viewer direct insert attempt is denied by RLS. Editor and complete private-Storage behavior still require testing.
- The licensed APQC workbook remains outside Git; only importer code, migrations, and metadata are version controlled.

## Verification status

- pnpm lint: passed on 2026-10-16.
- pnpm build: passed on 2026-10-16; 12 routes compiled successfully.
- Supabase migrations through 20261016000005 applied successfully on 2026-10-16.
- APQC database validation: 2,017 elements, 3,284 metrics, 13 categories, levels 1-5, zero missing parents, zero duplicate PCF IDs, and zero orphan metrics.
- Six demo users authenticated successfully; Viewer forbidden-write behavior was verified.
- Production deployment `dpl_381Yk7zFDw61x79QXjx7TcePYJui` is READY on commit `3e8ed4f`; Admin login and Home, Catalog, Findings, Governance, and Notifications routes were verified against live Supabase data.

## Next recommended work

1. Complete Editor, private-Storage, accessibility, 1024/1280/wide visual, and Edge browser verification.
2. Add one Editor demo account only if the user approves changing the requested account mix, then complete the three-role RLS matrix.
3. Implement finding workflow actions, comments/reactions, event-driven notifications, and notification read state.
4. Supply representative enterprise and document samples to unblock real process seeding and importer design.
5. Complete signed document upload/preview/download and remaining accessibility/visual/golden-flow QA.

## Recent substantial changes

- 2026-10-16: Created the approved six demo users and verified authentication plus Admin/Viewer access boundaries.
- 2026-10-16: Validated and imported the licensed APQC v8.0 workbook with exact source counts and hierarchy integrity.
- 2026-10-16: Added findings, notifications, governance views, role-aware dashboards, and representative finding records.
