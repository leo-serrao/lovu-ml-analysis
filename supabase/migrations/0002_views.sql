-- Market Intelligence MVP: analytics views over raw snapshots
-- Design ref: .specs/features/market-intel-mvp/design.md (Derived SQL views)
-- Snapshots are never mutated; all analytics are derived here.

create view v_price_band as
select
  run_id,
  seed_term_id,
  min(price) as min_price,
  percentile_cont(0.5) within group (order by price) as median_price,
  max(price) as max_price,
  count(distinct seller_id) as competitor_count,
  count(*) as item_count
from search_snapshots
group by run_id, seed_term_id;

-- Top 10 items by sold_quantity per run per term (panel display depth).
create view v_top_items as
select *
from (
  select
    s.*,
    row_number() over (partition by run_id, seed_term_id order by sold_quantity desc) as rank_in_term
  from search_snapshots s
) ranked
where rank_in_term <= 10;

create view v_item_evolution as
select
  s.ml_item_id,
  s.seed_term_id,
  s.run_id,
  r.started_at,
  s.price,
  s.sold_quantity,
  s.captured_at
from search_snapshots s
join collection_runs r on r.id = s.run_id
order by s.ml_item_id, r.started_at;

-- Largest sold_quantity delta between the two most recent runs, per item.
create view v_rising_products as
with ranked_runs as (
  select id as run_id, started_at,
    dense_rank() over (order by started_at desc) as run_rank
  from collection_runs
  where status in ('complete', 'partial')
),
latest as (
  select s.ml_item_id, s.seed_term_id, s.title, s.price, s.sold_quantity
  from search_snapshots s
  join ranked_runs rr on rr.run_id = s.run_id and rr.run_rank = 1
),
previous as (
  select s.ml_item_id, s.sold_quantity as prev_sold_quantity, s.price as prev_price
  from search_snapshots s
  join ranked_runs rr on rr.run_id = s.run_id and rr.run_rank = 2
)
select
  l.ml_item_id,
  l.seed_term_id,
  l.title,
  p.prev_price,
  l.price as current_price,
  p.prev_sold_quantity,
  l.sold_quantity as current_sold_quantity,
  (l.sold_quantity - p.prev_sold_quantity) as sold_quantity_delta
from latest l
join previous p on p.ml_item_id = l.ml_item_id
order by sold_quantity_delta desc;

-- Rising search terms from the most recent run only.
create view v_rising_terms as
with latest_run as (
  select id as run_id
  from collection_runs
  order by started_at desc
  limit 1
)
select ts.*
from trend_snapshots ts
join latest_run lr on lr.run_id = ts.run_id
where ts.trend_type = 'rising'
order by ts.position;
