import type { CollectionRunRow } from "@/lib/db/read-client";

export function RunStatusBanner({
  latestRun,
  runCount,
}: {
  latestRun: CollectionRunRow | null;
  runCount: number;
}) {
  if (!latestRun) {
    return (
      <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
        No collection runs yet. Data will appear after the weekly job runs.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {latestRun.status === "partial" && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
          Last run ({new Date(latestRun.started_at).toLocaleDateString()}) was partial &mdash;
          some categories may be missing data.
        </p>
      )}
      {latestRun.status === "failed" && (
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          Last run ({new Date(latestRun.started_at).toLocaleDateString()}) failed. Showing the
          most recent successful data.
        </p>
      )}
      {runCount < 2 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Only one completed run so far &mdash; history not yet available. Term movement will
          appear after next week&apos;s run.
        </p>
      )}
    </div>
  );
}
