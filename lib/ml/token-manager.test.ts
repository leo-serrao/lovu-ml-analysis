import { describe, expect, it, vi } from "vitest";
import { MlOAuthError } from "./oauth";
import { getAccessToken, refreshAccessToken, type SecretStore } from "./token-manager";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function fakeVault(initial: Record<string, string>): SecretStore & { store: Record<string, string> } {
  const store = { ...initial };
  return {
    store,
    async getSecret(name) {
      const value = store[name];
      if (value === undefined) throw new MlOAuthError(`no ${name} found in Vault`);
      return value;
    },
    async setSecret(name, value) {
      store[name] = value;
    },
  };
}

describe("refreshAccessToken", () => {
  it("exchanges a refresh_token grant for new tokens", async () => {
    const fetchFn = vi.fn(async (_url: string, init?: RequestInit) => {
      const body = new URLSearchParams(init?.body as string);
      expect(body.get("grant_type")).toBe("refresh_token");
      expect(body.get("refresh_token")).toBe("TG-old");
      return jsonResponse(200, {
        access_token: "APP_USR-new",
        token_type: "bearer",
        expires_in: 21600,
        refresh_token: "TG-new",
        scope: "offline_access read",
        user_id: 12345,
      });
    });

    const result = await refreshAccessToken(
      { refreshToken: "TG-old", clientId: "id", clientSecret: "secret" },
      fetchFn as unknown as typeof fetch,
    );

    expect(result.accessToken).toBe("APP_USR-new");
    expect(result.refreshToken).toBe("TG-new");
  });

  it("throws MlOAuthError on a non-ok response", async () => {
    const fetchFn = vi.fn(async () => jsonResponse(400, { message: "invalid_grant" }));

    await expect(
      refreshAccessToken(
        { refreshToken: "TG-old", clientId: "id", clientSecret: "secret" },
        fetchFn as unknown as typeof fetch,
      ),
    ).rejects.toThrow(MlOAuthError);
  });
});

describe("getAccessToken", () => {
  it("reads the refresh token from the vault, refreshes, and returns the new access token", async () => {
    const vault = fakeVault({ ml_refresh_token: "TG-old" });
    const fetchFn = vi.fn(async () =>
      jsonResponse(200, {
        access_token: "APP_USR-new",
        expires_in: 21600,
        refresh_token: "TG-new",
      }),
    );

    const accessToken = await getAccessToken({
      clientId: "id",
      clientSecret: "secret",
      vault,
      fetchFn: fetchFn as unknown as typeof fetch,
      now: () => new Date("2026-07-22T00:00:00.000Z"),
    });

    expect(accessToken).toBe("APP_USR-new");
  });

  it("rotates and re-persists the refresh_token back to the vault", async () => {
    const vault = fakeVault({ ml_refresh_token: "TG-old" });
    const fetchFn = vi.fn(async () =>
      jsonResponse(200, {
        access_token: "APP_USR-new",
        expires_in: 21600,
        refresh_token: "TG-new",
      }),
    );

    await getAccessToken({
      clientId: "id",
      clientSecret: "secret",
      vault,
      fetchFn: fetchFn as unknown as typeof fetch,
      now: () => new Date("2026-07-22T00:00:00.000Z"),
    });

    expect(vault.store.ml_refresh_token).toBe("TG-new");
    expect(vault.store.ml_access_token).toBe("APP_USR-new");
  });

  it("persists expires_at as issuedAt + expires_in", async () => {
    const vault = fakeVault({ ml_refresh_token: "TG-old" });
    const fetchFn = vi.fn(async () =>
      jsonResponse(200, {
        access_token: "APP_USR-new",
        expires_in: 21600,
        refresh_token: "TG-new",
      }),
    );

    await getAccessToken({
      clientId: "id",
      clientSecret: "secret",
      vault,
      fetchFn: fetchFn as unknown as typeof fetch,
      now: () => new Date("2026-07-22T00:00:00.000Z"),
    });

    expect(vault.store.ml_token_expires_at).toBe("2026-07-22T06:00:00.000Z");
  });

  it("propagates MlOAuthError when the vault has no refresh token", async () => {
    const vault = fakeVault({});
    const fetchFn = vi.fn();

    await expect(
      getAccessToken({
        clientId: "id",
        clientSecret: "secret",
        vault,
        fetchFn: fetchFn as unknown as typeof fetch,
      }),
    ).rejects.toThrow(MlOAuthError);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
