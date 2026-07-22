# Lovu — Market Intelligence (Mercado Livre / Pet Premium)

**Vision:** Internal tool that collects Mercado Livre data on a weekly schedule and builds our own historical series of trending search terms to validate demand in the premium pet niche — without paying for generic market-research tools.
**For:** Us (owner + spouse), internal use only. Max 2 users. No external/third-party exposure.
**Solves:** Mercado Livre's API returns only a current snapshot (no history over time). We need our own accumulated history of trending/rising search terms to see how demand signal evolves before launching products.

**SCOPE CHANGE (2026-07-22, T6 gate):** `/sites/MLB/search` — the endpoint the original v1 depended on for price bands, top items, and competitors — returns a confirmed **403 forbidden with an otherwise-valid, working token** (same token succeeds on `/categories`, `/trends`, `/users/me`). This matches widespread external reports (2026) of the endpoint being platform-restricted, not an account/scope issue fixable on our side. `/products/search` (Catalog API) and `/highlights/category` were checked as substitutes and don't cleanly restore price/competitor-per-term data. **v1 is descoped to `/trends`-only**: rising/most-wanted/popular search terms per tracked category, with history across weekly runs. Price bands, top items by `sold_quantity`, and per-term competitor lists are dropped from v1 (see spec.md for the full rewrite). Full findings: `.specs/features/market-intel-mvp/design.md` (T6 spike results).

## Goals

- Accumulate a proprietary weekly time series of trending search terms (rising / most-wanted / popular, from `/trends`) for tracked premium-pet categories — enough continuous history to spot movement over ~4-8 weeks.
- Answer "is this sub-niche worth entering?" from our own data: which search terms are rising, and how that shifts week over week.
- Zero recurring cost beyond Supabase free/low tier; no dependency on paid third-party tools.

## Tech Stack

**Core:**

- Backend/jobs: Supabase (Postgres + Edge Functions, scheduled via cron)
- Database: Postgres (Supabase)
- Web panel: simple internal web app reading Supabase (Next.js — confirmed in Design)
- Language: TypeScript

**Key dependencies:** Mercado Livre API (OAuth + `/trends`), Supabase JS client, a charting lib for the panel. (`/sites/MLB/search` dropped — see Scope Change above.)

## Scope

**v1 includes:**

- Weekly scheduled collection job pulling `/trends` for a curated set of premium-pet categories (starting with `MLB1071` "Animais", confirmed live).
- Snapshot storage modeled so trend-term evolution over time is queryable (rank/type per keyword per run).
- Simple internal web panel: rising search terms, most-wanted/popular terms, per tracked category.

**Explicitly out of scope:**

- Reselling/exposing the tool to third parties (internal use only).
- Multiple Mercado Livre countries (Brazil / MLB only).
- User authentication / multi-tenant (only the two of us).
- Visual polish on the panel (functional over pretty in v1).
- **Price bands, top items by `sold_quantity`, per-term competitor lists** — blocked by the confirmed `/sites/MLB/search` 403 (see Scope Change above); would require `/search` or an equivalent item-listing endpoint we don't have access to.

## Constraints

- Technical: ML API gives no historical series — history must be built by us via recurring snapshots. `/sites/MLB/search` is platform-restricted (403, confirmed 2026-07-22) regardless of valid auth — v1 relies on `/trends` only. No active seller account needed — `/trends`, `/categories`, and OAuth all confirmed working on a personal account.
- Resources: solo/two-person build, minimal budget. Prefer consistency with existing stack (React Native / Supabase / Turborepo) where it makes sense; this can be a standalone app.
- Communication/planning in Portuguese; code and comments in English.
