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

- No application capabilities are implemented.
- Product discovery and initial MVP decisions are documented in `PRD.md`.
- Architecture sequence is documented in `PLAN.md`.
- Proposed schema is documented in `DATA_MODEL.md`.
- Implementation backlog is documented in `TASKS.md`.

## In progress

- Foundation shell implementation and deployment verification.
- Foundation code is scaffolded; local Vercel/Supabase linkage files exist, while the database schema and Auth/RLS implementation are not started.

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

- Lint and production build pass. Supabase project is healthy with zero tables/migrations/advisor lints. Vercel production deployment is READY. No application flow tests or database migrations have been run.
- No application tests exist or have been run.
- No deployment has been attempted.

## Recent substantial changes

- 2026-10-16: Created the initial product, architecture, data-model, task, repository-guidance, and project-state documentation baseline from user-confirmed discovery decisions.
