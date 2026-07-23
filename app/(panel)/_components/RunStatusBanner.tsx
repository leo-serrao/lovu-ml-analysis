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
      <p className="rounded-md border border-gold-dark/50 bg-gold/25 p-3 text-sm text-ink">
        No collection runs yet. Data will appear after the weekly job runs.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {latestRun.status === "partial" && (
        <p className="rounded-md border border-gold-dark/50 bg-gold/25 p-3 text-sm text-ink">
          Last run ({new Date(latestRun.started_at).toLocaleDateString()}) was partial, some
          categories may be missing data.
        </p>
      )}
      {latestRun.status === "failed" && (
        <p className="rounded-md border border-decline/40 bg-decline/10 p-3 text-sm text-ink">
          Last run ({new Date(latestRun.started_at).toLocaleDateString()}) failed. Showing the
          most recent successful data.
        </p>
      )}
      {runCount < 2 && (
        <p className="text-sm text-muted">
          Only one completed run so far, history not yet available. Term movement will appear
          after next week&apos;s run.
        </p>
      )}
    </div>
  );
}
