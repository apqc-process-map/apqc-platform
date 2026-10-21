# Process Map

Desktop-first process governance demo aligned to APQC PCF 8.0.

## Foundation

- Next.js App Router, TypeScript, Tailwind CSS
- Supabase project: `apqc-process-map's Project`
- Vercel project: `hoang-apqc/apqc-platform`
- Public Supabase environment keys are configured in Vercel; secrets are not committed

## Local development

```bash
pnpm install
pnpm dev
```

Quality checks:

```bash
pnpm lint
pnpm build
```

## Current modules and demo scope (2026-10-21)

- The application is populated with APQC reference data and ten synthetic enterprise processes; Home is **not** an uninitialized Foundation empty state.
- Navigation: **01 Home**, **02 Document**, **03 Process Map**, **04 Relationship**, **05 Vai trò của tôi**, **06 Finding & Action**, **07 Catalog**, **08 Governance**, **09 Action Log**.
- Tab 06 (`/findings`) exclusively lists issues arising between **at least two separate document identities**, each with linked version-level evidence. It supports explicit action decisions and multiple owner/deadline/progress-tracked corrective actions.
- The demonstration contains **8** fictional tagged cross-document findings, **16** draft metadata-only demo documents, and **10** example actions, mapped to ten enterprise processes. **They are not real findings, extracted clauses, or approved operating rules.**
- Legacy general/single-document findings remain stored but are not shown in tab 06. No automatic AI conflict detection, file full-text comparison or OCR is implemented.
- Source-of-truth documents: [PRD](PRD.md) (scope), [DATA_MODEL](DATA_MODEL.md) (schema/RLS), [PLAN](PLAN.md) (milestones), [TASKS](TASKS.md) (status), and [PROJECT_STATE](PROJECT_STATE.md) (current verified state).

Production: https://pnj-apqc-platform.vercel.app/