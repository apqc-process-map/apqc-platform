-- Harden notification helpers reported by Supabase Security Advisor.
alter function public.notification_deep_link(public.review_object_type)
  set search_path = public;

revoke all on function public.create_due_finding_notifications() from public, anon, authenticated;
revoke all on function public.create_due_review_notifications() from public, anon, authenticated;
revoke all on function public.notify_finding_change() from public, anon, authenticated;

grant execute on function public.create_due_finding_notifications() to service_role;
grant execute on function public.create_due_review_notifications() to service_role;
