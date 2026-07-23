# Market Intelligence MVP Tasks

**Design**: `.specs/features/market-intel-mvp/design.md`
**Testing**: `.specs/codebase/TESTING.md`
**Status**: Draft

> **SCOPE CHANGE (2026-07-22):** T6 confirmed the `/search` 403 gotcha as a real, unfixable platform restriction (see design.md T6 spike results). v1 is descoped to **`/trends`-only** — no price bands, no top items, no per-term competitors. T7, T9, T10, T11, T13, T14 below are rewritten for this scope; T3/T4's `search_snapshots`/`seed_terms`/`run_terms`/`v_price_band`/`v_top_items`/`v_item_evolution`/`v_rising_products` are now obsolete but left in place (not dropped) pending a decision — see spec.md Open Items.
>
> **Critical ordering (historical):** Phase 2 ended with **T6 — the `/search` de-risk spike**, which gated Phase 3/4. T6 is complete; the gate tripped (403 confirmed), triggering this rescope.

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
- [x] Tables: `seed_terms`, `trend_categories`, `collection_runs`, `run_terms`, `search_snapshots`, `trend_snapshots`, `collection_errors`
- [x] Indexes: `search_snapshots(seed_term_id, captured_at)`, `(ml_item_id)`, `(run_id)`, `trend_snapshots(run_id)`
- [x] `seed_terms` has `priority` + `result_limit`; `run_terms.status` ∈ {ok,empty,failed}
- [x] Verified via `list_tables` / query of `information_schema`
**Tests**: none (verify via query)
**Gate**: none
**Commit**: `feat(db): snapshot schema + indexes`

**T3 — COMPLETE.**

---

### T4: SQL analytics views

**What**: The derived views for the panel.
**Where**: `supabase/migrations/0002_views.sql`
**Depends on**: T3
**Reuses**: n/a
**Requirement**: PANEL-01, PANEL-02, HIST-01
**Tools**: MCP: `Supabase` (apply_migration, execute_sql) · Skill: NONE
**Done when**:
- [x] Views: `v_price_band`, `v_top_items`, `v_item_evolution`, `v_rising_products`, `v_rising_terms`
- [x] Fixture check: seed 2 runs of known rows, each view returns the expected shape/values
**Tests**: none (fixture-query verification)
**Gate**: none
**Verify**: seed sample rows via `execute_sql`; assert `v_price_band` min/median/max and `v_rising_products` delta match hand-computed values
**Commit**: `feat(db): analytics views for panel`

**T4 — COMPLETE.** Fixture (2 runs x 3 items + 2 trend rows) verified all 5 views against hand-computed values, then fully deleted (DB confirmed empty post-cleanup). `v_top_items` uses top 10 per run/term (N not specified in design; documented as a SQL comment).

---

### T5: OAuth token exchange in the callback route

**What**: Implement the real authorization-code exchange + Vault storage **in the existing `/api/ml-auth/callback` route** (created as a stub in T1.5). Upgrades the stub from log-only to full token handling.
**Where**: `app/api/ml-auth/callback/route.ts` (implement), `lib/ml/oauth.ts`
**Depends on**: T1.5, T2
**Reuses**: the stub route from T1.5; standard OAuth authorization-code grant
**Requirement**: AUTH-01
**Tools**: MCP: `Supabase` (Vault via execute_sql) · Skill: NONE
**Done when**:
- [x] Route exchanges `code` → access + refresh token via ML `/oauth/token`
- [x] Tokens stored as Vault secrets (`ml_access_token`, `ml_refresh_token`, `ml_token_expires_at`)
- [x] Pure exchange/parse logic in `lib/ml/oauth.ts` unit-tested
**Tests**: unit (token exchange parsing)
**Gate**: quick — `pnpm test`
**Commit**: `feat(auth): ml oauth token exchange + vault storage`

