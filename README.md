# Process Map

Desktop-first internal process-governance application aligned to APQC PCF 8.0. Enterprise processes, documents, relationships and findings are governed independently; APQC remains the reference taxonomy.

## Stack and delivery

- Next.js 16 App Router, React 19 and TypeScript.
- Supabase Auth, PostgreSQL/RLS and private Storage.
- GitHub `apqc-process-map/apqc-platform`; `main` is the Vercel production source.
- Vercel project `hoang-apqc/apqc-platform`; public Supabase client variables are configured in Vercel and secrets are never committed.
- Production: https://pnj-apqc-platform.vercel.app/

## Current controlled dataset

- APQC PCF 8.0: 2,017 elements and 3,284 metrics.
- 12 installment-document identities/versions with private source files.
- 11 evidenced enterprise-process nodes (L0, L1 and nine L2 nodes).
- 35 findings, 22 corrective actions and 113 source-evidence cells.
- Six active accounts: three Admin and three Viewer. Credentials and licensed/private source files stay outside Git.

## Main modules

01 Home · 02 Document · 03 Process Map · 04 Relationship · 05 Vai trò của tôi · 06 Finding & Action · 07 Catalog · 08 Governance · 09 Action Log.

**01 Home reporting (2026-10-29):** a date-filtered, RLS-aware quick insight dashboard (7 days inclusive by default, 30/90 days or custom dates). It separates new document records from actual uploaded file attachments, counts document findings discovered/remediated, displays two time trends and new documents by issuing department, and exposes current document-finding backlog, overdue actions and missing department metadata. The SQL aggregation is in `supabase/migrations/20261029000001_home_document_finding_summary.sql`; see PRD and DATA_MODEL for precise measures.

**Home executive layout:** The role-aware `ADMIN CONTROL CENTER`/workspace header now contains the date selector, four period KPIs, and compact current portfolio totals in one unified panel. Below, an interactive APQC L1→L2→L3 drill-down (13/74/362 PNJ-controlled nodes) shows current linked-document coverage. Operational attention (department distribution, backlog and recent trends) comes afterward. The hierarchy uses `home_apqc_hierarchy_summary()` from migration `20261029000002_home_executive_apqc_hierarchy.sql`; it does not double-count the two APQC frameworks or pretend mapping is compliance.

Document intake supports governed metadata, private direct-to-Storage upload, signed file access, lifecycle states, process links, applicability, tags and role-knowledge classification. Finding displays the full controlled issue register and evidence consolidation; Action Log tracks corrective-action work and notification history. Automated AI/OCR document comparison is not implemented.

## Development

The laptop does not need a system Node.js installation when work is run through the bundled Codex runtime. In a standard developer environment:

```bash
pnpm install
pnpm quality
pnpm build
pnpm dev
```

`pnpm quality` runs ESLint, TypeScript, migration integrity checks and unit tests. Pull requests and pushes to `main` also run `.github/workflows/quality.yml`. Vercel remains the deployment owner; CI does not create a second deployment.

## Source of truth

- [PRD.md](PRD.md): confirmed product behavior and scope.
- [DATA_MODEL.md](DATA_MODEL.md): schema, lifecycle and RLS model.
- [PLAN.md](PLAN.md): delivery phases and remaining gates.
- [TASKS.md](TASKS.md): canonical task status.
- [PROJECT_STATE.md](PROJECT_STATE.md): concise cross-session verified state.

Uploaded documents, APQC workbook sources, user passwords, environment values and database dumps must not be committed.