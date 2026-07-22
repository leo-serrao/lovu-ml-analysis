import { describe, expect, it } from "vitest";
import { deriveTrendType, mapTrendEntryToRow } from "./mappers";

describe("deriveTrendType", () => {
  it("classifies positions 1-10 as rising", () => {
    expect(deriveTrendType(1)).toBe("rising");
    expect(deriveTrendType(10)).toBe("rising");
  });

  it("classifies positions 11-30 as most_wanted", () => {
    expect(deriveTrendType(11)).toBe("most_wanted");
    expect(deriveTrendType(30)).toBe("most_wanted");
  });

  it("classifies positions 31+ as popular", () => {
    expect(deriveTrendType(31)).toBe("popular");
    expect(deriveTrendType(50)).toBe("popular");
  });
});

describe("mapTrendEntryToRow", () => {
  it("maps a /trends entry to a trend_snapshots row", () => {
    const capturedAt = new Date("2026-07-22T00:00:00.000Z");
    const row = mapTrendEntryToRow(
      { keyword: "raçao", url: "https://...", position: 5 },
      { runId: "run-1", categoryId: "MLB1071", capturedAt },
    );

    expect(row).toEqual({
      run_id: "run-1",
      category_id: "MLB1071",
      keyword: "raçao",
      trend_type: "rising",
      position: 5,
      captured_at: "2026-07-22T00:00:00.000Z",
    });
  });
});
