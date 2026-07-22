import { describe, expect, it } from "vitest";
import { computeExpiresAt, MlOAuthError, parseTokenExchangeResponse } from "./oauth";

describe("parseTokenExchangeResponse", () => {
  it("parses a well-formed ML token response", () => {
    const result = parseTokenExchangeResponse({
      access_token: "APP_USR-abc",
      token_type: "bearer",
      expires_in: 21600,
      refresh_token: "TG-refresh-abc",
      scope: "offline_access read",
      user_id: 12345,
    });

    expect(result).toEqual({
      accessToken: "APP_USR-abc",
      tokenType: "bearer",
      expiresIn: 21600,
      refreshToken: "TG-refresh-abc",
      scope: "offline_access read",
      userId: 12345,
    });
  });

  it("defaults tokenType, scope, and userId when absent", () => {
    const result = parseTokenExchangeResponse({
      access_token: "APP_USR-abc",
      expires_in: 21600,
      refresh_token: "TG-refresh-abc",
    });

    expect(result.tokenType).toBe("bearer");
    expect(result.scope).toBeNull();
    expect(result.userId).toBeNull();
  });

  it("throws MlOAuthError when access_token is missing", () => {
    expect(() =>
      parseTokenExchangeResponse({ expires_in: 21600, refresh_token: "TG-refresh-abc" }),
    ).toThrow(MlOAuthError);
  });

  it("throws MlOAuthError when refresh_token is missing", () => {
    expect(() =>
      parseTokenExchangeResponse({ access_token: "APP_USR-abc", expires_in: 21600 }),
    ).toThrow(MlOAuthError);
  });

  it("throws MlOAuthError when expires_in is missing or not a number", () => {
    expect(() =>
      parseTokenExchangeResponse({
        access_token: "APP_USR-abc",
        refresh_token: "TG-refresh-abc",
        expires_in: "21600",
      }),
    ).toThrow(MlOAuthError);
  });

  it("throws MlOAuthError when the response is not an object", () => {
    expect(() => parseTokenExchangeResponse(null)).toThrow(MlOAuthError);
    expect(() => parseTokenExchangeResponse("oops")).toThrow(MlOAuthError);
  });
});

describe("computeExpiresAt", () => {
  it("adds expires_in seconds to the issuance instant", () => {
    const issuedAt = new Date("2026-07-22T00:00:00.000Z");
    expect(computeExpiresAt(issuedAt, 21600)).toBe("2026-07-22T06:00:00.000Z");
  });
});
