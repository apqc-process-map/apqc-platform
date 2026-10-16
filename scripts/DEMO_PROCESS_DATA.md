# Demo process data

The Supabase project contains 10 reversible demo processes marked with `source_code` values beginning `DEMO-20261016-`.

To remove only these demo processes after real data is ready, run:

```sql
delete from public.processes where source_code like 'DEMO-20261016-%';
```

The foreign-key cascades remove their version, assignments, aliases, and APQC mapping rows.
