import { describe, expect, it } from "vitest";
import { getBlockReason, isBlocked } from "./blocklist";

describe("isBlocked / getBlockReason", () => {
  it("blocks known sensitive terms with the right reason", () => {
    expect(isBlocked("veneno para matar gatos")).toBe(true);
    expect(getBlockReason("pentobarbital sodico 500mg")).toBe("medico_sensivel");
    expect(getBlockReason("macaco prego")).toBe("fauna_silvestre_risco_legal");
    expect(getBlockReason("galinheiro")).toBe("fora_de_escopo_pecuaria");
  });

  it("is accent/case-insensitive", () => {
    expect(isBlocked("VENENO PARA MATAR GATOS")).toBe(true);
    expect(isBlocked("Jabuti")).toBe(true);
  });

  it("does not block adjacent-but-in-scope terms", () => {
    expect(isBlocked("hamster")).toBe(false);
    expect(isBlocked("bravecto 4 5 a 10 kg")).toBe(false);
    expect(isBlocked("coleira cachorros")).toBe(false);
  });

  it("only matches full terms, not substrings", () => {
    expect(isBlocked("jabuti de estimacao raro")).toBe(false);
  });
});
