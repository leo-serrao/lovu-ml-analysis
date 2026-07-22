# Market Intelligence MVP Tasks

**Design**: `.specs/features/market-intel-mvp/design.md`
**Testing**: `.specs/codebase/TESTING.md`
**Status**: Draft

> **Critical ordering:** Phase 2 ends with **T6 — the `/search` de-risk spike**. If T6 confirms the `/search` 403 gotcha, STOP and reassess before Phase 3/4. No collection or panel-data work starts until T6 proves `/search` returns data with our token.

> **Vercel scope guard (hard checkpoint):** Any Vercel create/deploy (T1.5, T15) MUST target the **personal account `leoserraos-projects`** (https://vercel.com/leoserraos-projects) — NEVER a company team, even if the MCP is authed to one. Confirm the exact team/scope with the user and wait for explicit approval BEFORE creating a project or deploying.

---

## Execution Plan

### Phase 1: Foundation (Sequential + one early branch)

```
T1 ─┬→ T2 → T3 → T4
    └→ T1.5   (early deploy → provides redirect URI for T5)
```

### Phase 2: Auth + De-risk Spike (Sequential — GATE)

```
T5 → T6   (T5 needs T1.5 + T2; T6 gates all downstream work)
```

### Phase 3: Collection Pipeline (after T6)

```
        ┌→ T7 [P] ┐
T6 ─────┼→ T8 [P] ┼→ T10 → T12
T3 ─────┴→ T9 [P] ┘
T6 ─────→ T11 ────────────→ (feeds T12 smoke)
```

### Phase 4: Panel (after T4 + T6 — parallel track to Phase 3)

```
T13 → T14 → T15   (expands the skeleton from T1.5; adds views + Basic Auth)
```

---

## Task Breakdown

### T1: Scaffold standalone repo

**What**: Next.js (App Router, TS) app + `supabase/` dir (functions + migrations) + Vitest + pnpm, in this repo.
**Where**: repo root (`package.json`, `app/`, `supabase/`, `vitest.config.ts`, `tsconfig.json`)
**Depends on**: None
**Reuses**: Supabase-project conventions from Adega Piloto/Pact
**Requirement**: infra (supports all)
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [ ] `pnpm install` succeeds; `pnpm build` builds an empty Next app
- [ ] `pnpm test` runs Vitest (0 tests, green)
- [ ] `supabase/` scaffolded (`supabase init`)
**Tests**: none
**Gate**: build — `pnpm build`
**Commit**: `chore(setup): scaffold next + supabase + vitest`

---

### T1.5: Minimal panel skeleton + initial Vercel deploy

**What**: Commit a minimal Next.js skeleton with `/api/ml-auth/callback` as a **stub** (returns 200, logs the received `code`) — no token exchange yet. Deploy to the **personal Vercel account** so a stable HTTPS URL exists for the redirect URI.
**Where**: `app/page.tsx` (placeholder), `app/api/ml-auth/callback/route.ts` (stub)
**Depends on**: T1
**Reuses**: n/a
**Requirement**: AUTH-01 (enables redirect URI registration)
**Tools**: MCP: NONE (see status note) · Skill: NONE
**Status note (2026-07-22)**: The Vercel MCP connection only exposes the `Sharpi` company team (`list_teams` / `list_projects` show no personal-account scope). Per the hard scope guard, the agent did NOT use this MCP to create/deploy. **User deployed manually** via the Vercel dashboard, importing from GitHub (`leo-serrao/lovu-ml-analysis`, `main`) into the personal scope **"leoserraos's projects" (Hobby)** — confirmed correct, not Sharpi.
**Done when**:
- [x] Skeleton committed (`app/page.tsx`, `app/api/ml-auth/callback/route.ts`)
- [x] `GET /api/ml-auth/callback?code=...` returns 200 and logs the code (verified locally AND in production)
- [x] No Basic Auth yet (only a callback stub, no sensitive data exposed)
- [x] User deployed manually to the personal Vercel account (`leoserraos's projects`, Hobby tier)
- [x] Public HTTPS URL confirmed: **`https://lovu-ml-analysis.vercel.app`** — redirect URI = `https://lovu-ml-analysis.vercel.app/api/ml-auth/callback`
**Tests**: none
**Gate**: build — `pnpm build` (passed locally); production smoke-tested (`GET /` → 200, `GET /api/ml-auth/callback?code=teste123` → 200 `{"received":true,"code":"teste123"}`)
**Commit**: `chore(deploy): minimal panel skeleton + ml-auth callback stub` (`e33d497`, pushed to `origin/main`, auto-deployed by Vercel)

**T1.5 — COMPLETE.**

---

### T2: Provision dedicated Supabase project

**What**: Create a new dedicated Supabase project, link the CLI, enable Vault.
**Where**: `supabase/config.toml`, project linked
**Depends on**: T1
**Reuses**: n/a
**Requirement**: infra / AUTH-01
**Tools**: MCP: `Supabase` (create/list project, confirm) · Skill: NONE
**Status note (2026-07-22)**: User created the project directly in the Supabase dashboard (`lovu-ml-analysis`, ref `aimmwwireujuhkuolgwv`, region `sa-east-1`, org `dgxtvoibbjefcdugavle`) — separate from existing `pact`/`delivery` projects. Confirmed dedicated and isolated.
**Done when**:
- [x] New project exists and CLI is linked (`supabase link --project-ref aimmwwireujuhkuolgwv`)
- [x] Vault available (`supabase_vault` extension already installed by default on this project)
- [x] Env vars documented (`.env.example`: Supabase URL/publishable key/service role, ML client id/secret/redirect URI, panel Basic Auth)
**Tests**: none
**Gate**: none (manual verify)
**Commit**: `chore(setup): provision dedicated supabase project`

**T2 — COMPLETE.**

---

### T3: Database schema migration

**What**: One migration creating all tables + indexes from the design data model.
**Where**: `supabase/migrations/0001_schema.sql`
**Depends on**: T2
**Reuses**: n/a
**Requirement**: HIST-01, HIST-02, HIST-03, COLLECT-02, COLLECT-03
**Tools**: MCP: `Supabase` (apply_migration, list_tables) · Skill: NONE
**Done when**:
- [ ] Tables: `seed_terms`, `trend_categories`, `collection_runs`, `run_terms`, `search_snapshots`, `trend_snapshots`, `collection_errors`
- [ ] Indexes: `search_snapshots(seed_term_id, captured_at)`, `(ml_item_id)`, `(run_id)`, `trend_snapshots(run_id)`
- [ ] `seed_terms` has `priority` + `result_limit`; `run_terms.status` ∈ {ok,empty,failed}
- [ ] Verified via `list_tables` / query of `information_schema`
**Tests**: none (verify via query)
**Gate**: none
**Commit**: `feat(db): snapshot schema + indexes`

---

### T4: SQL analytics views

**What**: The derived views for the panel.
**Where**: `supabase/migrations/0002_views.sql`
**Depends on**: T3
**Reuses**: n/a
**Requirement**: PANEL-01, PANEL-02, HIST-01
**Tools**: MCP: `Supabase` (apply_migration, execute_sql) · Skill: NONE
**Done when**:
- [ ] Views: `v_price_band`, `v_top_items`, `v_item_evolution`, `v_rising_products`, `v_rising_terms`
- [ ] Fixture check: seed 2 runs of known rows, each view returns the expected shape/values
**Tests**: none (fixture-query verification)
**Gate**: none
**Verify**: seed sample rows via `execute_sql`; assert `v_price_band` min/median/max and `v_rising_products` delta match hand-computed values
**Commit**: `feat(db): analytics views for panel`

---

### T5: OAuth token exchange in the callback route

**What**: Implement the real authorization-code exchange + Vault storage **in the existing `/api/ml-auth/callback` route** (created as a stub in T1.5). Upgrades the stub from log-only to full token handling.
**Where**: `app/api/ml-auth/callback/route.ts` (implement), `lib/ml/oauth.ts`
**Depends on**: T1.5, T2
**Reuses**: the stub route from T1.5; standard OAuth authorization-code grant
**Requirement**: AUTH-01
**Tools**: MCP: `Supabase` (Vault via execute_sql) · Skill: NONE
**Done when**:
- [ ] Route exchanges `code` → access + refresh token via ML `/oauth/token`
- [ ] Tokens stored as Vault secrets (`ml_access_token`, `ml_refresh_token`, `ml_token_expires_at`)
- [ ] Pure exchange/parse logic in `lib/ml/oauth.ts` unit-tested
**Tests**: unit (token exchange parsing)
**Gate**: quick — `pnpm test`
**Commit**: `feat(auth): ml oauth token exchange + vault storage`

---

### T6: De-risk spike — validate `/search` + `/trends`, resolve category_id ⚠️ GATE

**What**: With a real bootstrapped token, call `/sites/MLB/search` and `/trends/MLB/{id}`; confirm search returns data (not 403); resolve the true pet `category_id` live via `/sites/MLB/categories`; seed `trend_categories`.
**Where**: `scripts/spike-validate-ml.ts`, findings appended to `design.md` Research Findings
**Depends on**: T5, T3
**Reuses**: `lib/ml/oauth.ts` (token)
**Requirement**: AUTH-02, AUTH-03
**Tools**: MCP: `Supabase` · Skill: NONE
**Done when**:
- [ ] `/sites/MLB/search?q=petisco natural cachorro` returns items with our token (403 gotcha resolved or documented)
- [ ] Real pet `category_id` confirmed (candidate `MLB1071`) and inserted into `trend_categories`
- [ ] `/trends/MLB/{id}` returns entries (or degradation documented if seller-gated)
- [ ] Outcome written to `design.md`; STATE.md decision logged
- [ ] **If `/search` fails with our token → STOP, escalate to user before Phase 3/4**
**Tests**: none (documented outcome)
**Gate**: none
**Commit**: `chore(spike): validate ml endpoints + resolve pet category`

---

### T7: ML API Client [P]

**What**: Typed wrapper over `/search` + `/trends` with throttle + exponential backoff on 429/5xx; per-call failure surfaced, never throws the whole run.
**Where**: `lib/ml/client.ts`
**Depends on**: T6
**Reuses**: `lib/ml/oauth.ts`
**Requirement**: COLLECT-01, COLLECT-03
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [ ] `search(query, {limit})` and `trends(categoryId)` implemented
- [ ] Backoff on 429/5xx; returns typed results or a per-call error object
- [ ] Response parsing + backoff logic unit-tested (mocked fetch)
- [ ] Gate passes: `pnpm test`
- [ ] Test count: ≥6 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ml): api client with throttle + backoff`

---

### T8: Token Manager [P]

**What**: `getAccessToken()` — read Vault, refresh (always, given weekly>6h), rotate + re-persist refresh_token, return fresh access token.
**Where**: `lib/ml/token-manager.ts`
**Depends on**: T6
**Reuses**: `lib/ml/oauth.ts`, Vault
**Requirement**: COLLECT-04, AUTH-01
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [ ] Refreshes and persists the rotated refresh_token back to Vault
- [ ] Refresh/rotation logic unit-tested (mocked fetch + Vault)
- [ ] Gate passes: `pnpm test`
- [ ] Test count: ≥4 tests pass
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ml): token manager with refresh rotation`

