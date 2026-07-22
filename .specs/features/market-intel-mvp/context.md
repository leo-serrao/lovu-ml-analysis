# Market Intelligence MVP Context

**Gathered:** 2026-07-21
**Spec:** `.specs/features/market-intel-mvp/spec.md`
**Status:** Ready for design

---

## Feature Boundary

Weekly, unattended collection of ML data for a curated premium-pet seed list, stored as queryable time-stamped snapshots, readable through a simple internal web panel. BR/MLB only, internal use, no auth.

---

## Implementation Decisions

### Panel form factor & access

- Simple internal **web app** reading Supabase (not SQL-only, not React Native for V0).
- Next.js proposed as the framework (consistency with TypeScript/Supabase) — confirm in Design.
- No visual polish; functional tables + basic charts.
- **Hosted** (e.g. Vercel) **behind simple protection** (HTTP Basic Auth or IP allowlist). Decided 2026-07-21. "No multi-user auth" does NOT mean publicly open — a hosted URL must never be reachable without a barrier. Exact mechanism chosen in Design.

### Collection cadence

- **Weekly.** Aligns with `/trends` weekly refresh; keeps API call volume and history noise low.

### Niche scope (seed list)

- Premium pet sub-niche, interpreted **broadly**: natural food/treats/snacks (petiscos naturais, snacks, biscoitos, bifinhos, ossos naturais) **plus premium toys and accessories** that qualify as premium.
- Curated, expandable seed list — not limited to food terms.
- **Initial seed list (13 terms, confirmed 2026-07-21):**
  - _Food / natural treats — HIGH priority (entry product):_ `petisco natural cachorro`, `petisco natural gato`, `petisco sem conservantes cachorro`, `bifinho natural pet`, `osso natural cachorro`, `snack desidratado pet`, `biscoito natural cachorro`
  - _Toys / premium accessories — NORMAL priority (expansion sub-niche):_ `brinquedo interativo cachorro`, `brinquedo enriquecimento pet`, `mordedor natural cachorro`, `comedouro lento pet`, `cama premium pet`, `coleira premium cachorro`
- Each seed term carries a `priority` (high | normal) so collection/analysis can weight the entry product.

### ML API access

- **Nothing registered yet.** Developer-app registration + OAuth is a prerequisite (AUTH-01/02/03).
- **OAuth is required for BOTH `/sites/MLB/search` and `/trends`** — search is no longer public without login. Bootstrap blocks ALL collection, not just trends.
- No active seller account — must verify which endpoints work without one during Design.
- **Pet Shop `category_id` unknown** — commonly cited as `MLB1246`, but must be confirmed live, not assumed. Explicit Design investigation item.

### Agent's Discretion

- Snapshot physical schema design (options to be proposed in Design).
- Retry/backoff strategy details.
- Panel charting library choice.

---

## Specific References

- Standalone app, Supabase backend (Postgres + Edge Functions + cron).
- Existing stack for consistency where sensible: React Native / Supabase / Turborepo (Adega Piloto, Pact).

---

## Deferred Ideas

- Alerts on movement, trend derivations, seed-term management UI → M2.
- Daily collection, broader pet categories, React Native panel, Instagram cross-signal → Future.
