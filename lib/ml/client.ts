const ML_API_BASE = "https://api.mercadolibre.com";

export interface TrendEntry {
  keyword: string;
  url: string;
  /** 1-based rank within the /trends response (rising/most-wanted/popular grouping is derived from this). */
  position: number;
}

export type TrendsResult =
  | { ok: true; entries: TrendEntry[] }
  | { ok: false; status: number; message: string };

export interface TrendsOptions {
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  maxRetries?: number;
  baseDelayMs?: number;
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Thin wrapper over GET /trends/MLB/{categoryId} with throttle + exponential backoff on 429/5xx. */
export async function trends(
  categoryId: string,
  token: string,
  options: TrendsOptions = {},
): Promise<TrendsResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 500;

  let attempt = 0;

  while (true) {
    const response = await fetchFn(`${ML_API_BASE}/trends/MLB/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const body = (await response.json()) as Array<{ keyword: string; url: string }>;
      return {
        ok: true,
        entries: body.map((entry, index) => ({ ...entry, position: index + 1 })),
      };
    }

    if (!isRetryable(response.status) || attempt >= maxRetries) {
      const body = await response.json().catch(() => null);
      return {
        ok: false,
        status: response.status,
        message: body?.message ?? `request failed with status ${response.status}`,
      };
    }

    await sleep(baseDelayMs * 2 ** attempt);
    attempt += 1;
  }
}
