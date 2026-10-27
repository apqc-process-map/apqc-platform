-- Allow finding participants to collaborate without broadening unrelated public writes.
grant insert on public.comment_threads, public.comments, public.comment_mentions to authenticated;
grant update on public.comment_threads, public.comments to authenticated;

create policy "finding participants create threads" on public.comment_threads for insert to authenticated
with check (
  context_type='finding' and exists (
    select 1 from public.findings f where f.id=context_id and (
      f.created_by=(select auth.uid()) or f.assignee_id=(select auth.uid()) or
      exists (select 1 from public.finding_participants p where p.finding_id=f.id and p.profile_id=(select auth.uid()))
    )
  )
);
create policy "finding participants create comments" on public.comments for insert to authenticated
with check (
  author_id=(select auth.uid()) and exists (
    select 1 from public.comment_threads t join public.findings f on f.id=t.context_id
    where t.id=thread_id and t.context_type='finding' and (
      f.created_by=(select auth.uid()) or f.assignee_id=(select auth.uid()) or
      exists (select 1 from public.finding_participants p where p.finding_id=f.id and p.profile_id=(select auth.uid()))
    )
  )
);
create policy "authors update comments" on public.comments for update to authenticated
using (author_id=(select auth.uid())) with check (author_id=(select auth.uid()));
create policy "comment authors add mentions" on public.comment_mentions for insert to authenticated
with check (exists (select 1 from public.comments c where c.id=comment_id and c.author_id=(select auth.uid())));
create policy "comment authors remove mentions" on public.comment_mentions for delete to authenticated
using (exists (select 1 from public.comments c where c.id=comment_id and c.author_id=(select auth.uid())));