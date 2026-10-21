-- Prevent Viewer data leakage for cross-document findings and associated evidence.
-- Existing general findings remain visible according to the existing Viewer access model.
drop policy if exists "active users read findings" on public.findings;
create policy "read findings by audience"
on public.findings for select to authenticated
using (
  (select public.current_profile_role()) in ('admin','editor')
  or ((select public.current_profile_role())='viewer' and finding_domain='general')
);
drop policy if exists "active users read finding links" on public.finding_links;
create policy "read finding links for visible findings"
on public.finding_links for select to authenticated
using (exists (select 1 from public.findings f where f.id=finding_id));
drop policy if exists "active users read finding events" on public.finding_events;
create policy "read finding events for visible findings"
on public.finding_events for select to authenticated
using (exists (select 1 from public.findings f where f.id=finding_id));
drop policy if exists "active users read finding participants" on public.finding_participants;
create policy "read finding participants for visible findings"
on public.finding_participants for select to authenticated
using (exists (select 1 from public.findings f where f.id=finding_id));
drop policy if exists "active users read reactions" on public.finding_reactions;
create policy "read finding reactions for visible findings"
on public.finding_reactions for select to authenticated
using (exists (select 1 from public.findings f where f.id=finding_id));