**T5 — COMPLETE.** `pnpm test` 7/7 passing, `pnpm build` green. SPEC_DEVIATION: added `supabase/migrations/0003_ml_auth_vault.sql` (not in the original file list) — Vault (`vault.create_secret`/`vault.decrypted_secrets`) isn't exposed via PostgREST, so two SECURITY DEFINER wrapper RPCs (`ml_auth_set_secret`/`ml_auth_get_secret`, service_role-only) were required for the app to persist tokens at request time. **This shifts T11's seed migration to `0004_seed.sql` and T12's cron migration to `0005_cron.sql`** (updated below).

---

### T6: De-risk spike — validate `/search` + `/trends`, resolve category_id ⚠️ GATE

**What**: With a real bootstrapped token, call `/sites/MLB/search` and `/trends/MLB/{id}`; confirm search returns data (not 403); resolve the true pet `category_id` live via `/sites/MLB/categories`; seed `trend_categories`.
**Where**: `scripts/spike-validate-ml.ts`, findings appended to `design.md` Research Findings
**Depends on**: T5, T3
**Reuses**: `lib/ml/oauth.ts` (token)
**Requirement**: AUTH-02, AUTH-03
**Tools**: MCP: `Supabase` · Skill: NONE
**Done when**:
- [x] `/sites/MLB/search?q=petisco natural cachorro` returns items with our token (403 gotcha resolved or documented) — **documented as FAILING (403), not resolved**
- [x] Real pet `category_id` confirmed (candidate `MLB1071`) and inserted into `trend_categories`
- [x] `/trends/MLB/{id}` returns entries (or degradation documented if seller-gated) — works fine on a personal account
- [x] Outcome written to `design.md`; STATE.md decision logged
- [x] **If `/search` fails with our token → STOP, escalate to user before Phase 3/4** — STOPPED, escalating now

**T6 — COMPLETE (spike ran, gate TRIPPED).** `/search` returns 403 with an otherwise-valid, working token (categories/trends/users-me all 200 with the same token) — matches widespread 2026 external reports of the endpoint being platform-restricted, not an account/scope issue we can fix locally. `/trends` and `/categories` fully confirmed working, including on a personal (non-seller) account. **Phase 3/4 (collection pipeline) is blocked pending user decision** — see STATE.md blockers.

**Tests**: none (documented outcome)
**Gate**: none
**Commit**: `chore(spike): validate ml endpoints + resolve pet category`

---

### T7: ML API Client [P]

