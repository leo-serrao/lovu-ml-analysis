import type { LatestTrendSnapshotRow } from "@/lib/db/read-client";
import type { PositionMovement } from "@/lib/panel/trend-view";

function MovementBadge({ movement }: { movement: PositionMovement | undefined }) {
  if (!movement) return null;

  if (movement.delta > 0) {
    return <span className="text-emerald-600 dark:text-emerald-400">▲ {movement.delta}</span>;
  }
  if (movement.delta < 0) {
    return <span className="text-red-600 dark:text-red-400">▼ {Math.abs(movement.delta)}</span>;
  }
  return <span className="text-zinc-400">–</span>;
}

export function TermList({
  terms,
  movements,
  showMovement,
}: {
  terms: LatestTrendSnapshotRow[];
  movements: Map<string, PositionMovement>;
  showMovement: boolean;
}) {
  if (terms.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-500">No data this run.</p>;
  }

  return (
    <ol className="flex flex-col gap-1 text-sm">
      {terms.map((term) => (
        <li
          key={`${term.category_id}-${term.trend_type}-${term.keyword}`}
          className="flex items-center justify-between gap-3 border-b border-zinc-100 py-1 last:border-0 dark:border-zinc-900"
        >
          <span className="text-zinc-800 dark:text-zinc-200">
            {term.position}. {term.keyword}
          </span>
          {showMovement && (
            <MovementBadge movement={movements.get(`${term.category_id}::${term.keyword}`)} />
          )}
        </li>
      ))}
    </ol>
  );
}
