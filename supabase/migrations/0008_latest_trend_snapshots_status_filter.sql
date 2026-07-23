-- Fixes v_latest_trend_snapshots (0007) to skip fully-failed runs, matching the
-- v_rising_products (0002) precedent: a 'failed' run has zero trend_snapshots by
-- construction (see supabase/functions/collect/index.ts), so picking it as "latest"
-- silently returns empty instead of falling back to the last good run.
create or replace view v_latest_trend_snapshots as
with latest_run as (
  select id as run_id
  from collection_runs
  where status in ('complete', 'partial')
  order by started_at desc
  limit 1
)
select ts.*
from trend_snapshots ts
join latest_run lr on lr.run_id = ts.run_id
order by ts.category_id, ts.trend_type, ts.position;