---

### T9: Snapshot Repository [P]

**What**: DB writes for a run; pure domain→row mapping unit-tested, writes via Supabase client.
**Where**: `lib/db/repository.ts`, `lib/db/mappers.ts`
**Depends on**: T3
**Reuses**: n/a
**Requirement**: COLLECT-02, COLLECT-03
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [ ] `startRun/finishRun/saveSearchSnapshot/saveTrendSnapshot/markTermStatus/logError`
- [ ] Pure mappers (ML item → search_snapshot row; trend entry → trend_snapshot row) unit-tested
- [ ] Gate passes: `pnpm test`
- [ ] Test count: ≥5 tests pass
**Tests**: unit
**Gate**: quick
**Commit**: `feat(db): snapshot repository + mappers`

---

### T10: Collector orchestrator (Edge Function)

**What**: Thin Deno Edge Function entrypoint: open run → loop active seed terms (respecting `result_limit`) → search + write snapshots + per-term status → pull trends for active categories → close run. Wires T7/T8/T9.
**Where**: `supabase/functions/collect/index.ts`
**Depends on**: T7, T8, T9
**Reuses**: `lib/ml/client.ts`, `lib/ml/token-manager.ts`, `lib/db/repository.ts`
**Requirement**: COLLECT-01, COLLECT-02, COLLECT-03, COLLECT-04
**Tools**: MCP: `Supabase` (deploy_edge_function, get_logs) · Skill: NONE
**Done when**:
- [ ] Smoke run produces one `collection_run` + snapshots for all active terms with a shared timestamp
- [ ] Empty term → `run_terms.status='empty'` (no rows); failing term → logged + run continues (`partial`)
- [ ] Verified via `get_logs` + DB query after `supabase functions serve` invoke
**Tests**: none (smoke run)
**Gate**: none
**Verify**: invoke locally; query `collection_runs`, `run_terms`, `search_snapshots` for the run
**Commit**: `feat(collect): weekly collector edge function`

