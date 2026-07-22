# Market Intelligence MVP (V0) Specification

## Problem Statement

We're launching a premium-pet e-commerce (starting with natural treats) on Mercado Livre and need to validate the niche from real market data first. The ML API only returns a current snapshot — no history of price or sales over time. We need an internal tool that collects ML data weekly, accumulates our own time series, and lets us read it through a simple panel, so we can judge demand, price bands, and competition before committing to products.

## Goals

- [ ] Accumulate a proprietary **weekly** time series for a curated premium-pet seed list, so evolution is queryable across runs.
- [ ] Surface, in one internal panel: niche competitors, price bands, rising products, rising search terms.
- [ ] Run reliably and unattended (weekly) with no recurring cost beyond Supabase.

## Out of Scope

| Feature                              | Reason                                      |
| ------------------------------------ | ------------------------------------------- |
| User authentication / multi-tenant   | Internal use, 2 users only                  |
| Multiple ML countries                | BR / MLB only                               |
| Visual polish / branded UI           | Functional over pretty in V0                |
| Alerts, trend derivations, seed UI   | Deferred to M2                              |
| Daily collection                     | Weekly is enough for validation (M-future)  |
| Reselling / exposing the tool        | Internal tool, not a product                |

---

## User Stories

### P1: Weekly automated collection ⭐ MVP

**User Story**: As the owner, I want the tool to pull ML data for my seed terms once a week automatically, so that a history builds up without me doing anything.

**Why P1**: No collection = no history = no tool. This is the foundation.

**Acceptance Criteria**:

1. WHEN the weekly schedule fires THEN the system SHALL query `/sites/MLB/search` for every active seed term/category and `/trends` for the configured pet category.
2. WHEN the ML API returns results THEN the system SHALL persist one time-stamped snapshot per run, tagged with the run timestamp and the source term/category.
3. WHEN a single term's request fails (rate limit, error) THEN the system SHALL retry with backoff and, if still failing, record the failure without aborting the whole run.
4. WHEN the OAuth access token is expired THEN the system SHALL refresh it before making calls.

**Independent Test**: Trigger the job manually; verify a new snapshot batch appears in the DB for all active seed terms with a shared run timestamp.

---

### P1: Queryable snapshot history ⭐ MVP

**User Story**: As the owner, I want each run stored so I can compare the same item/term across weeks, so that I can see evolution (price up/down, sold_quantity growth, new competitors).

**Why P1**: The whole point is history over snapshots; the schema must make cross-run comparison possible.

**Acceptance Criteria**:

1. WHEN snapshots exist for ≥2 runs THEN the system SHALL allow retrieving the value of a given metric (price, sold_quantity) for a given item/term over time.
2. WHEN the same ML item appears in multiple runs THEN the system SHALL make it identifiable as the same item across runs (stable item id).
3. WHEN querying by term/category THEN the system SHALL return the associated competitors and price distribution for each run.

**Independent Test**: With ≥2 seeded runs, run a query returning price/sold_quantity of one item across both run dates.

---

### P1: Simple internal panel ⭐ MVP

**User Story**: As the owner, I want a simple web page reading the data, so that I can see competitors, price bands, rising products, and rising terms without writing SQL.

**Why P1**: Reading value is part of the MVP slice, not a later add-on. Kept intentionally minimal.

**Acceptance Criteria**:

1. WHEN I open the panel THEN the system SHALL show, per seed term/category: current competitors, price band (min/median/max), and top items by sold_quantity.
2. WHEN ≥2 runs of history exist THEN the system SHALL show rising products (largest sold_quantity increase) and rising search terms (from `/trends` movement).
3. WHEN there is only one run of data THEN the system SHALL still render current-state views and clearly indicate history is not yet available.
4. WHEN the panel is deployed (hosted, e.g. Vercel) THEN it SHALL sit behind simple access protection (HTTP Basic Auth or IP allowlist) — never publicly reachable without a barrier. "No multi-user auth" ≠ "no protection".

**Independent Test**: Open the panel with seeded data; verify price band and top items render per term, and rising views appear once ≥2 runs exist. Verify the deployed URL rejects access without the configured credential/IP.

---

