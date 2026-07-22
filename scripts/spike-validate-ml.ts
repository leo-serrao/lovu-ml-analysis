/**
 * T6 de-risk spike (.specs/features/market-intel-mvp/tasks.md).
 * One-time validation run against the real ML API using the token obtained
 * during the OAuth handshake (T5). Not part of the collector; run manually via
 * `pnpm exec tsx scripts/spike-validate-ml.ts`.
 *
 * Validates:
 *  1. /sites/MLB/categories resolves the real pet category id (candidate: MLB1071).
 *  2. /sites/MLB/search returns items with our token (the 403 gotcha from design.md).
 *  3. /trends/MLB/{categoryId} returns entries (or documents seller-account gating).
 * If (2) fails, this script exits non-zero — per tasks.md, that STOPS the plan
 * before Phase 3/4 for user escalation.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getStoredAccessToken } from "../lib/ml/oauth";

config({ path: ".env.local" });

const ML_API_BASE = "https://api.mercadolibre.com";
const SEARCH_TERM = "petisco natural cachorro";
const CANDIDATE_CATEGORY_ID = "MLB1071";

async function mlGet(path: string, token: string) {
  const response = await fetch(`${ML_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, ok: response.ok, body };
}

async function resolvePetCategory(token: string) {
  const { status, ok, body } = await mlGet("/sites/MLB/categories", token);
  if (!ok) {
    return { status, resolved: null, categories: null };
  }

  const categories = body as Array<{ id: string; name: string }>;
  const match =
    categories.find((c) => c.id === CANDIDATE_CATEGORY_ID) ??
    categories.find((c) => /animai/i.test(c.name));

  return { status, resolved: match ?? null, categories };
}

async function main() {
  console.log("=== T6 spike: validating ML endpoints ===");

  const token = await getStoredAccessToken();

  const categoryResult = await resolvePetCategory(token);
  console.log(
    `/sites/MLB/categories -> status ${categoryResult.status}, resolved:`,
    categoryResult.resolved,
  );

  const searchResult = await mlGet(
    `/sites/MLB/search?q=${encodeURIComponent(SEARCH_TERM)}&limit=5`,
    token,
  );
  const searchBody = searchResult.body as { results?: unknown[] } | null;
  console.log(
    `/sites/MLB/search?q=${SEARCH_TERM} -> status ${searchResult.status}, results:`,
    searchBody?.results?.length ?? "n/a",
  );

  if (!searchResult.ok) {
    console.error(
      "STOP: /sites/MLB/search failed with our token. Escalate before Phase 3/4.",
    );
    console.error(JSON.stringify(searchResult.body));
    process.exitCode = 1;
    return;
  }

  const categoryId = categoryResult.resolved?.id ?? CANDIDATE_CATEGORY_ID;
  const trendsResult = await mlGet(`/trends/MLB/${categoryId}`, token);
  console.log(
    `/trends/MLB/${categoryId} -> status ${trendsResult.status}, entries:`,
    Array.isArray(trendsResult.body) ? trendsResult.body.length : trendsResult.body,
  );

  if (categoryResult.resolved) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { error } = await supabase.from("trend_categories").upsert({
      id: categoryResult.resolved.id,
      label: categoryResult.resolved.name,
      active: true,
    });
    if (error) {
      console.error("Failed to seed trend_categories:", error.message);
    } else {
      console.log(`Seeded trend_categories: ${categoryResult.resolved.id} (${categoryResult.resolved.name})`);
    }
  }

  console.log("=== spike complete ===");
}

main().catch((error) => {
  console.error("Spike failed:", error);
  process.exitCode = 1;
});
