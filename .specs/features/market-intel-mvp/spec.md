# Market Intelligence MVP (V0) Specification

**SCOPE CHANGE (2026-07-22):** `/sites/MLB/search` is confirmed platform-restricted (403 forbidden with an otherwise-valid, working token — verified live in the T6 spike; matches widespread external 2026 reports; not an account/scope issue we can fix). v1 is descoped to **`/trends`-only**: price bands, top items by `sold_quantity`, and per-term competitor lists are dropped. See `design.md` T6 spike results and `PROJECT.md` for the full rationale.

## Problem Statement

We're launching a premium-pet e-commerce (starting with natural treats) on Mercado Livre and need to validate the niche from real market data first. The ML API only returns a current snapshot — no history of search-term demand over time. We need an internal tool that collects ML `/trends` data weekly, accumulates our own time series of rising/most-wanted/popular search terms, and lets us read it through a simple panel, so we can judge demand direction in the premium-pet category before committing to products.

## Goals

- [ ] Accumulate a proprietary **weekly** time series of trending search terms (rising / most-wanted / popular) for tracked premium-pet categories, so evolution is queryable across runs.
- [ ] Surface, in one internal panel: rising search terms and most-wanted/popular terms, per tracked category.
- [ ] Run reliably and unattended (weekly) with no recurring cost beyond Supabase.

## Out of Scope

| Feature                                              | Reason                                                                                 |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Price bands / top items / per-term competitor lists    | **Blocked**: `/sites/MLB/search` returns 403 (platform restriction, confirmed 2026-07-22, not fixable on our side) |
| User authentication / multi-tenant                   | Internal use, 2 users only                                                              |
| Multiple ML countries                                | BR / MLB only                                                                            |
| Visual polish / branded UI                           | Functional over pretty in V0                                                            |
| Alerts, trend derivations, category-management UI     | Deferred to M2                                                                           |
| Daily collection                                     | Weekly is enough for validation (M-future)                                              |
| Reselling / exposing the tool                        | Internal tool, not a product                                                             |

---

## User Stories

### P1: Weekly automated collection ⭐ MVP

**User Story**: As the owner, I want the tool to pull ML `/trends` data for my tracked pet categories once a week automatically, so that a history builds up without me doing anything.

**Why P1**: No collection = no history = no tool. This is the foundation.

**Acceptance Criteria**:

1. WHEN the weekly schedule fires THEN the system SHALL query `/trends/MLB/{categoryId}` for every active tracked category.
2. WHEN the ML API returns results THEN the system SHALL persist one time-stamped snapshot per run, tagged with the run timestamp, category, keyword, and trend type (rising/most-wanted/popular).
3. WHEN a category's request fails (rate limit, error) THEN the system SHALL retry with backoff and, if still failing, record the failure without aborting the whole run.
4. WHEN the OAuth access token is expired THEN the system SHALL refresh it before making calls.

**Independent Test**: Trigger the job manually; verify a new trend-snapshot batch appears in the DB for all active categories with a shared run timestamp.

---

### P1: Queryable trend history ⭐ MVP

**User Story**: As the owner, I want each run stored so I can compare trending terms across weeks, so that I can see which search terms are gaining or losing traction.

**Why P1**: The whole point is history over snapshots; the schema must make cross-run comparison possible.

**Acceptance Criteria**:

1. WHEN snapshots exist for ≥2 runs THEN the system SHALL allow retrieving how a given keyword's trend type/position changed between runs.
2. WHEN querying by category THEN the system SHALL return the associated rising/most-wanted/popular terms for each run.

**Independent Test**: With ≥2 seeded runs, run a query returning the trend-type/position of one keyword across both run dates.

---

### P1: Simple internal panel ⭐ MVP

**User Story**: As the owner, I want a simple web page reading the data, so that I can see rising and popular search terms without writing SQL.

**Why P1**: Reading value is part of the MVP slice, not a later add-on. Kept intentionally minimal.

**Acceptance Criteria**:

1. WHEN I open the panel THEN the system SHALL show, per tracked category: current rising terms, most-wanted terms, and popular terms (from the latest run).
2. WHEN there is only one run of data THEN the system SHALL still render current-state views and clearly indicate history is not yet available.
3. WHEN the panel is deployed (hosted, e.g. Vercel) THEN it SHALL sit behind simple access protection (HTTP Basic Auth) — never publicly reachable without a barrier. "No multi-user auth" ≠ "no protection".

**Independent Test**: Open the panel with seeded data; verify rising/most-wanted/popular terms render per category. Verify the deployed URL rejects access without the configured Basic Auth credential.

---