---

### T11: Seed data

**What**: Insert the 13 seed terms (priority + result_limit: high=100, normal=50) and active `trend_categories` (id from T6).
**Where**: `supabase/migrations/0003_seed.sql`
**Depends on**: T3, T6
**Reuses**: seed list in `context.md`
**Requirement**: config (COLLECT-01)
**Tools**: MCP: `Supabase` (apply_migration) · Skill: NONE
**Done when**:
- [ ] 7 high-priority food terms (`result_limit=100`), 6 normal accessory terms (`result_limit=50`)
- [ ] `trend_categories` has the confirmed pet category, `active=true`
- [ ] Verified via `SELECT` count/values
**Tests**: none
**Gate**: none
**Commit**: `feat(db): seed premium-pet terms + trend category`

---

### T12: Weekly schedule (pg_cron + pg_net)

**What**: Schedule the collector to run weekly by invoking the Edge Function via pg_net.
**Where**: `supabase/migrations/0004_cron.sql`
**Depends on**: T10
**Reuses**: n/a
**Requirement**: COLLECT-01
**Tools**: MCP: `Supabase` (apply_migration, execute_sql) · Skill: NONE
**Done when**:
- [ ] `cron.schedule` weekly entry calls the `collect` function URL via `pg_net`
- [ ] Manual `cron` trigger produces a run (smoke)
- [ ] Verified via `cron.job` table + a resulting `collection_run`
**Tests**: none
**Gate**: none
**Commit**: `feat(collect): weekly pg_cron schedule`

