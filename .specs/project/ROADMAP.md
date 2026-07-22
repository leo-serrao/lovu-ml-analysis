# Roadmap

**Current Milestone:** M1 — Proprietary weekly history (V0)
**Status:** Planning

---

## M1 — Proprietary weekly history (V0)

**Goal:** A weekly job reliably collects and stores ML data for the premium-pet seed list, and we can read the accumulated history through a simple internal web panel. Shippable when we have several weeks of clean snapshots and can answer basic niche questions from them.
**Target:** Enough continuous weekly runs to show trend (4-8 weeks of data after go-live).

### Features

**ML API access & OAuth setup** - PLANNED

- Register developer app on developers.mercadolivre.com.br
- OAuth flow + token refresh stored securely
- Confirm which endpoints are usable given no active seller account yet

**Weekly collection job** - PLANNED

- Scheduled job (Supabase Edge Function + cron) running weekly
- Pull `/trends` (pet category) + `/sites/MLB/search` for curated seed terms
- Handle rate limits, retries, partial failures

**Snapshot data model & storage** - PLANNED

- Postgres schema for time-stamped snapshots (search results, price, sold_quantity, competitors, trends)
- Modeled for evolution queries (compare same item/term across runs)

**Internal web panel (simple)** - PLANNED

- Web app reading Supabase
- Views: competitors in niche, price bands, rising products, rising search terms

---

## M2 — Sharper signals

**Goal:** Turn raw history into clearer buy/enter signals.

### Features

**Trend derivations** - PLANNED
**Alerts on movement (price drops, new entrants, rising terms)** - PLANNED
**Seed-term management UI** - PLANNED

---

## Future Considerations

- Expand beyond premium sub-niche to broader pet categories
- Panel polish / mobile (React Native) if daily use justifies it
- Instagram-organic signals cross-referenced with ML trends
- Daily (vs weekly) collection if a use case needs finer granularity
