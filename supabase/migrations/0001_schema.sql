-- Market Intelligence MVP: snapshot schema
-- Design ref: .specs/features/market-intel-mvp/design.md (Data Models)
-- Principle: store raw snapshots, derive analytics in SQL views (0002_views.sql).

create table seed_terms (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  priority text not null check (priority in ('high', 'normal')),
  result_limit int not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table trend_categories (
  id text primary key,
  label text not null,
  active boolean not null default true
);

create table collection_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'complete', 'partial', 'failed')),
  notes text
);

create table run_terms (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references collection_runs(id),
  seed_term_id uuid not null references seed_terms(id),
  status text not null check (status in ('ok', 'empty', 'failed')),
  items_collected int not null default 0
);

create table search_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references collection_runs(id),
  seed_term_id uuid not null references seed_terms(id),
  ml_item_id text not null,
  title text not null,
  price numeric not null,
  currency text not null,
  sold_quantity int not null,
  available_quantity int,
  seller_id text not null,
  seller_nickname text,
  listing_type text,
  free_shipping boolean,
  permalink text,
  position int not null,
  captured_at timestamptz not null default now()
);

create table trend_snapshots (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references collection_runs(id),
  category_id text not null references trend_categories(id),
  keyword text not null,
  trend_type text not null check (trend_type in ('rising', 'most_wanted', 'popular')),
  position int not null,
  captured_at timestamptz not null default now()
);

create table collection_errors (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references collection_runs(id),
  seed_term_id uuid references seed_terms(id),
  stage text not null check (stage in ('auth', 'search', 'trends', 'write')),
  http_status int,
  message text not null,
  captured_at timestamptz not null default now()
);

create index idx_search_snapshots_seed_term_captured on search_snapshots (seed_term_id, captured_at);
create index idx_search_snapshots_ml_item_id on search_snapshots (ml_item_id);
create index idx_search_snapshots_run_id on search_snapshots (run_id);
create index idx_trend_snapshots_run_id on trend_snapshots (run_id);
