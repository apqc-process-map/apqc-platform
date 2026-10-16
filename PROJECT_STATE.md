# Project State

## Project summary

Process Map is a planned desktop-first internal demo for navigating and governing enterprise processes aligned to APQC PCF v8.0. Enterprise processes are the primary objects; APQC is an immutable reference taxonomy.

## Current stack

Planned and user-approved; not yet scaffolded:

- Next.js App Router, TypeScript, Tailwind CSS.
- Supabase Auth, PostgreSQL, RLS, and private Storage.
- Vercel deployment from GitHub.
- React Flow, TanStack Table, Recharts, Radix/shadcn, React Hook Form, and Zod.

## Architecture snapshot

- Repository contains the planning baseline plus a Next.js Foundation shell.
- Git remote `origin` points to `https://github.com/apqc-process-map/apqc-platform.git`.
- One Supabase project is configured for MVP local/preview/demo use (`eksftbalhnqpguecdcaj`).
- Process and document content will be independently versioned.
- Enterprise-to-APQC mapping is many-to-many.
- Hierarchy drill-down and cross-process relationship graph are separate UI modes.

## Completed capabilities

- Foundation shell is implemented with Vietnamese desktop navigation, design tokens, and no-data states.
- E1 migration foundation defines profiles, system roles, and authenticated read access boundaries.
- E3 migration foundation defines enterprise process identity, generated codes, versioned content, hierarchy cycle prevention, publication date constraints, and many-to-many APQC mappings.
- Product discovery and initial MVP decisions are documented in `PRD.md`.
- Architecture sequence is documented in `PLAN.md`.
- Proposed schema is documented in `DATA_MODEL.md`.
- Implementation backlog is documented in `TASKS.md`.

## In progress

- E3 process schema is committed; process UI, publication workflow, completeness scoring, and real enterprise sample seed remain in progress.
- Authentication entry point and Supabase password sign-in action are implemented; full session refresh/sign-out and role-gated navigation remain in progress.

## Known issues / technical risks

- Representative enterprise-process samples have not been supplied.
- Import rules for Excel/CSV/PDF/DOCX remain unresolved.
- AI overlap/conflict detection and its data policy are unresolved.
- A single Supabase project raises preview/demo migration risk.
- Fine-grained draft visibility, relationship history, and full audit trail are deferred.

## Important decisions and constraints

- Product name is `Process Map`; no PNJ name or logo.
- UI is Vietnamese, desktop-only, Edge/Chrome, PNJ-inspired colors and typography.
- MVP has six demo users: two Viewer, two Editor, two Admin.
- APQC source workbook and internal documents must not be committed.
- Repository must remain safe if public.
- MVP target is 20â€“30 enterprise processes plus the complete APQC v8.0 reference.
- Findings are manually seeded/entered for MVP; AI is deferred.
- General audit trail, exports, mobile, BPMN editor, and file-content search are out of MVP scope.

## Next recommended work

1. Implement Auth/profile schema, migrations, and RLS.
2. Import and validate the APQC v8.0 reference workbook.
3. Build the Process Map and catalog experience.
4. Implement documents, relationships, findings, and governance dashboards.
5. Run visual/app/security verification before production milestones.

## Verification status

- Lint and production build pass before the E1/E2 changes; the migration/importer changes require a fresh verification run.
- Supabase CLI and Vercel CLI are not installed in the current environment, so remote migration/deployment verification is pending.
- No application flow tests, remote migrations, or deployment have been run in this session.

## Recent substantial changes

- 2026-10-16: Added the initial E1 authentication slice with Supabase SSR/browser clients and Vietnamese sign-in page.
