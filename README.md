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
- Tab 02 (`/documents`) uses one controlled **Loại tài liệu**; **Nhóm tài liệu** is derived/read-only, preserving the stored legacy group for untyped drafts. The 2026-10-21 content-quality pass simplified 9 redundant/unclear type names, replaced slash-heavy group captions with seven concise group labels, and separated the derived-group field label, value and help text. Document filters, cards, lifecycle status, access, risk and dates now use consistent Vietnamese display labels; old mixed-case group codes remain filterable. Admin can multi-select active business roles in **Phải biết**, **Nên biết / tham chiếu**, and **Không áp dụng**; an unselected role remains **Chưa xác định**. Each role belongs to at most one group per document.
- Tab 05 (`/role-knowledge`) displays the three confirmed knowledge groups. Knowledge classification does **not** grant document access and does **not** create individual notifications/reading assignments automatically. Migration `20261021000034_document_knowledge_audience.sql` and PR [#50](https://github.com/apqc-process-map/apqc-platform/pull/50) are released (Vercel Production READY, 2026-10-21); authenticated form E2E remains pending.
- Tab 06 (`/findings`) exclusively lists issues arising between **at least two separate document identities**, each with linked version-level evidence. It supports explicit action decisions and multiple owner/deadline/progress-tracked corrective actions.
- The demonstration contains **8** fictional tagged cross-document findings, **16** draft metadata-only demo documents, and **10** example actions, mapped to ten enterprise processes. **They are not real findings, extracted clauses, or approved operating rules.**
- Legacy general/single-document findings remain stored but are not shown in tab 06. No automatic AI conflict detection, file full-text comparison or OCR is implemented.
- Source-of-truth documents: [PRD](PRD.md) (scope), [DATA_MODEL](DATA_MODEL.md) (schema/RLS), [PLAN](PLAN.md) (milestones), [TASKS](TASKS.md) (status), and [PROJECT_STATE](PROJECT_STATE.md) (current verified state).

Production: https://pnj-apqc-platform.vercel.app/

## Performance and page loading

- Authenticated page rendering explicitly waits for request context and verifies identity with Supabase `getClaims()`. Access to profiles, document versions and findings remains governed by RLS.
- Filters on the main workspaces navigate through Next `<Form>` without full browser reload. Sidebar navigation prefetches on interaction intent; file downloads retain standard links.
- Server-side Vercel Functions are configured in `syd1` (Sydney), alongside Supabase. Change this only after measuring latency from end-user locations.
- The loading skeleton is a *perceived responsiveness* improvement; it does not replace optimizing real server response times. Performance acceptance targets and pending E2E checks are recorded in `TASKS.md` and `PROJECT_STATE.md`.
