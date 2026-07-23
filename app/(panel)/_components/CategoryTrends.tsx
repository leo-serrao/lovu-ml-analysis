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
    <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="mb-3 font-medium text-black dark:text-zinc-50">{category.label}</h2>
      {!groups ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          No data for this category in the latest run.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {(["rising", "most_wanted", "popular"] as const).map((type) => (
            <div key={type}>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
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