### P2: ML API access & OAuth bootstrap

**User Story**: As the owner, I want the ML developer app registered and OAuth working, so that the collection job can authenticate.

**Why P2 (but blocking)**: Not user-facing, but a hard prerequisite for P1. Listed separately because it's a one-time setup with external steps.

**Status**: **Done.** OAuth handshake completed (T5); `/trends` and `/categories` confirmed working with a personal (non-seller) account.

**Acceptance Criteria**:

1. WHEN the app is registered and authorized THEN the system SHALL store access + refresh tokens securely. — ✅ done (Supabase Vault)
2. WHEN calling `/trends` or `/categories` THEN the system SHALL send `Authorization: Bearer <token>`. — ✅ confirmed working
3. ~~WHEN an endpoint requires an active seller account we don't have THEN the system SHALL degrade gracefully~~ — **Resolved**: no seller account needed for `/trends`/`/categories`. `/search` fails regardless of seller status (platform restriction, not account-gating) — out of scope now, not a degradation case.

**Independent Test**: Run an authenticated call to `/trends/MLB/MLB1071` and get a valid response using stored tokens. — done, see design.md T6 results.

---

## Edge Cases

- WHEN `/trends` is unavailable or access-restricted for a category THEN the system SHALL log the failure and continue with other categories, marking that category's data as missing for the run.
- WHEN ML rate limits are hit mid-run THEN the system SHALL back off and resume so the run eventually completes.
- WHEN a run partially fails THEN the panel SHALL still show whatever was collected, marking gaps.

---

## Requirement Traceability

| Requirement ID | Story                            | Phase   | Status                                  |
| --------------- | --------------------------------- | ------- | ---------------------------------------- |
| COLLECT-01      | P1: Weekly automated collection   | Tasks   | Pending (T10, T12 — reworked for trends-only) |
| COLLECT-03      | P1: Weekly automated collection   | Tasks   | Pending (T7, T9, T10 — reworked)          |
| COLLECT-04      | P1: Weekly automated collection   | Tasks   | Pending (T8)                              |
| HIST-01         | P1: Queryable trend history       | Tasks   | Pending (T3 schema done; view rework needed) |
| HIST-03         | P1: Queryable trend history       | Tasks   | Pending (view rework needed)              |
| PANEL-01        | P1: Simple internal panel         | Tasks   | Pending (T13, T14 — reworked for trend-only views) |
| PANEL-03        | P1: Simple internal panel         | Tasks   | Pending (T13, T14)                        |
| PANEL-04        | P1: Simple internal panel (access protection) | Tasks | Pending (T14, T15)                |
| AUTH-01         | P2: ML API access & OAuth         | Done    | ✅ T5 complete                            |
| AUTH-02         | P2: ML API access & OAuth (Bearer on trends/categories) | Done | ✅ T6 confirmed |
| AUTH-03         | P2: ML API access & OAuth (seller-account degradation) | Done | ✅ T6 resolved — not needed |

**Dropped requirements (v1 descope):** `COLLECT-02` (per-term `run_terms` status — no more seed terms), `HIST-02` (stable ML item id across runs — no more items), `PANEL-02` (rising products by `sold_quantity` — no more items). Superseded by trend-keyword equivalents already covered above.

**Coverage:** 11 active requirements (3 dropped). AUTH-01..03 done. Others pending Design/Tasks rework.

---

## Open Items to Resolve in Design (explicit — do not leave implicit)

| Item | Why it must be decided in Design |
| ---- | --------------------------------- |
| **Tracked category set** | v1 confirmed `MLB1071` ("Animais") works. Decide whether to track just this top-level category or also curate more specific pet sub-categories for a sharper signal — time-boxed, don't over-invest. |
| **Trend-snapshot schema rework** | `search_snapshots`, `seed_terms`, `run_terms` (T3) and `v_price_band`/`v_top_items`/`v_item_evolution`/`v_rising_products` (T4) were built for the `/search`-based design and are now obsolete. Decide: drop them in a migration, or leave orphaned (lower risk, but dead weight)? |
| **Panel views rework** | T13/T14 originally planned price-band/top-item/competitor views. Redesign around `v_rising_terms` (already valid) + a new trend-history view. |

---

## Success Criteria

- [ ] Weekly job runs unattended and produces one trend-snapshot batch per run for all active tracked categories.
- [ ] After ≥2 runs, evolution of a keyword's trend type/position is queryable and visible in the panel.
- [ ] Panel renders rising/most-wanted/popular terms per tracked category.
- [ ] No manual intervention needed for token refresh across weeks.
- [ ] Total recurring cost stays within Supabase low/free tier.
