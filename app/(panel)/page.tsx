import {
  createSupabaseReadClient,
  getLatestRun,
  getLatestTrendSnapshots,
  getRunCount,
  getTrackedCategories,
  getTrendTermHistory,
} from "@/lib/db/read-client";
import { buildMovementMap, groupLatestSnapshotsByCategory } from "@/lib/panel/trend-view";
import { CategoryTabs } from "./_components/CategoryTabs";
import { CategoryTrends } from "./_components/CategoryTrends";
import { RunStatusBanner } from "./_components/RunStatusBanner";

export default async function PanelHome() {
  const client = createSupabaseReadClient();
  const [categories, runCount, latestRun, latestSnapshots] = await Promise.all([
    getTrackedCategories(client),
    getRunCount(client),
    getLatestRun(client),
    getLatestTrendSnapshots(client),
  ]);

  const showMovement = runCount >= 2;
  const history = showMovement ? await getTrendTermHistory(client) : [];
  const movements = buildMovementMap(history);
  const groupsByCategory = groupLatestSnapshotsByCategory(latestSnapshots);

  const tabs = categories.map((category) => ({
    id: category.id,
    label: category.label,
    content: (
      <CategoryTrends
        category={category}
        groups={groupsByCategory.get(category.id)}
        movements={movements}
        showMovement={showMovement}
      />
    ),
  }));

  return (
    <div className="flex flex-col gap-6">
      <RunStatusBanner latestRun={latestRun} runCount={runCount} />
      <CategoryTabs tabs={tabs} />
    </div>
  );
}
