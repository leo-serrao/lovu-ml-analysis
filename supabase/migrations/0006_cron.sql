-- Market Intelligence MVP: weekly pg_cron schedule for the collect Edge Function
-- Design ref: .specs/features/market-intel-mvp/tasks.md T12.
-- Auth note: the Authorization header only needs to pass the Function Gateway's
-- verify_jwt check (any valid Supabase-signed JWT). The collect function builds
-- its own Supabase client from its auto-injected SUPABASE_SERVICE_ROLE_KEY env var,
-- independent of the caller's identity, so the legacy anon JWT (public by design)
-- is sufficient here -- no service_role key needs to be stored for this job.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'collect-weekly',
  '0 6 * * 1', -- every Monday 06:00 UTC
  $$
  select net.http_post(
    url := 'https://aimmwwireujuhkuolgwv.supabase.co/functions/v1/collect',
    headers := jsonb_build_object(
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbW13d2lyZXVqdWhrdW9sZ3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MzQ0NDYsImV4cCI6MjEwMDMxMDQ0Nn0.uFozTxhXOsANjofnDxGgopdPJYAUTJbLRoK10roChf0',
      'Content-Type', 'application/json'
    )
  ) as request_id;
  $$
);
