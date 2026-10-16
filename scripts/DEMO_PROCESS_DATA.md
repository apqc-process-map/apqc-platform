# Demo workspace data

The Supabase project contains 10 reversible demo processes marked with `source_code` values beginning `DEMO-20261016-`.

To remove only these demo processes after real data is ready, run:

```sql
delete from public.processes where source_code like 'DEMO-20261016-%';
```

The foreign-key cascades remove their version, assignments, aliases, and APQC mapping rows.


## Covered functions

The Supabase sandbox includes 10 enterprise processes with bilingual metadata, aliases, assignments, APQC mappings, and publication-ready versions; 3 systems, 3 risks, 3 KPIs, 3 business roles, 4 business objects; 7 input-output flows; 15 verified relationships; 5 findings across workflow states; links, participants, watchers, reactions, comments, reading assignments, acknowledgments, and demo notifications.

The notification trigger fix is versioned in supabase/migrations/20261016000009_fix_finding_notification_role.sql and uses profiles.role, the actual schema column.
