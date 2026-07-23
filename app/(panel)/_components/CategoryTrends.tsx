import type { TrendCategoryRow } from "@/lib/db/read-client";
import type { CategoryTrendGroups, PositionMovement } from "@/lib/panel/trend-view";
import { TermList } from "./TermList";

const SECTION_LABELS: Record<"rising" | "most_wanted" | "popular", string> = {
  rising: "Rising",
  most_wanted: "Most wanted",
  popular: "Popular",
};

export function CategoryTrends({
  category,
  groups,
  movements,
  showMovement,
}: {
  category: TrendCategoryRow;
  groups: CategoryTrendGroups | undefined;
  movements: Map<string, PositionMovement>;
  showMovement: boolean;
}) {
  return (
    <section className="rounded-lg border border-line bg-card p-5 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-ink">{category.label}</h2>
      {!groups ? (
        <p className="text-sm text-muted">No data for this category in the latest run.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {(["rising", "most_wanted", "popular"] as const).map((type) => (
            <div key={type}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                {SECTION_LABELS[type]}
              </h3>
              <TermList
                terms={groups.byType[type]}
                movements={movements}
                showMovement={showMovement}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
