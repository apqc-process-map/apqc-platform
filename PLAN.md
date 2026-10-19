# Process Map — Implementation Plan

## 1. Delivery strategy

Build the MVP as vertical slices that each produce a demonstrable user outcome. Do not scaffold every proposed module before the first end-to-end path works.

The first release uses one Supabase project for local/preview/demo data. Changes must therefore be migration-driven and non-destructive by default.

## 2. Proposed architecture

### Web

- Next.js App Router with TypeScript.
- Server Components for initial reads and permission-aware page composition.
- Server Actions or route handlers for governed mutations.
- Client Components only for interaction-heavy surfaces: map, relationship graph, tables, form state, and charts.

### Data

- Supabase PostgreSQL as the source of truth.
- Supabase Auth with six seeded email/password demo users.
- RLS for read/write authorization.
- Private Supabase Storage for document files.
- SQL migrations under source control.
- APQC importer reads the licensed workbook outside Git and upserts reference data.

### UI

- Tailwind CSS and CSS-variable design tokens.
- Radix primitives and customized shadcn/ui.
- React Flow for the relationship network only.
- Layered hierarchy uses custom column-browser components, not React Flow.
- TanStack Table for catalogs, review queues, scope tables, and finding lists.
- Recharts for governance/finding dashboards.

### Validation and testing

- Zod schemas shared by forms and server mutations where practical.
- Unit tests for scoring, lifecycle, date, inverse relationship, and publication-gate logic.
- Database tests for RLS and critical constraints.
- Playwright for golden demo flows.
- axe-core plus visual QA for desktop accessibility and layout.

## 3. Phase plan

### Phase 0 — Repository and product foundation

- Scaffold Next.js/TypeScript.
- Add formatting, linting, tests, and environment examples.
- Establish design tokens and desktop shell.
- Create Supabase project linkage and migration workflow.
- Add safe configuration rules; no secrets in Git.

Exit: app shell runs locally, checks pass, and a no-data Vercel preview can build.

### Phase 1 — Authentication and authorization

- Create profiles and role model.
- Create six demo accounts securely.
- Implement sign-in/sign-out/session handling.
- Add route and action authorization.
- Add foundational RLS tests.

Exit: Viewer, Editor, and Admin see different navigation/actions; forbidden database writes fail.

### Phase 2 — APQC reference import

- Implement framework/element/metric schema.
- Build read-only workbook importer.
- Derive parent/level/order from hierarchy IDs.
- Import v8.0 elements and metrics.
- Add attribution and source/version UI.
- Validate expected counts and uniqueness.

Exit: 2,017 elements and 3,284 metrics are queryable with correct five-level hierarchy.

### Phase 3 — Enterprise process foundation

- Implement stable process identity and version schema.
- Add enterprise hierarchy and generated process codes.
- Add Executive Summary, ownership, applicability, lifecycle, and APQC mappings.
- Seed 20–30 coherent demo processes when samples are available; use clearly labeled synthetic fixtures only if necessary.
- Implement publication-gate validation and completeness scoring.

Exit: Editor can create a complete draft, map it to APQC, and submit it.

### Phase 4 — Process Map and Catalog

- Build Enterprise Landscape.
- Build layered column drill-down with breadcrumb and URL state.
- Add all-descendants scope Tree/Table.
- Add accessible preview and persistent detail panel.
- Build APQC reference/coverage view.
- Build global search and Catalog filters/sorts.

Exit: Viewer can navigate the hierarchy, understand a process in 60 seconds, and find content by metadata.

### Phase 5 — Relationships and context

- Add controlled relationship taxonomy.
- Add Business Objects and lightweight System/Risk/KPI/Business Role catalogs.
- Build relationship CRUD and verification.
- Build centered inbound/outbound network and relationship table.
- Keep hierarchy and cross-links visually separate.

Exit: Viewer can trace inputs/outputs and related context; Editor can propose and Admin can verify relationships.

### Phase 6 — Documents and review workflow

- Add documents, versions, private files, process links, and taxonomy.
- Validate file type/size in the intake flow, compute SHA-256 in the authenticated browser, and record the checksum with private Storage metadata.
- Add PDF/image preview and Office download.
- Add review threads, mentions, rejection reason, and four-eyes approval.
- Add scheduled/effective/superseded lifecycle behavior.
- Add metadata version comparison.
- Add reading assignments and acknowledgment.

Exit: the document/process authoring, approval, effective publication, and acknowledgment path works end-to-end.

### Phase 7 — Findings & Actions

- Add finding schema, workflow, participants, reactions, comments, decisions, and timeline.
- Seed representative duplicate/overlap/conflict/supersession findings.
- Add SLA calculation and notifications.
- Link findings to process/document versions and resolution evidence.

Exit: a seeded conflict can be assigned, discussed, resolved, validated, closed, and reopened by the correct roles.

### Phase 8 — Dashboards and notifications

- Build role-specific Home views.
- Add governance dashboard and transparent completeness breakdown.
- Add Finding dashboard with drill-down.
- Add notification center and event generation.

Exit: dashboards and notifications update from actual state transitions in the golden flow.

### Phase 9 — Hardening and deployment

- Run security review of Auth, RLS, server actions, upload validation, and signed URLs.
- Run responsive desktop visual QA at 1024, 1280, and wide layouts.
- Run Edge/Chrome golden-flow tests.
- Review accessibility, empty/loading/error/long-text states.
- Deploy to Vercel and verify Supabase environment configuration.
- Update `PROJECT_STATE.md` with verified results.

Exit: golden demo flow passes on the deployed Vercel URL.

## 4. Recommended schema/migration sequence

1. Extensions, enums, profiles, helper authorization functions.
2. APQC framework, elements, metrics.
3. Processes, process versions, assignments, mappings.
4. Controlled vocabularies and applicability.
5. Context objects, relationship types, relationships.
6. Documents, document versions, files, process links.
7. Reviews, comments, mentions, reading acknowledgment.
8. Findings, links, participants, reactions, events.
9. Notifications and governance views/functions.
10. RLS policies and policy tests after each owning table, not only at the end.

## 5. Key design decisions

- Enterprise hierarchy is the default map; APQC is a reference/coverage view.
- Column drill-down handles hierarchy; graph handles relationships.
- Process Executive Summary is structured, not a single abstract field.
- Process and document content are versioned independently.
- Relationship history is deferred; relationships represent current state.
- Findings are manually seeded/entered for MVP; AI remains replaceable behind the same interface later.
- One Supabase project increases migration risk; avoid destructive reset-based workflows.

## 6. Main risks and mitigations

### Real sample structure is unknown

Mitigation: keep import tasks blocked until representative files arrive. Do not overfit to the M-Files HTML demo.

### One shared Supabase environment

Mitigation: migration-only schema changes, idempotent seeds, backups before material migrations, no automatic preview reset.

### RLS complexity

Mitigation: define policy matrix first, test each role directly against Supabase, keep privileged mutations server-side.

### Dense process relationships

Mitigation: one-hop network by default, filters, explicit expansion, and table fallback.

### Metadata overload

Mitigation: progressive disclosure, publication-gate checklist, inheritance, controlled vocabularies, and Must-have/Nice-to-have separation.

### Licensed and internal data leakage

Mitigation: source workbook and business documents stay outside Git; private Storage and server-authorized access only.

## 7. Deferred discovery checkpoints

Reopen the following after receiving real samples:

- Demo end-to-end process selection.
- Enterprise import mapping and validation.
- PDF/DOCX structure extraction.
- AI overlap/conflict architecture and data policy.
- Fine-grained organizational access model.
- Relationship and full audit temporal models.