### P2: ML API access & OAuth bootstrap

**User Story**: As the owner, I want the ML developer app registered and OAuth working, so that the collection job can authenticate.

**Why P2 (but blocking)**: Not user-facing, but a hard prerequisite for P1. Listed separately because it's a one-time setup with external steps (register app, verify endpoint access without seller account).

**Acceptance Criteria**:

1. WHEN the app is registered and authorized THEN the system SHALL store access + refresh tokens securely.
2. WHEN calling **either** `/sites/MLB/search` **or** `/trends` THEN the system SHALL send `Authorization: Bearer <token>` — both endpoints require auth (search is no longer public without login). OAuth is a prerequisite for ALL data collection, not just trends.
3. WHEN an endpoint requires an active seller account we don't have THEN the system SHALL degrade gracefully and log which data is unavailable.

**Independent Test**: Run an authenticated call to `/sites/MLB/search` and get a valid response using stored tokens.

---

## Edge Cases

- WHEN a seed term returns zero results THEN system SHALL record an empty snapshot for that term (absence is signal), not skip it.
- WHEN `/trends` is unavailable or access-restricted THEN system SHALL continue with `/search` data and flag trends as missing for that run.
- WHEN ML rate limits are hit mid-run THEN system SHALL back off and resume so the run eventually completes.
- WHEN an item's `sold_quantity` decreases between runs (ML data reset/anomaly) THEN system SHALL store the raw value without "correcting" it (analysis handles anomalies).
- WHEN a run partially fails THEN the panel SHALL still show whatever was collected, marking gaps.

---

## Requirement Traceability

| Requirement ID | Story                          | Phase  | Status  |
| -------------- | ------------------------------ | ------ | ------- |
| COLLECT-01     | P1: Weekly automated collection | Design | Pending |
| COLLECT-02     | P1: Weekly automated collection | Design | Pending |
| COLLECT-03     | P1: Weekly automated collection | Design | Pending |
| COLLECT-04     | P1: Weekly automated collection | Design | Pending |
| HIST-01        | P1: Queryable snapshot history  | Design | Pending |
| HIST-02        | P1: Queryable snapshot history  | Design | Pending |
| HIST-03        | P1: Queryable snapshot history  | Design | Pending |
| PANEL-01       | P1: Simple internal panel       | Design | Pending |
| PANEL-02       | P1: Simple internal panel       | Design | Pending |
| PANEL-03       | P1: Simple internal panel       | Design | Pending |
| PANEL-04       | P1: Simple internal panel (access protection) | Design | Pending |
| AUTH-01        | P2: ML API access & OAuth       | Design | Pending |
| AUTH-02        | P2: ML API access & OAuth (Bearer on search + trends) | Design | Pending |
| AUTH-03        | P2: ML API access & OAuth (seller-account degradation) | Design | Pending |

**Coverage:** 14 total, 0 mapped to tasks (Tasks phase not started), 0 unmapped.

---

## Open Items to Resolve in Design (explicit — do not leave implicit)

| Item | Why it must be decided in Design |
| ---- | -------------------------------- |
| **Pet Shop `category_id`** | `/trends` category filter needs the real MLB category id. Commonly cited as `MLB1246`, but **must be confirmed against the live ML API, not assumed.** |
| **Initial seed-list size** | Rate-limit strategy depends on volume. Decide a concrete initial size (~15-20 terms) so the job can be dimensioned (single window vs. controlled parallelism / multiple windows). |
| **Panel access protection mechanism** | Decision made: hosted + simple protection. Design picks the exact mechanism (HTTP Basic Auth vs. IP allowlist) and where it lives. |
| **Endpoint access without active seller account** | Verify `/search` and `/trends` behavior given no seller account yet; drives graceful-degradation design. |

---

## Success Criteria

- [ ] Weekly job runs unattended and produces one snapshot batch per run for all active seed terms.
- [ ] After ≥2 runs, evolution of price/sold_quantity for a given item is queryable and visible in the panel.
- [ ] Panel renders price bands, top items, and rising products/terms per seed term.
- [ ] No manual intervention needed for token refresh across weeks.
- [ ] Total recurring cost stays within Supabase low/free tier.
