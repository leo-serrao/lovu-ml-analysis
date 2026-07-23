import {
  createSupabaseReadClient,
  getRunCount,
  getTrackedCategories,
} from "@/lib/db/read-client";

export default async function PanelHome() {
  const client = createSupabaseReadClient();
  const [categories, runCount] = await Promise.all([
    getTrackedCategories(client),
    getRunCount(client),
  ]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-zinc-600 dark:text-zinc-400">
        Tracking {categories.length} categor{categories.length === 1 ? "y" : "ies"} across{" "}
        {runCount} completed run{runCount === 1 ? "" : "s"}.
      </p>
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        Trend views land in a later task.
      </p>
    </div>
  );
}
