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

The current home screen is the Foundation shell and intentionally shows an empty state until APQC reference data and enterprise processes are imported.