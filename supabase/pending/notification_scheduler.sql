-- PENDING EXPLICIT PRODUCTION APPROVAL.
-- Move this file into supabase/migrations with a fresh timestamp only after approval.
-- Schedule due-date notifications at 08:00 Asia/Ho_Chi_Minh (01:00 UTC).
-- The notification functions are idempotent and use deterministic deduplication keys.
create extension if not exists pg_cron with schema pg_catalog;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid
    from cron.job
    where jobname = 'process-map-due-notifications'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;
end
$$;

select cron.schedule(
  'process-map-due-notifications',
  '0 1 * * *',
  $job$
    select public.create_due_finding_notifications();
    select public.create_due_review_notifications();
  $job$
);