---

### T13: Panel read client + shell (expand existing skeleton)

**What**: Add a server-side Supabase read client and a panel shell **to the existing skeleton from T1.5** (do NOT recreate scaffold). No Basic Auth yet.
**Where**: `lib/db/read-client.ts`, `app/(panel)/layout.tsx`
**Depends on**: T1.5, T4
**Reuses**: skeleton from T1.5; views from T4
**Requirement**: PANEL-01 (support), PANEL-02 (support), PANEL-03 (support)
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [ ] Server-side Supabase read client reads the analytics views
- [ ] Panel shell renders as an expansion of the existing skeleton
- [ ] Gate passes: `pnpm build`
**Tests**: none (manual verify)
**Gate**: build
**Commit**: `feat(panel): read client + shell over existing skeleton`

---

### T14: Panel views + Basic Auth middleware

**What**: Render per-term price bands, top items, rising products, rising terms (with single-run fallback), AND add HTTP Basic Auth via Next middleware — protection enters here, now that the panel exposes real data.
**Where**: `app/(panel)/page.tsx`, `app/(panel)/_components/*`, `middleware.ts`
**Depends on**: T13, T4
**Reuses**: views from T4, `lib/db/read-client.ts`
**Requirement**: PANEL-01, PANEL-02, PANEL-03, PANEL-04
**Tools**: MCP: NONE · Skill: `frontend-design` (optional, light)
**Done when**:
- [ ] Per seed term: competitors, price band (min/median/max), top items by sold_quantity
- [ ] With ≥2 runs: rising products + rising terms; with 1 run: current-state + "history not yet available"
- [ ] Partial run: renders available data, marks gaps
- [ ] Requests without valid Basic Auth credentials get 401
- [ ] Verified manually against seeded data; `pnpm build` passes
**Tests**: none (manual verify)
**Gate**: build
**Commit**: `feat(panel): niche views + history fallback + basic auth`

---

### T15: Promote expanded panel to Vercel

**What**: Redeploy the expanded panel (views + Basic Auth) to the **existing** Vercel personal project from T1.5, and ensure env vars are set. Redirect URI was already registered at T1.5 — not repeated here.
**Where**: existing Vercel personal project (`leoserraos-projects`)
**Depends on**: T14
**Reuses**: Vercel project created in T1.5
**Requirement**: PANEL-04
**Tools**: MCP: `Vercel` (deploy to the same personal project) · Skill: NONE
**Done when**:
- [ ] **Deploy targets the same personal `leoserraos-projects` project (confirm scope, never company team)**
- [ ] Expanded panel live; deployed URL rejects access without Basic Auth (401)
- [ ] Env vars set in Vercel (Supabase, ML client id/secret)
**Tests**: none (manual verify)
**Gate**: none
**Commit**: `chore(deploy): promote panel with views + auth`

---

## Parallel Execution Map

