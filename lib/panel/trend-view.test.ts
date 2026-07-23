import { describe, expect, it } from "vitest";
import { groupLatestSnapshotsByCategory } from "./trend-view";
import type { LatestTrendSnapshotRow } from "../db/read-client";

function snapshot(overrides: Partial<LatestTrendSnapshotRow>): LatestTrendSnapshotRow {
  return {
    run_id: "run-1",
    category_id: "MLB1071",
    keyword: "coleira",
    trend_type: "rising",
    position: 1,
    captured_at: "2026-07-22T00:00:00.000Z",
    ...overrides,
  };
}

describe("groupLatestSnapshotsByCategory", () => {
  it("drops blocklisted keywords from the grouped output", () => {
    const groups = groupLatestSnapshotsByCategory([
      snapshot({ keyword: "coleira cachorros", position: 1 }),
      snapshot({ keyword: "veneno para matar gatos", trend_type: "most_wanted", position: 2 }),
      snapshot({ keyword: "macaco prego", trend_type: "most_wanted", position: 3 }),
    ]);

    const group = groups.get("MLB1071");
    expect(group?.byType.rising).toHaveLength(1);
    expect(group?.byType.most_wanted).toHaveLength(0);
  });
});
