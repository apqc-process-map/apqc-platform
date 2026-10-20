drop policy if exists "active users read reading_assignments" on public.reading_assignments;
drop policy if exists "active users read reading_acknowledgments" on public.reading_acknowledgments;

create policy "users read own assignments or managers read all"
on public.reading_assignments for select to authenticated
using (profile_id = (select auth.uid()) or (select public.current_profile_role()) in ('editor','admin'));

create policy "users read own acknowledgments or managers read all"
on public.reading_acknowledgments for select to authenticated
using (exists (
  select 1 from public.reading_assignments assignment
  where assignment.id = assignment_id
    and (assignment.profile_id = (select auth.uid()) or (select public.current_profile_role()) in ('editor','admin'))
));

create policy "users acknowledge own assignments"
on public.reading_acknowledgments for insert to authenticated
with check (exists (
  select 1 from public.reading_assignments assignment
  where assignment.id = assignment_id and assignment.profile_id = (select auth.uid())
));

grant insert on public.reading_acknowledgments to authenticated;
create index if not exists reading_assignments_profile_object_idx
  on public.reading_assignments(profile_id, object_type, due_at);
