# Project State

## Project summary

Process Map is a desktop-first internal demo for navigating and governing enterprise processes aligned to APQC PCF v8.0. Enterprise processes remain independent from the immutable APQC reference taxonomy.

## Current stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4.
- Supabase Auth, PostgreSQL, Row Level Security, and private Storage.
- GitHub repository deployed to Vercel.

## Architecture snapshot

- Server-rendered protected data routes use the public Supabase client with user cookies; authorization remains enforced by RLS.
- src/proxy.ts refreshes sessions and protects Catalog, Relationships, and Documents.
- Enterprise hierarchy and APQC mapping are many-to-many and remain separate from cross-process relationships.
- Versioned migrations define E1-E3, E5, and E6 data foundations.

## Completed capabilities

- E0 application and deployment foundation.
- Supabase project linkage, profile roles, login/session refresh/logout.
- APQC schema and read-only workbook importer.
- Enterprise process/version hierarchy, aliases, assignments, applicability, APQC mappings, completeness, publication gates, overlap checks, and four-eyes validation.
- Process Catalog search across enterprise and APQC records.
- Relationship catalogs/workflow plus filterable relationship table and controlled-type legend.
- Document/version/review/reading schema, private 25 MB Storage bucket, publication constraints, and basic metadata version comparison.
- E4 layered Process Map prototype with synthetic fixtures.

## In progress

- Six demo Auth users and complete write-policy test matrix.
- APQC import validation and reference detail UI.
- Real enterprise process seed data and database-backed Process Map.
- Interactive centered relationship graph and explicit expansion.
- Secure document upload, signed preview/download, lifecycle actions, and field-level comparison.

## Known issues / technical risks

- Licensed APQC workbook and representative enterprise/document samples are not present in the workspace.
- Process Map still uses synthetic fixtures rather than Supabase records.
- One Supabase project serves MVP development/preview/demo, increasing migration coordination risk.
- Legacy planning files contain some mojibake inherited from earlier writes; user-facing routes added in this milestone use valid Vietnamese UTF-8.

## Important decisions and constraints

- Product name is Process Map; no PNJ name or logo.
- Desktop-first Vietnamese UI; current Edge/Chrome; target width 1024 px and above.
- APQC workbook, credentials, private documents, and service-role keys stay outside Git.
- Viewers see effective content; Editors author; Admins approve, with four-eyes separation.
- Mobile, BPMN editing, full audit history, file-content search, and AI analysis are deferred.

## Next recommended work

1. Create six approved demo users and execute the Viewer/Editor/Admin RLS matrix.
2. Supply and import the licensed APQC workbook; validate exact element and metric counts.
3. Replace Process Map fixtures with Supabase queries and representative enterprise records.
4. Implement signed document upload/preview/download and full lifecycle actions.
5. Add interactive relationship graph expansion and complete browser/accessibility QA.

## Verification status

- pnpm lint: passed on 2026-10-16 using the Codex bundled Node runtime.
- pnpm build: passed on 2026-10-16; /catalog, /documents, /login, and /relationships are dynamic routes.
- Supabase migration process_publication_gates applied successfully on 2026-10-16.
- Browser flow and role-matrix testing remain pending until demo users are available.

## Recent substantial changes

- 2026-10-16: Added session-protected Catalog, Relationships, and Documents surfaces.
- 2026-10-16: Strengthened process publication gates and four-eyes approval tracking.
- 2026-10-16: Applied and verified E3-E6 data foundations on Supabase.
