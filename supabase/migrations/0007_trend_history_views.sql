-- Market Intelligence MVP: trend-only panel views (T13)
-- Design ref: .specs/features/market-intel-mvp/design.md, spec.md "Panel views rework"
-- v_rising_terms (0002) already covers "rising, latest run" — these two cover the
-- rest of PANEL-01 (all trend types, latest run) and HIST-01/03 (cross-run history).

-- Latest run's trend_snapshots, all trend types, per category (PANEL-01).
create view v_latest_trend_snapshots as
with latest_run as (
  select id as run_id
  from collection_runs
  order by started_at desc
  limit 1
)
select ts.*
from trend_snapshots ts
join latest_run lr on lr.run_id = ts.run_id
order by ts.category_id, ts.trend_type, ts.position;

-- Full cross-run history per category + keyword, for movement queries (HIST-01/03).
create view v_trend_term_history as
select
  ts.category_id,
  ts.keyword,
  ts.run_id,
  r.started_at,
  ts.trend_type,
  ts.position
from trend_snapshots ts
join collection_runs r on r.id = ts.run_id
order by ts.category_id, ts.keyword, r.started_at;