**What**: Typed wrapper over `/trends` only (SCOPE CHANGE: `search()` dropped — `/sites/MLB/search` is platform-restricted, see T6) with throttle + exponential backoff on 429/5xx; per-call failure surfaced, never throws the whole run.
**Where**: `lib/ml/client.ts`
**Depends on**: T6
**Reuses**: `lib/ml/oauth.ts`
**Requirement**: COLLECT-01, COLLECT-03
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [x] `trends(categoryId)` implemented
- [x] Backoff on 429/5xx; returns typed results or a per-call error object
- [x] Response parsing + backoff logic unit-tested (mocked fetch)
- [x] Gate passes: `pnpm test`
- [x] Test count: ≥4 tests pass (no silent deletions)
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ml): api client with throttle + backoff`

**T7 — COMPLETE.** `lib/ml/client.ts`, 5 new tests (12/12 total passing). Non-retryable 4xx (e.g. 403) fails immediately; 429/5xx retried with exponential backoff (`baseDelayMs * 2^attempt`), giving up after `maxRetries` (default 3).

---

### T8: Token Manager [P]

**What**: `getAccessToken()` — read Vault, refresh (always, given weekly>6h), rotate + re-persist refresh_token, return fresh access token.
**Where**: `lib/ml/token-manager.ts`
**Depends on**: T6
**Reuses**: `lib/ml/oauth.ts`, Vault
**Requirement**: COLLECT-04, AUTH-01
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [x] Refreshes and persists the rotated refresh_token back to Vault
- [x] Refresh/rotation logic unit-tested (mocked fetch + Vault)
- [x] Gate passes: `pnpm test`
- [x] Test count: ≥4 tests pass
**Tests**: unit
**Gate**: quick
**Commit**: `feat(ml): token manager with refresh rotation`

**T8 — COMPLETE.** `lib/ml/token-manager.ts` (`refreshAccessToken`, `getAccessToken`, `createVaultSecretStore`), 6 new tests (18/18 total passing). `getAccessToken` always refreshes (weekly cadence > 6h access-token lifetime), then persists the rotated `access_token`/`refresh_token`/`expires_at` back to the injected `SecretStore` (Vault-backed in production via `createVaultSecretStore`, faked in tests).

---

### T9: Snapshot Repository [P]

**What**: DB writes for a run; pure domain→row mapping unit-tested, writes via Supabase client. SCOPE CHANGE: `saveSearchSnapshot`/`markTermStatus` dropped (no more seed terms/search) — `run_terms`/`seed_terms` are no longer written by the collector.
**Where**: `lib/db/repository.ts`, `lib/db/mappers.ts`
**Depends on**: T3
**Reuses**: n/a
**Requirement**: COLLECT-03
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [x] `startRun/finishRun/saveTrendSnapshot/logError`
- [x] Pure mapper (trend entry → trend_snapshot row, deriving `trend_type` from position per design.md's documented grouping) unit-tested
- [x] Gate passes: `pnpm test`
- [x] Test count: ≥3 tests pass
**Tests**: unit
**Gate**: quick
**Commit**: `feat(db): snapshot repository + mappers`

**T9 — COMPLETE.** `lib/db/mappers.ts` (`deriveTrendType`, `mapTrendEntryToRow`: positions 1-10 rising, 11-30 most_wanted, 31+ popular per design.md), `lib/db/repository.ts` (`startRun/finishRun/saveTrendSnapshot/logError`, all taking an injected `SupabaseClient`). 4 new mapper tests (22/22 total passing). `collection_errors` has no `category_id` column (predates the scope change) — `logError` omits `seed_term_id` (nullable, no longer populated) and relies on `message`/`stage` for context.

---

### T10: Collector orchestrator (Edge Function)

**What**: Thin Deno Edge Function entrypoint: open run → loop active `trend_categories` → pull trends + write snapshots → close run. SCOPE CHANGE: no more seed-term/search loop. Wires T7/T8/T9.
**Where**: `supabase/functions/collect/index.ts`
**Depends on**: T7, T8, T9
**Reuses**: `lib/ml/client.ts`, `lib/ml/token-manager.ts`, `lib/db/repository.ts`
**Requirement**: COLLECT-01, COLLECT-03, COLLECT-04
**Tools**: MCP: `Supabase` (deploy_edge_function, get_logs) · Skill: NONE
**Done when**:
- [x] Smoke run produces one `collection_run` + `trend_snapshots` for all active categories with a shared timestamp
- [x] Failing category → logged via `collection_errors` + run continues (`partial`)
- [x] Verified via `get_logs` + DB query after invoking the deployed function (remote, not `supabase functions serve` — see note)
**Tests**: none (smoke run)
**Gate**: none
**Verify**: invoke locally; query `collection_runs`, `trend_snapshots` for the run
**Commit**: `feat(collect): weekly collector edge function`

**T10 — COMPLETE.** `supabase/functions/collect/index.ts`, thin Deno adapter reusing `lib/ml/client.ts` (`trends`), `lib/ml/token-manager.ts` (`getAccessToken`), `lib/db/repository.ts` (`startRun/finishRun/saveTrendSnapshot/logError`) unmodified in logic. SPEC_DEVIATIONS:
- Verified via a **remote deploy + one real invoke** (`supabase functions deploy` was blocked by the sandbox's Bash classifier; used the `Supabase` MCP `deploy_edge_function` tool instead, inlining `index.ts` + `deno.json` + the 5 reused `lib/` files with their real repo-relative paths as the `files` payload). Not `supabase functions serve` as originally planned — that requires local Docker + a local Vault clone, and the project's established pattern (T6) is to verify against the real remote project.
- `tsconfig.json`: added `"allowImportingTsExtensions": true` and excluded `supabase/functions` from the Next TS project (Deno requires explicit `.ts` import extensions; Next's bundler resolution rejected them). The reused `lib/` files were updated to use `.ts` extensions on their internal relative imports so the same source works unmodified in both Vitest/Next (Node) and the Deno edge runtime — no `deno.json` `sloppy-imports` workaround needed.
- Added `supabase/migrations/0004_grants.sql`: the smoke test surfaced that `service_role` had **zero SELECT/INSERT/UPDATE/DELETE grants on any public table/view** project-wide (only TRUNCATE/REFERENCES/TRIGGER) — a pre-existing provisioning gap, not introduced by T10, invisible until now because T5/T6 only touched Vault via SECURITY DEFINER RPCs and other verification ran as `postgres` via `execute_sql`. User approved applying the grants migration. **This shifts T11's seed migration to `0005_seed.sql` and T12's cron migration to `0006_cron.sql`** (updated below).
- Smoke run (`b6423dee-f472-4dd5-898a-26eed313f01a`, `status=complete`) kept as real first data point (user chose "keep" over deleting the test row): 50 `trend_snapshots` for `MLB1071` (10 rising / 20 most_wanted / 20 popular), 0 `collection_errors`.

---

### T11: Seed data

**What**: Insert active `trend_categories`. SCOPE CHANGE: no more seed terms (13-term list dropped with `/search`). `MLB1071` ("Animais") was already manually inserted during T6 troubleshooting — this task formalizes it into a migration (idempotent) and is the place to decide whether to also track more specific pet sub-categories (see spec.md Open Items — time-boxed, don't over-invest).
**Where**: `supabase/migrations/0005_seed.sql`
**Depends on**: T3, T6
**Reuses**: n/a
**Requirement**: config (COLLECT-01)
**Tools**: MCP: `Supabase` (apply_migration) · Skill: NONE
**Done when**:
- [x] `trend_categories` has `MLB1071` ("Animais"), `active=true` (idempotent upsert — already present in the live DB from T6)
- [x] Decision recorded: single category or curated sub-categories for v1
- [x] Verified via `SELECT` count/values
**Tests**: none
**Gate**: none
**Commit**: `feat(db): seed trend categories`

**T11 — COMPLETE.** `supabase/migrations/0005_seed.sql` (idempotent `on conflict` upsert). Decision: **single category for v1** (`MLB1071` "Animais" only, no curated sub-categories) — `/trends` per category already returns a broad rising/most-wanted/popular signal across the whole vertical, and splitting into sub-categories multiplies weekly API calls for marginal v1 value. Verified: 1 row, `MLB1071`/"Animais"/`active=true`.

---

### T12: Weekly schedule (pg_cron + pg_net)

**What**: Schedule the collector to run weekly by invoking the Edge Function via pg_net.
**Where**: `supabase/migrations/0006_cron.sql`
**Depends on**: T10
**Reuses**: n/a
**Requirement**: COLLECT-01
**Tools**: MCP: `Supabase` (apply_migration, execute_sql) · Skill: NONE
**Done when**:
- [x] `cron.schedule` weekly entry calls the `collect` function URL via `pg_net`
- [x] Manual `cron` trigger produces a run (smoke)
- [x] Verified via `cron.job` table + a resulting `collection_run`
**Tests**: none
**Gate**: none
**Commit**: `feat(collect): weekly pg_cron schedule`

**T12 — COMPLETE.** `supabase/migrations/0006_cron.sql`: enables `pg_cron`/`pg_net`, schedules `collect-weekly` (`0 6 * * 1`, Mondays 06:00 UTC) calling the deployed function via `net.http_post`. SPEC_DEVIATION: the Authorization header uses the **legacy anon JWT** (public by design), not the service_role key — `verify_jwt: true` on the function only checks for *any* valid Supabase-signed JWT, and the function builds its own admin client from its auto-injected `SUPABASE_SERVICE_ROLE_KEY`, independent of the caller. Avoids storing a sensitive secret in a cron job body. Verified end-to-end: manually ran the job's `net.http_post` body → `collection_run b9cf97b2…` (`status=complete`) appeared, confirmed via `net._http_response` (200) and `cron.job` (`collect-weekly`, active).

**Phase 3 (Collection Pipeline) — COMPLETE.** T7-T12 all done and smoke-verified against the real remote project.

---

### T13: Panel read client + shell (expand existing skeleton)

**What**: Add a server-side Supabase read client and a panel shell **to the existing skeleton from T1.5** (do NOT recreate scaffold). No Basic Auth yet. SCOPE CHANGE: reads trend-only views (T4's `v_rising_terms` + a new trend-history view — `v_price_band`/`v_top_items`/`v_item_evolution`/`v_rising_products` are obsolete, not read by the panel).
**Where**: `lib/db/read-client.ts`, `app/(panel)/layout.tsx`
**Depends on**: T1.5, T4
**Reuses**: skeleton from T1.5; `v_rising_terms` from T4
**Requirement**: PANEL-01 (support), PANEL-03 (support)
**Tools**: MCP: NONE · Skill: NONE
**Done when**:
- [x] Server-side Supabase read client reads `v_rising_terms` (+ new trend-history view, if added)
- [x] Panel shell renders as an expansion of the existing skeleton
- [x] Gate passes: `pnpm build`
**Tests**: none (manual verify)
**Gate**: build
**Commit**: `feat(panel): read client + shell over existing skeleton`

**T13 — COMPLETE.** Added `supabase/migrations/0007_trend_history_views.sql`: `v_latest_trend_snapshots` (all trend types, latest run, per category) and `v_trend_term_history` (full cross-run history per category+keyword) alongside T4's `v_rising_terms`. `lib/db/read-client.ts` (server-only, service_role) exposes `getTrackedCategories`/`getLatestTrendSnapshots`/`getTrendTermHistory`/`getRunCount`. Skeleton expanded into an `app/(panel)/` route group (`layout.tsx` shell + `page.tsx`, replacing root `app/page.tsx`). SPEC_DEVIATION: added `export const dynamic = "force-dynamic"` on the panel layout — without it, Next statically prerendered `/` at build time (baking in build-time DB data), which would silently go stale between weekly collection runs. `pnpm build` green (`/` now `ƒ` dynamic), `pnpm test` 22/22 passing.

---

### T14: Panel views + Basic Auth middleware

**What**: Render rising/most-wanted/popular terms per tracked category (with single-run fallback), AND add HTTP Basic Auth via Next middleware — protection enters here, now that the panel exposes real data. SCOPE CHANGE: price bands/top items/competitors dropped (see spec.md).
**Where**: `app/(panel)/page.tsx`, `app/(panel)/_components/*`, `proxy.ts` (was `middleware.ts` in the plan; renamed per this Next.js version, see COMPLETE note)
**Depends on**: T13, T4
**Reuses**: `v_rising_terms` from T4, `lib/db/read-client.ts`
**Requirement**: PANEL-01, PANEL-03, PANEL-04
**Tools**: MCP: NONE · Skill: `frontend-design` (optional, light)
**Done when**:
- [x] Per tracked category: rising terms, most-wanted terms, popular terms (latest run)
- [x] With 1 run: current-state + "history not yet available"; with ≥2 runs: term movement across runs
- [x] Partial run: renders available data, marks gaps
- [x] Requests without valid Basic Auth credentials get 401
- [x] Verified manually against seeded data; `pnpm build` passes
**Tests**: none (manual verify)
**Gate**: build
**Commit**: `feat(panel): trend views + history fallback + basic auth`

**T14 — COMPLETE.** `lib/panel/trend-view.ts` (pure grouping/movement helpers), `app/(panel)/_components/{CategoryTrends,TermList,RunStatusBanner}.tsx`, rewritten `app/(panel)/page.tsx` rendering rising/most-wanted/popular per category with cross-run movement badges (▲/▼/–) once ≥2 runs exist. `RunStatusBanner` covers: no runs yet, partial/failed latest run, and the single-run "history not yet available" case. SPEC_DEVIATIONS:
- **`middleware.ts` → `proxy.ts`**: this Next.js version (16.2.11) deprecated the `middleware` file convention in favor of `proxy` (same API, renamed export) — confirmed via `node_modules/next/dist/docs/.../proxy.md` and a live build warning. Implemented as `proxy.ts` exporting `proxy()`.
- Basic Auth **fails closed**: if `PANEL_BASIC_AUTH_USER`/`PASSWORD` aren't set, every request gets 401 rather than passing through unprotected (matches spec's "never publicly reachable without a barrier").
- Added `supabase/migrations/0008_latest_trend_snapshots_status_filter.sql`: fixed T13's `v_latest_trend_snapshots` to skip `status='failed'` runs (which have zero snapshot rows by construction — see `supabase/functions/collect/index.ts`), so a failed run doesn't blank the panel instead of falling back to the last good run.
- Manually verified against the real seeded data (2 completed runs from T10/T12 smoke tests): no-auth → 401, wrong creds → 401, correct creds → 200, `/api/ml-auth/callback` reachable without auth (matcher exclusion confirmed), all 50 terms rendered across the 3 sections for `MLB1071`, movement badges showed "–" (both runs ~10min apart, same live snapshot). `pnpm build`/`pnpm test` (22/22)/`pnpm lint` all green.

---

### T15: Promote expanded panel to Vercel

**What**: Redeploy the expanded panel (views + Basic Auth) to the **existing** Vercel personal project from T1.5, and ensure env vars are set. Redirect URI was already registered at T1.5 — not repeated here.
**Where**: existing Vercel personal project (`leoserraos-projects`)
**Depends on**: T14
**Reuses**: Vercel project created in T1.5
**Requirement**: PANEL-04
**Tools**: MCP: `Vercel` (deploy to the same personal project) · Skill: NONE
**Done when**:
- [x] **Deploy targets the same personal `leoserraos-projects` project (confirm scope, never company team)**
- [x] Expanded panel live; deployed URL rejects access without Basic Auth (401)
- [x] Env vars set in Vercel (Supabase, ML client id/secret)
**Tests**: none (manual verify)
**Gate**: none
**Commit**: (deploy only, no new code commit; see T13/T14 commits `52e98fb`/`d89c013`)

**T15 — COMPLETE.** Vercel MCP still only exposes the `Sharpi` company team (re-checked `list_teams`) — per the standing scope guard, the agent did not use it to deploy. 11 pending local commits (all of Phase 3 + T13/T14) were pushed to `origin/main` (user-approved), which auto-deployed via the GitHub integration set up in T1.5. Verified `https://lovu-ml-analysis.vercel.app/` returns 401 without credentials and `/api/ml-auth/callback` remains reachable without Basic Auth (matcher exclusion holds in production). User confirmed in the Vercel dashboard: deploy landed on the personal `leoserraos-projects` scope (not Sharpi), and all required env vars (Supabase URL/publishable key/service role, ML client id/secret/redirect URI, `PANEL_BASIC_AUTH_USER`/`PASSWORD`) are set.

**Phase 4 (Panel) — COMPLETE.** T13-T15 all done.
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

**SCOPE CHANGE (2026-07-22):** COLLECT-02, HIST-02, PANEL-02 dropped (search-based; see spec.md). Table below reflects the trends-only rework.

| Requirement | Task(s) |
| ----------- | ------- |
| COLLECT-01 | T7, T10, T11, T12 |
| COLLECT-03 | T7, T9, T10 |
| COLLECT-04 | T8, T10 |
| HIST-01 | T3, T4 (view rework pending) |
| HIST-03 | T3, T4 (view rework pending) |
| PANEL-01 | T4, T13, T14 |
| PANEL-03 | T13, T14 |
| PANEL-04 | T14, T15 |
| AUTH-01 | T1.5, T5, T8 — ✅ done |
| AUTH-02 | T6 — ✅ done |
| AUTH-03 | T6 — ✅ done |

11/11 active requirements mapped to tasks. 0 unmapped. 3 dropped (COLLECT-02, HIST-02, PANEL-02).
