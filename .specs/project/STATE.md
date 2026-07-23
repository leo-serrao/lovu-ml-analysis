# Project State

Persistent memory: decisions, blockers, lessons, todos, deferred ideas.

## Decisions

- **2026-07-21** — Panel V0 = simple internal web app reading Supabase (Next.js proposed, confirm in Design). Not SQL-only, not React Native for V0.
- **2026-07-21** — Collection cadence = **weekly** (aligns with `/trends` weekly refresh).
- **2026-07-21** — V0 niche = premium pet sub-niche, **broad**: natural food/treats/snacks AND premium toys/accessories. Curated, expandable seed list — not just food terms.
- **2026-07-21** — Standalone app (not added to an existing monorepo). Supabase as backend.
- **2026-07-21** — Scope confirmed: BR/MLB only, no user auth, internal (2 users), no visual polish V0.
- **2026-07-21** — Panel access = **hosted + simple protection** (HTTP Basic Auth or IP allowlist). Not public-open. Exact mechanism decided in Design. (PANEL-04)
- **2026-07-21** — Confirmed via user review: OAuth Bearer is required for **both** `/search` and `/trends` — search is no longer public. OAuth bootstrap blocks ALL collection.
- **2026-07-21** (Design research) — Verified LIVE: `/sites/MLB/categories` returns **403 without token** → auth required even for categories. OAuth is prerequisite for everything.
- **2026-07-21** (Design) — Token strategy: access token 6h, refresh 6 months and **rotates on use**. Weekly cadence > 6h ⇒ **refresh every run + persist rotated refresh_token**.
- **2026-07-21** (Design) — Pet category id: research points to **`MLB1071` (Animais)**, NOT `MLB1246`. Do not hardcode — confirm live post-auth.
- **2026-07-21** (Design) — Data model: store raw snapshots, derive analytics in SQL views; `run_terms.status` distinguishes empty (signal) vs failed. Scheduler = pg_cron + pg_net → Edge Function.
- **2026-07-21** (Design review) — 4 locked: (1) Redirect URI = fixed panel route `/api/ml-auth/callback`; (2) Tokens in **Supabase Vault** (not plain table); (3) Result depth = **top 100 high-priority / top 50 normal** per term; (4) Panel protection = **HTTP Basic Auth via Next middleware** (not IP allowlist).
- **2026-07-21** (Design review) — `/search` 403 gotcha → formalized as **Task 0 validation spike** before building the pipeline; if confirmed, reorders downstream priority.
- **2026-07-21** (Tasks) — Pragmatic testing (Vitest on pure logic only), new dedicated Supabase project, panel hosted on Vercel.
- **2026-07-21** (Tasks review) — Added **T1.5**: minimal panel skeleton + stub `/api/ml-auth/callback` (200 + logs code) + early Vercel deploy, so the HTTPS redirect URI exists before T5. T5 now *implements* exchange in the existing route. Basic Auth moved from T13 → **T14** (protection only once data is exposed). T15 no longer duplicates redirect-URI/scaffold.
- **2026-07-22 (T5)** — Supabase Vault isn't reachable from the app via `@supabase/supabase-js` alone (its functions live in the `vault` schema, not exposed via PostgREST). Added `supabase/migrations/0003_ml_auth_vault.sql`: two `SECURITY DEFINER` RPCs (`ml_auth_set_secret`/`ml_auth_get_secret`), `service_role`-only, called via `supabase.rpc(...)` from `lib/ml/oauth.ts`. This bumped T11's planned migration file to `0004_seed.sql` and T12's to `0005_cron.sql` (tasks.md updated).
- **2026-07-22 (T8/T9)** — Token Manager (`lib/ml/token-manager.ts`) and Snapshot Repository (`lib/db/repository.ts`/`mappers.ts`) complete, 22/22 tests passing. Both take injected dependencies (`SecretStore`, `SupabaseClient`) rather than reading env vars internally, which turned out to matter for T10: it let the Deno edge function reuse the exact same pure logic without needing Node's `process.env` inside Deno.
- **2026-07-22 (T10)** — Collector edge function complete and smoke-verified against the **real remote project** (one live invoke: `collection_run b6423dee…`, `status=complete`, 50 `trend_snapshots` for `MLB1071`, kept as first real data point per user choice). Deployed via the `Supabase` MCP `deploy_edge_function` tool (CLI `supabase functions deploy`/`secrets set` were blocked by the sandbox's Bash classifier for writing to remote/shared infra — user explicitly approved proceeding via AskUserQuestion, then the MCP path worked). `tsconfig.json` now excludes `supabase/functions` and enables `allowImportingTsExtensions`; the reused `lib/` files use explicit `.ts` import extensions so one source works in both Vitest/Next (Node) and Deno without runtime-specific flags.
- **2026-07-22 (T10 → grants fix)** — Smoke test surfaced that `service_role` had **zero SELECT/INSERT/UPDATE/DELETE grants on any public table/view**, project-wide (only TRUNCATE/REFERENCES/TRIGGER) — pre-existing since provisioning, invisible until now because T5/T6 only touched data via SECURITY DEFINER RPCs or as `postgres` via `execute_sql`. Fixed via `supabase/migrations/0004_grants.sql` (user-approved). **This shifts T11's seed migration to `0005_seed.sql` and T12's cron migration to `0006_cron.sql`** (tasks.md updated).
- **2026-07-22 (T11)** — `trend_categories` seed formalized (`0005_seed.sql`, idempotent). Decision: **single category for v1** (`MLB1071` "Animais" only) — no curated pet sub-categories; `/trends` per category already returns a broad enough signal, and splitting multiplies weekly API calls for marginal v1 value.
- **2026-07-22 (T12) — Phase 3 (Collection Pipeline) COMPLETE.** Weekly `pg_cron` + `pg_net` schedule (`0006_cron.sql`, Mondays 06:00 UTC) verified end-to-end (manual trigger → 200 → new `collection_run`). Cron job's Authorization header uses the **legacy anon JWT** (public by design), not service_role — `verify_jwt: true` on the function just needs *any* valid Supabase JWT; the function's own DB access always uses its auto-injected `SUPABASE_SERVICE_ROLE_KEY`, so no sensitive secret needed to live in the cron job body. T7-T12 all done.
- **2026-07-23 (T15) — Phase 4 (Panel) COMPLETE, all v1 phases done (T1-T15).** Vercel MCP re-confirmed it still only sees `Sharpi` (company team) — agent did not use it to deploy, per the standing guard. Pushed 11 pending local commits (Phase 3 collection pipeline + T13/T14 panel) to `origin/main`, user-approved; Vercel's GitHub integration (from T1.5) auto-deployed. Verified externally: `https://lovu-ml-analysis.vercel.app/` → 401 without Basic Auth creds, `/api/ml-auth/callback` still reachable unauthenticated. User confirmed in the Vercel dashboard: deploy on personal `leoserraos-projects` scope (not Sharpi), all env vars set.
- **2026-07-23 (T13/T14) — Phase 4 (Panel) T13-T14 COMPLETE.** `supabase/migrations/0007_trend_history_views.sql` + `0008_...status_filter.sql` add `v_latest_trend_snapshots` (all trend types, latest *good* run, per category) and `v_trend_term_history` (cross-run history), alongside T4's `v_rising_terms`. `lib/db/read-client.ts` is the server-only (service_role) read client; `lib/panel/trend-view.ts` holds pure grouping/movement helpers. Panel expanded into an `app/(panel)/` route group rendering rising/most-wanted/popular per category with movement badges, protected by fail-closed HTTP Basic Auth. **Naming deviation: `middleware.ts` → `proxy.ts`** — this Next.js version (16.2.11) deprecated the `middleware` file convention in favor of `proxy` (confirmed via `node_modules/next/dist/docs/.../proxy.md` + a live build warning); same API, renamed export (`export function proxy(...)`), matcher config unchanged. `export const dynamic = "force-dynamic"` added on the panel layout — without it Next statically prerendered `/` at build time, baking in stale DB data between weekly runs. Verified manually against the 2 real seeded runs from T10/T12: 401 (no/wrong auth), 200 (correct auth), OAuth callback route stays reachable without auth, all 50 terms render across 3 sections, movement badges correctly show no change (runs ~10min apart, same live snapshot). `pnpm build`/`pnpm test` (22/22)/`pnpm lint` all green.
- **2026-07-22 (T6 gate → v1 SCOPE CHANGE)** — `/sites/MLB/search` confirmed 403-forbidden with an otherwise-valid, working token (`/categories`, `/trends`, `/users/me` all 200 with the same token). Matches widespread external 2026 reports of the endpoint being platform-restricted, not an account/scope issue. User spent ~10 min checking substitutes (`/products/search` = Catalog API, no price/seller data; `/highlights/category` = ranked item IDs, but `/items/{id}` 404'd on the tested IDs) — neither cleanly restores price-band/competitor data. **Decision: v1 descoped to `/trends`-only.** Dropped: price bands, top items by `sold_quantity`, per-term competitor lists, the 13-term curated search seed list, `COLLECT-02`/`HIST-02`/`PANEL-02` requirements. Kept: weekly `/trends` collection per tracked category (`MLB1071` "Animais" confirmed), rising/most-wanted/popular term history, panel. Rewrote `PROJECT.md`, `spec.md`, `tasks.md` (T7/T9/T10/T11/T13/T14) accordingly. **`search_snapshots`/`seed_terms`/`run_terms` tables and `v_price_band`/`v_top_items`/`v_item_evolution`/`v_rising_products` views (T3/T4) are now obsolete but were left in place, not dropped** — open decision, see spec.md "Open Items to Resolve in Design".

## Constraints / guards

- **Vercel deploys MUST go to personal account `leoserraos-projects` (https://vercel.com/leoserraos-projects), NEVER a company team.** Confirm exact scope with user and wait for explicit approval before any create/deploy (T1.5, T15).
- **2026-07-22 — Vercel MCP cannot see the personal account.** `list_teams` only returns team `Sharpi` (`team_1MKc5RWokaj4THIb1z7IapNG`, company); `list_projects` for it lists only Sharpi projects. No personal-account scope is visible through this MCP connection. **Decision: user deploys manually** (CLI or dashboard) to `leoserraos-projects` for T1.5 and T15 — agent does not use the Vercel MCP for create/deploy on this project unless the MCP connection is re-authed to expose the personal scope (re-check via `list_teams` before ever using it for deploy again).
- **2026-07-22 — T2 complete.** Dedicated Supabase project `lovu-ml-analysis` (ref `aimmwwireujuhkuolgwv`, region `sa-east-1`) created by user in the dashboard; CLI linked. `supabase_vault` extension already installed by default. `.env.example` documents Supabase/ML/panel env vars (service role key intentionally left blank — MCP does not expose it; user must copy from Supabase Dashboard > Settings > API).
- **2026-07-22 — T1.5 deployed and verified.** User imported the GitHub repo (`leo-serrao/lovu-ml-analysis`) via the Vercel dashboard into personal scope **"leoserraos's projects" (Hobby)** — confirmed correct scope, not Sharpi. Live at **https://lovu-ml-analysis.vercel.app**. Redirect URI for the ML app = `https://lovu-ml-analysis.vercel.app/api/ml-auth/callback` (confirmed working in production: 200 + echoes `code`). Local commits were pushed to `origin/main` first (`d4cc6e2`, `e33d497`) — repo had a remote configured but nothing had been pushed yet.

## Blockers

- **2026-07-22 — T6 GATE TRIPPED: `/sites/MLB/search` returns 403 forbidden with a valid, working token.** Same token succeeds on `/sites/MLB/categories`, `/trends/MLB/MLB1071`, and `/users/me` (all 200) — ruling out a general auth/account problem. Matches widespread external reports (2026) of this specific endpoint being platform-restricted regardless of valid credentials (see design.md T6 spike results for sources). **Blocks Phase 3/4** (the collection pipeline depends on `/search` for `search_snapshots`, the core "price band / top items" data). `/trends`-only work (rising terms) is unaffected. Needs a user decision: pursue ML support/whitelisting, find an alternative data source, or descope search-based collection for V0.

## Open questions (need validation before/at Design)

- ~~Pet Shop `category_id`~~ — **RESOLVED 2026-07-22**: confirmed live as `MLB1071` ("Animais") via T6 spike.
- ~~`/trends` seller-account requirement~~ — **RESOLVED 2026-07-22**: works fine on a personal (non-seller) account.
- **Initial seed-list size** — decide concrete number (~15-20 terms) to dimension rate-limit strategy. Explicit Design item.
- ML API rate limits (verify against current ML docs — do not assume). Untested; blocked behind the `/search` 403 issue anyway.
- Physical snapshot data model (schema) — to be proposed with options in Design.
- Exact cron mechanism (Supabase pg_cron + Edge Function vs external scheduler) — Design.
- Panel framework (Next.js assumed) — confirm in Design.

## Lessons

- (none yet)

## Deferred ideas

- Alerts on movement, trend derivations, seed-term management UI → M2.
- Daily collection, broader pet categories, React Native panel, Instagram cross-signal → Future.

## Preferences

- Planning/communication in PT; code + comments in EN.
- Separate planning from implementation; review spec + design before tasks.
