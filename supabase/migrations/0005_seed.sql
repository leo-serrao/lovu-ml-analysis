-- Market Intelligence MVP: seed trend_categories
-- Design ref: .specs/features/market-intel-mvp/tasks.md T11.
-- Decision: v1 tracks a single category (MLB1071 "Animais") rather than curated
-- pet sub-categories. /trends per category already returns the broad rising/
-- most-wanted/popular signal across the whole vertical; splitting into sub-
-- categories would multiply weekly API calls for marginal v1 value. Revisit in M2
-- if sub-category-level trend granularity becomes a real need (see STATE.md).

insert into trend_categories (id, label, active)
values ('MLB1071', 'Animais', true)
on conflict (id) do update set label = excluded.label, active = excluded.active;