```
Phase 1:
  T1 ─┬→ T2 → T3 → T4
      └→ T1.5           (early deploy; feeds T5's redirect URI)

Phase 2 (Sequential, GATE):
  T5 (needs T1.5 + T2) → T6 ⚠️

Phase 3 (after T6):
    ├── T7 [P] ┐
    ├── T8 [P] ┼→ T10 → T12
    └── T9 [P] ┘
    T11 (needs T3 + T6) ──→ feeds T12 smoke

Phase 4 (after T4 + T6, parallel to Phase 3):
    T13 → T14 → T15
```

`[P]` set {T7, T8, T9}: no interdependencies, all unit tests (parallel-safe: Yes), separate files, no shared mutable state.

---

## Pre-Approval Validation

### Check 1 — Task Granularity

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 scaffold | repo setup (cohesive) | ✅ |
| T1.5 skeleton + deploy | skeleton + stub route + 1 deploy (cohesive) | ✅ |
| T2 provision | 1 infra action | ✅ |
| T3 schema | 1 migration | ✅ |
| T4 views | 1 migration (cohesive views) | ✅ |
| T5 oauth exchange | 1 route + 1 lib | ✅ |
| T6 spike | 1 validation script | ✅ |
| T7 client | 1 module | ✅ |
| T8 token manager | 1 module | ✅ |
| T9 repository | 1 module + mappers | ✅ |
| T10 collector | 1 edge function | ✅ |
| T11 seed | 1 migration | ✅ |
| T12 cron | 1 migration | ✅ |
| T13 read client + shell | client + shell (cohesive) | ✅ |
| T14 views + auth | page + components + middleware (cohesive) | ✅ |
| T15 deploy | 1 deploy action | ✅ |

### Check 2 — Diagram ↔ Definition Cross-Check

| Task | Depends On (body) | Diagram | Status |
| ---- | ----------------- | ------- | ------ |
| T1 | None | root | ✅ |
| T1.5 | T1 | T1→T1.5 | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T2 | T2→T3 | ✅ |
| T4 | T3 | T3→T4 | ✅ |
| T5 | T1.5, T2 | T1.5→T5, T2→T5 | ✅ |
| T6 | T5, T3 | T5→T6 (+T3) | ✅ |
| T7 | T6 | T6→T7 | ✅ |
| T8 | T6 | T6→T8 | ✅ |
| T9 | T3 | T3→T9 | ✅ |
| T10 | T7, T8, T9 | T7/T8/T9→T10 | ✅ |
| T11 | T3, T6 | T6→T11 | ✅ |
| T12 | T10 | T10→T12 | ✅ |
| T13 | T1.5, T4 | T4→T13 (+T1.5) | ✅ |
| T14 | T13, T4 | T13→T14 | ✅ |
| T15 | T14 | T14→T15 | ✅ |

`[P]` tasks {T7,T8,T9} do not depend on each other. ✅

### Check 3 — Test Co-location Validation

| Task | Layer | Matrix requires | Task says | Status |
| ---- | ----- | --------------- | --------- | ------ |
| T1 | scaffold | none | none | ✅ |
| T1.5 | skeleton + stub route | none | none | ✅ |
| T2 | infra | none | none | ✅ |
| T3 | migration | none | none | ✅ |
| T4 | SQL views | none (fixture) | none | ✅ |
| T5 | oauth pure logic | unit | unit | ✅ |
| T6 | spike script | none | none | ✅ |
| T7 | pure logic (client) | unit | unit | ✅ |
| T8 | pure logic (token) | unit | unit | ✅ |
| T9 | repository mappers | unit | unit | ✅ |
| T10 | edge function | none | none | ✅ |
| T11 | seed migration | none | none | ✅ |
| T12 | cron migration | none | none | ✅ |
| T13 | read client + shell | none | none | ✅ |
| T14 | panel UI + middleware | none | none | ✅ |
| T15 | deploy | none | none | ✅ |

All three checks pass. ✅

---

## Requirement Coverage

| Requirement | Task(s) |
| ----------- | ------- |
| COLLECT-01 | T7, T10, T11, T12 |
| COLLECT-02 | T3, T9, T10 |
| COLLECT-03 | T7, T9, T10 |
| COLLECT-04 | T8, T10 |
| HIST-01 | T3, T4 |
| HIST-02 | T3, T9 |
| HIST-03 | T3, T4 |
| PANEL-01 | T4, T13, T14 |
| PANEL-02 | T4, T13, T14 |
| PANEL-03 | T13, T14 |
| PANEL-04 | T14, T15 |
| AUTH-01 | T1.5, T5, T8 |
| AUTH-02 | T6 |
| AUTH-03 | T6 |

14/14 requirements mapped to tasks. 0 unmapped.
