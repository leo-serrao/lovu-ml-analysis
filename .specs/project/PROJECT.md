# Lovu — Market Intelligence (Mercado Livre / Pet Premium)

**Vision:** Internal tool that collects Mercado Livre data on a weekly schedule and builds our own historical series to validate demand, map competition, and track trends in the premium pet niche — without paying for generic market-research tools.
**For:** Us (owner + spouse), internal use only. Max 2 users. No external/third-party exposure.
**Solves:** Mercado Livre's API returns only a current snapshot (no sales/price history over time). We need our own accumulated history to see how demand, price, and competition evolve before launching products.

## Goals

- Accumulate a proprietary weekly time series (price, `sold_quantity`, competitors, trending terms) for a curated set of premium-pet search terms/categories — enough continuous history to spot movement over ~4-8 weeks.
- Answer "is this sub-niche worth entering?" from our own data: price bands, rising products, rising search terms, who the competitors are.
- Zero recurring cost beyond Supabase free/low tier; no dependency on paid third-party tools.

## Tech Stack

**Core:**

- Backend/jobs: Supabase (Postgres + Edge Functions, scheduled via cron)
- Database: Postgres (Supabase)
- Web panel: simple internal web app reading Supabase (Next.js — to be confirmed in Design)
- Language: TypeScript

**Key dependencies:** Mercado Livre API (OAuth + `/trends` + `/sites/MLB/search`), Supabase JS client, a charting lib for the panel.

## Scope

**v1 includes:**

- Weekly scheduled collection job pulling ML data for a curated premium-pet term/category seed list (natural treats/snacks **and** premium toys/accessories).
- Snapshot storage modeled so evolution over time is queryable (price, sold_quantity, competitors, trends per run).
- Simple internal web panel: competitors in niche, price bands, rising products, rising search terms.

**Explicitly out of scope:**

- Reselling/exposing the tool to third parties (internal use only).
- Multiple Mercado Livre countries (Brazil / MLB only).
- User authentication / multi-tenant (only the two of us).
- Visual polish on the panel (functional over pretty in v1).

## Constraints

- Technical: ML API gives no historical series — history must be built by us via recurring snapshots. No ML developer app registered yet (OAuth setup is a prerequisite). ML API rate limits, `/trends` access requirements, and whether an active seller account is needed for some endpoints must be verified during Design.
- Resources: solo/two-person build, minimal budget. Prefer consistency with existing stack (React Native / Supabase / Turborepo) where it makes sense; this can be a standalone app.
- Communication/planning in Portuguese; code and comments in English.
