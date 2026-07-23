import type { LatestTrendSnapshotRow } from "@/lib/db/read-client";
import { matchNichePriority } from "@/lib/panel/niche-terms";
import type { PositionMovement } from "@/lib/panel/trend-view";

function MovementBadge({ movement }: { movement: PositionMovement | undefined }) {
  if (!movement) {
    return (
      <span className="inline-flex w-16 shrink-0 items-center justify-end gap-1 text-[11px] font-medium text-muted">
        novo
      </span>
    );
  }
  if (movement.delta === 0) {
    return (
      <span className="inline-flex w-16 shrink-0 items-center justify-end gap-1 text-[11px] text-muted">
        · estável
      </span>
    );
  }
  if (movement.delta > 0) {
    return (
      <span className="inline-flex w-16 shrink-0 items-center justify-end gap-1 font-mono text-[11px] font-medium tabular-nums text-sage-dark">
        ▲ {movement.delta}
      </span>
    );
  }
  return (
    <span className="inline-flex w-16 shrink-0 items-center justify-end gap-1 font-mono text-[11px] font-medium tabular-nums text-decline">
      ▼ {Math.abs(movement.delta)}
    </span>
  );
}

const NICHE_LABEL = {
  high: "alimentação natural",
  normal: "acessórios",
} as const;

const NICHE_TERM_CLASS = {
  high: "font-semibold text-ink",
  normal: "font-medium text-ink",
} as const;

const NICHE_ROW_ACCENT = {
  high: "border-l-sage-dark bg-sage/20",
  normal: "border-l-gold-dark",
} as const;

function NicheBadge({ priority }: { priority: "high" | "normal" }) {
  if (priority === "high") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-charcoal">
        <span aria-hidden>●</span>
        {NICHE_LABEL.high}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-charcoal">
      <span aria-hidden>○</span>
      {NICHE_LABEL.normal}
    </span>
  );
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
    return <p className="text-sm text-muted">No data this run.</p>;
  }

  return (
    <ol className="flex flex-col gap-1 text-sm">
      {terms.map((term) => {
        const priority = matchNichePriority(term.keyword);
        return (
          <li
            key={`${term.category_id}-${term.trend_type}-${term.keyword}`}
            className={`flex items-center justify-between gap-3 border-b border-l-[3px] border-line/60 py-1.5 pl-2 last:border-b-0 ${
              priority ? NICHE_ROW_ACCENT[priority] : "border-l-transparent"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-muted">{term.position}</span>
              <span
                title={term.keyword}
                className={`truncate ${priority ? NICHE_TERM_CLASS[priority] : "text-muted"}`}
              >
                {term.keyword}
              </span>
              {priority && <NicheBadge priority={priority} />}
            </span>
            {showMovement && (
              <MovementBadge movement={movements.get(`${term.category_id}::${term.keyword}`)} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
