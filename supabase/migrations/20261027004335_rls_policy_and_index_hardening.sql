-- Remove overlapping permissive SELECT/write policies and index foreign keys used by joins.


-- Avoid duplicate SELECT policy evaluation while preserving the existing write rules.
drop policy if exists "workers manage finding links" on public.finding_links;
create policy "workers insert finding links" on public.finding_links for insert to authenticated
with check ((select public.current_profile_role()) in ('editor','admin'));
create policy "workers update finding links" on public.finding_links for update to authenticated
using ((select public.current_profile_role()) in ('editor','admin'))
with check ((select public.current_profile_role()) in ('editor','admin'));
create policy "workers delete finding links" on public.finding_links for delete to authenticated
using ((select public.current_profile_role()) in ('editor','admin'));

drop policy if exists "workers manage finding participants" on public.finding_participants;
create policy "workers insert finding participants" on public.finding_participants for insert to authenticated
with check ((select public.current_profile_role()) in ('editor','admin'));
create policy "workers update finding participants" on public.finding_participants for update to authenticated
using ((select public.current_profile_role()) in ('editor','admin'))
with check ((select public.current_profile_role()) in ('editor','admin'));
create policy "workers delete finding participants" on public.finding_participants for delete to authenticated
using ((select public.current_profile_role()) in ('editor','admin'));

drop policy if exists "users manage own reaction" on public.finding_reactions;
create policy "users insert own reaction" on public.finding_reactions for insert to authenticated
with check (profile_id = (select auth.uid()));
create policy "users update own reaction" on public.finding_reactions for update to authenticated
using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy "users delete own reaction" on public.finding_reactions for delete to authenticated
using (profile_id = (select auth.uid()));

create index if not exists apqc_elements_parent_id_idx on public.apqc_elements(parent_id);
create index if not exists comments_author_id_idx on public.comments(author_id);
create index if not exists comments_parent_comment_id_idx on public.comments(parent_comment_id);
create index if not exists comments_thread_id_idx on public.comments(thread_id);
create index if not exists document_files_uploaded_by_idx on public.document_files(uploaded_by);
create index if not exists document_process_links_process_id_idx on public.document_process_links(process_id);
create index if not exists document_process_links_process_version_id_idx on public.document_process_links(process_version_id);
create index if not exists document_versions_approved_by_idx on public.document_versions(approved_by);
create index if not exists document_versions_created_by_idx on public.document_versions(created_by);
create index if not exists document_versions_designated_approver_id_idx on public.document_versions(designated_approver_id);
create index if not exists document_versions_document_type_value_id_idx on public.document_versions(document_type_value_id);
create index if not exists document_versions_owner_id_idx on public.document_versions(owner_id);
create index if not exists document_versions_published_by_idx on public.document_versions(published_by);
create index if not exists document_versions_submitted_by_idx on public.document_versions(submitted_by);
create index if not exists document_versions_supersedes_version_id_idx on public.document_versions(supersedes_version_id);
create index if not exists documents_created_by_idx on public.documents(created_by);
create index if not exists finding_actions_created_by_idx on public.finding_actions(created_by);
create index if not exists finding_events_actor_id_idx on public.finding_events(actor_id);
create index if not exists findings_created_by_idx on public.findings(created_by);
create index if not exists findings_finding_type_value_id_idx on public.findings(finding_type_value_id);
create index if not exists findings_resolution_type_value_id_idx on public.findings(resolution_type_value_id);
create index if not exists object_applicability_system_id_idx on public.object_applicability(system_id);
create index if not exists object_applicability_vocabulary_value_id_idx on public.object_applicability(vocabulary_value_id);
create index if not exists process_apqc_mappings_apqc_element_id_idx on public.process_apqc_mappings(apqc_element_id);
create index if not exists process_apqc_mappings_verified_by_idx on public.process_apqc_mappings(verified_by);
create index if not exists process_assignments_inherited_from_process_id_idx on public.process_assignments(inherited_from_process_id);
create index if not exists process_assignments_profile_id_idx on public.process_assignments(profile_id);
create index if not exists process_business_object_flows_business_object_id_idx on public.process_business_object_flows(business_object_id);
create index if not exists process_versions_approved_by_idx on public.process_versions(approved_by);
create index if not exists process_versions_created_by_idx on public.process_versions(created_by);
create index if not exists process_versions_published_by_idx on public.process_versions(published_by);
create index if not exists process_versions_submitted_by_idx on public.process_versions(submitted_by);
create index if not exists process_versions_supersedes_version_id_idx on public.process_versions(supersedes_version_id);
create index if not exists process_versions_updated_by_idx on public.process_versions(updated_by);
create index if not exists review_requests_assigned_admin_id_idx on public.review_requests(assigned_admin_id);
create index if not exists review_requests_submitted_by_idx on public.review_requests(submitted_by);
create index if not exists vocabulary_values_parent_value_id_idx on public.vocabulary_values(parent_value_id);
