import { describe, expect, it, vi } from "vitest";
import { trends } from "./client";

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe("trends", () => {
  it("returns parsed entries on a successful call", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, [
        { keyword: "coleira cachorros", url: "https://lista.mercadolivre.com.br/coleira-cachorros" },
        { keyword: "racao", url: "https://lista.mercadolivre.com.br/racao" },
      ]),
    );

    const result = await trends("MLB1071", "token-abc", { fetchFn: fetchMock, sleep: async () => {} });

    expect(result).toEqual({
      ok: true,
      entries: [
        { keyword: "coleira cachorros", url: "https://lista.mercadolivre.com.br/coleira-cachorros", position: 1 },
        { keyword: "racao", url: "https://lista.mercadolivre.com.br/racao", position: 2 },
      ],
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mercadolibre.com/trends/MLB/MLB1071",
      expect.objectContaining({ headers: { Authorization: "Bearer token-abc" } }),
    );
  });

  it("retries on 429 and succeeds on a later attempt", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, { message: "too many requests" }))
      .mockResolvedValueOnce(jsonResponse(200, [{ keyword: "petisco", url: "https://x" }]));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await trends("MLB1071", "token-abc", { fetchFn: fetchMock, sleep });

    expect(result).toEqual({ ok: true, entries: [{ keyword: "petisco", url: "https://x", position: 1 }] });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it("gives up after max retries on persistent 5xx and returns a typed error", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(503, { message: "unavailable" }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await trends("MLB1071", "token-abc", {
      fetchFn: fetchMock,
      sleep,
      maxRetries: 2,
    });

    expect(result).toEqual({ ok: false, status: 503, message: expect.any(String) });
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("returns an immediate typed error on a non-retryable 4xx without retrying", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(403, { message: "forbidden" }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await trends("MLB1071", "token-abc", { fetchFn: fetchMock, sleep });

    expect(result).toEqual({ ok: false, status: 403, message: expect.any(String) });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("backs off with increasing delay across retries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(500, { message: "err" }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    await trends("MLB1071", "token-abc", { fetchFn: fetchMock, sleep, maxRetries: 2, baseDelayMs: 100 });

    expect(sleep).toHaveBeenNthCalledWith(1, 100);
    expect(sleep).toHaveBeenNthCalledWith(2, 200);
  });
});
