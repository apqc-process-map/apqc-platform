# Demo workspace data

Supabase contains 10 reversible enterprise-process fixtures marked with `source_code` values beginning `DEMO-20261016-`. The rich fixture migration is `supabase/migrations/20261019000012_rich_demo_metadata.sql`.

## Coverage

- 10 process versions with bilingual names, purpose, description, scope, trigger, outcome, all five Executive Summary fields, lifecycle dates, access level and allowed roles.
- Applicability examples for department, location, channel, product/service, system, employee audience and exception.
- 6 controlled governance tags with 15 process assignments and document assignments.
- 3 systems, 3 risks, 3 KPIs, 3 business roles, 4 business objects, input/output flows and verified relationship evidence.
- 3 demo documents with multiple versions, document group/type/language/access metadata, process links, applicability and tags. No fake binary files are created; upload testing still uses a real sample file.
- 5 demo findings across workflow states with finding type, resolution, due date and process evidence links.
- Existing comments, reactions, participants, reading assignments, acknowledgments and notifications remain available for workflow testing.

## Cleanup

Run the whole script in `scripts/delete-demo-processes.sql` in Supabase SQL Editor. It removes only demo documents, process versions, metadata, tags, findings, relationships, catalogs and uploaded test objects. Do not use a broad `delete from public.processes` command because the real-data boundary is intentionally protected by the `DEMO-20261016-` marker.
