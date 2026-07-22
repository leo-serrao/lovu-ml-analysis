# Testing Strategy

**Approach:** Pragmatic (chosen 2026-07-21). Unit-test the pure logic that carries real risk; verify jobs, DB, and panel by smoke run + inspection. Internal 2-user tool — no regression suite over UI/infra.

## Tooling

- **Unit:** Vitest (Node/TS). Pure logic modules must be runtime-agnostic (no Deno/Node-only APIs) so they import cleanly into Vitest; the Deno Edge Function is a thin adapter over them.
- **Manual/smoke:** `supabase functions serve` + manual invoke; SQL fixture queries for views; browser check for the panel.

## Test Coverage Matrix

| Code layer | Required test | Rationale |
| ---------- | ------------- | --------- |
| Pure logic: ML response parsing, token refresh/rotation, backoff, price-band/sold_quantity-delta calc | **unit** | Highest correctness risk; deterministic; cheap to test |
| Snapshot Repository row-mapping (domain → DB rows) | **unit** | Pure mapping is testable; actual DB write verified manually |
| Edge Function entrypoint / collector orchestration | **none** (smoke run) | Integration-heavy, hits external API |
| DB migrations / schema | **none** (verify via query) | Structural; checked by querying `information_schema` + a seed row |
| SQL analytics views | **none** (fixture-query) | Verified by seeding known rows and asserting query output |
| OAuth bootstrap route | **none** (manual one-time) | One-time interactive flow |
| Panel UI + Basic Auth middleware | **none** (manual verify) | Internal, no visual polish; check render + auth barrier by hand |

## Gate Check Commands

| Gate | Command | When |
| ---- | ------- | ---- |
| quick | `pnpm test` | After any task touching pure logic (unit) |
| build | `pnpm build` | After panel/scaffold tasks |
| full | `pnpm test && pnpm build` | Before considering the feature done |

## Parallelism Assessment

| Test type | Parallel-Safe | Note |
| --------- | ------------- | ---- |
| unit (Vitest) | **Yes** | Isolated, no shared state |
| none / manual | **No** | Manual smoke steps are serial by nature |
