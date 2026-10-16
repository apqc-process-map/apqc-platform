# Project Instructions

These instructions extend the user's global Codex instructions for this repository.

## Project purpose

Build **Process Map**, a desktop-first internal demo for browsing and governing enterprise processes aligned to APQC PCF v8.0. The application is process-first: APQC is a reference taxonomy, while enterprise processes, documents, relationships, and findings are managed separately.

## Required context

Before substantial work, read:

1. `PROJECT_STATE.md`
2. `PRD.md`
3. `PLAN.md`
4. `DATA_MODEL.md`
5. The relevant items in `TASKS.md`

When these files disagree, stop and reconcile the conflict from repository evidence and confirmed user decisions before implementation.

## Scope discipline

- Keep MVP and deferred scope distinct.
- Do not implement open items as if they were confirmed requirements.
- Do not add mobile-specific UI; the MVP is desktop-only.
- Do not build a BPMN editor.
- Do not add AI document analysis until data-handling policy and real samples are approved.
- Do not add custom metadata-field creation in the MVP.

## Data and security

- Never commit credentials, demo passwords, Supabase service-role keys, signed URLs, private documents, or database dumps.
- Treat the repository as potentially public even if GitHub visibility is private.
- Store uploaded documents in private Supabase Storage.
- Enforce authorization with Supabase Row Level Security, not UI visibility alone.
- Client code may use only the public Supabase URL and anon key. Privileged operations must remain server-side.
- Keep the licensed APQC workbook outside Git. Commit importer code, schema, attribution, and non-sensitive fixtures only.

## Product conventions

- Preserve APQC PCF IDs and source wording in English.
- Store enterprise processes independently from APQC elements.
- Use many-to-many mappings between enterprise processes and APQC elements.
- Keep hierarchy navigation separate from cross-process relationship graphs.
- Use controlled vocabularies for statuses, relationship types, document types, and applicability dimensions.
- Use `Asia/Ho_Chi_Minh` for business dates and scheduled publication.
- UI language is Vietnamese; optional English fields are allowed where specified.

## UI conventions

- Follow the PNJ-inspired visual direction documented in `PRD.md`, without using the PNJ name or logo.
- Product name is **Process Map**.
- Target current desktop Microsoft Edge and Google Chrome.
- Optimize for widths of 1280 px and above; remain usable at 1024 px.
- Respect keyboard navigation, focus states, contrast, and reduced-motion preferences.
- Tooltip content must also be available on keyboard focus and be dismissible.

## Verification

- Do not claim a feature works without executing relevant checks.
- After material UI work, use `visual-qa` and `app-test`.
- For Supabase/auth/storage changes, verify RLS and use `security-review` before completion.
- Keep `PROJECT_STATE.md` concise and update it after substantial verified milestones.

## Git

- Do not commit, push, merge, or rewrite history unless explicitly requested.
- Keep generated and local configuration out of Git.
- Review the diff before proposing a commit.
