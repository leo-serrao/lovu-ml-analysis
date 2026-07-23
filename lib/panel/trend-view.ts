import { isBlocked } from "./blocklist.ts";
import type { LatestTrendSnapshotRow, TrendTermHistoryRow } from "../db/read-client.ts";

export type TrendType = "rising" | "most_wanted" | "popular";

export const TREND_TYPES: TrendType[] = ["rising", "most_wanted", "popular"];

export interface CategoryTrendGroups {
  categoryId: string;
  byType: Record<TrendType, LatestTrendSnapshotRow[]>;
}

/**
 * Groups the latest run's snapshots by category, then by trend type, ordered by
 * position. Blocklisted keywords (sensitive/out-of-scope, see blocklist.ts) are
 * dropped here -- they stay in the raw trend_snapshots data, just never rendered.
 */
export function groupLatestSnapshotsByCategory(
  snapshots: LatestTrendSnapshotRow[],
): Map<string, CategoryTrendGroups> {
  const groups = new Map<string, CategoryTrendGroups>();

  for (const snapshot of snapshots) {
    if (isBlocked(snapshot.keyword)) continue;

    let group = groups.get(snapshot.category_id);
    if (!group) {
      group = {
        categoryId: snapshot.category_id,
        byType: { rising: [], most_wanted: [], popular: [] },
      };
      groups.set(snapshot.category_id, group);
    }
    group.byType[snapshot.trend_type].push(snapshot);
  }

  for (const group of groups.values()) {
    for (const type of TREND_TYPES) {
      group.byType[type].sort((a, b) => a.position - b.position);
    }
  }

  return groups;
}

export interface PositionMovement {
  previousPosition: number;
  delta: number; // positive = moved up in rank (position number decreased)
}

/**
 * Per category+keyword, the position movement between the two most recent runs
 * that keyword appeared in. Empty when fewer than 2 runs exist for that keyword.
 */
export function buildMovementMap(
  history: TrendTermHistoryRow[],
): Map<string, PositionMovement> {
  const byKeyword = new Map<string, TrendTermHistoryRow[]>();

  for (const row of history) {
    const key = `${row.category_id}::${row.keyword}`;
    const entries = byKeyword.get(key);
    if (entries) {
      entries.push(row);
    } else {
      byKeyword.set(key, [row]);
    }
  }

  const movements = new Map<string, PositionMovement>();
  for (const [key, entries] of byKeyword) {
    if (entries.length < 2) continue;
    // v_trend_term_history is already ordered by started_at ascending.
    const [previous, current] = entries.slice(-2);
    movements.set(key, {
      previousPosition: previous.position,
      delta: previous.position - current.position,
    });
  }

  return movements;
}

export function movementKey(categoryId: string, keyword: string): string {
  return `${categoryId}::${keyword}`;
}
