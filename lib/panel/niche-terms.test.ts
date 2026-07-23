import { describe, expect, it } from "vitest";
import { matchNichePriority } from "./niche-terms";

describe("matchNichePriority", () => {
  it("matches alimentação natural keywords as high priority", () => {
    expect(matchNichePriority("raçao")).toBe("high");
    expect(matchNichePriority("petisco natural cachorro")).toBe("high");
    expect(matchNichePriority("bifinho")).toBe("high");
  });

  it("matches acessório keywords as normal priority", () => {
    expect(matchNichePriority("coleira cachorros")).toBe("normal");
    expect(matchNichePriority("comedouro gato")).toBe("normal");
    expect(matchNichePriority("casinha gato")).toBe("normal");
  });

  it("returns null for keywords outside the niche", () => {
    expect(matchNichePriority("hamster")).toBeNull();
    expect(matchNichePriority("jabuti")).toBeNull();
  });

  it("is accent-insensitive", () => {
    expect(matchNichePriority("RAÇÃO")).toBe("high");
  });

  it("prefers high priority when a keyword matches both groups", () => {
    expect(matchNichePriority("coleira e racao natural")).toBe("high");
  });
});
