import type { TrendEntry } from "../ml/client.ts";

export type TrendType = "rising" | "most_wanted" | "popular";

export interface TrendSnapshotRow {
  run_id: string;
  category_id: string;
  keyword: string;
  trend_type: TrendType;
  position: number;
  captured_at: string;
}

export interface TrendSnapshotContext {
  runId: string;
  categoryId: string;
  capturedAt: Date;
}

const RISING_MAX_POSITION = 10;
const MOST_WANTED_MAX_POSITION = 30;

/**
 * Derives trend_type from the 1-based /trends position per the documented grouping
 * (design.md): first 10 = rising, next 20 = most_wanted, last 20 = popular.
 */
export function deriveTrendType(position: number): TrendType {
  if (position <= RISING_MAX_POSITION) return "rising";
  if (position <= MOST_WANTED_MAX_POSITION) return "most_wanted";
  return "popular";
}

/** Maps a single /trends entry to a trend_snapshots row. */
export function mapTrendEntryToRow(
  entry: TrendEntry,
  context: TrendSnapshotContext,
): TrendSnapshotRow {
  return {
    run_id: context.runId,
    category_id: context.categoryId,
    keyword: entry.keyword,
    trend_type: deriveTrendType(entry.position),
    position: entry.position,
    captured_at: context.capturedAt.toISOString(),
  };
}
