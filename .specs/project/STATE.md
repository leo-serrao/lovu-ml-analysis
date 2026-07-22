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

## Constraints / guards

- **Vercel deploys MUST go to personal account `leoserraos-projects` (https://vercel.com/leoserraos-projects), NEVER a company team.** Confirm exact scope with user and wait for explicit approval before any create/deploy (T1.5, T15).
- **2026-07-22 — Vercel MCP cannot see the personal account.** `list_teams` only returns team `Sharpi` (`team_1MKc5RWokaj4THIb1z7IapNG`, company); `list_projects` for it lists only Sharpi projects. No personal-account scope is visible through this MCP connection. **Decision: user deploys manually** (CLI or dashboard) to `leoserraos-projects` for T1.5 and T15 — agent does not use the Vercel MCP for create/deploy on this project unless the MCP connection is re-authed to expose the personal scope (re-check via `list_teams` before ever using it for deploy again).
- **2026-07-22 — T2 complete.** Dedicated Supabase project `lovu-ml-analysis` (ref `aimmwwireujuhkuolgwv`, region `sa-east-1`) created by user in the dashboard; CLI linked. `supabase_vault` extension already installed by default. `.env.example` documents Supabase/ML/panel env vars (service role key intentionally left blank — MCP does not expose it; user must copy from Supabase Dashboard > Settings > API).
- **2026-07-22 — T1.5 deployed and verified.** User imported the GitHub repo (`leo-serrao/lovu-ml-analysis`) via the Vercel dashboard into personal scope **"leoserraos's projects" (Hobby)** — confirmed correct scope, not Sharpi. Live at **https://lovu-ml-analysis.vercel.app**. Redirect URI for the ML app = `https://lovu-ml-analysis.vercel.app/api/ml-auth/callback` (confirmed working in production: 200 + echoes `code`). Local commits were pushed to `origin/main` first (`d4cc6e2`, `e33d497`) — repo had a remote configured but nothing had been pushed yet.

## Blockers

- **ML developer app not yet registered.** OAuth setup is a prerequisite for ALL data collection (search AND trends). No active seller account yet — must confirm which endpoints work without one.

## Open questions (need validation before/at Design)

- **Pet Shop `category_id`** — confirm live (often cited `MLB1246`, do NOT assume). Explicit Design item.
- **Initial seed-list size** — decide concrete number (~15-20 terms) to dimension rate-limit strategy. Explicit Design item.
- ML API rate limits and `/trends` access requirements (verify against current ML docs during Design — do not assume).
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
