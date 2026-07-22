import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { trends } from "../../../lib/ml/client.ts";
import { getAccessToken, type SecretStore } from "../../../lib/ml/token-manager.ts";
import {
  finishRun,
  logError,
  saveTrendSnapshot,
  startRun,
  type RunStatus,
} from "../../../lib/db/repository.ts";

function createVaultSecretStore(client: SupabaseClient): SecretStore {
  return {
    async getSecret(name) {
      const { data, error } = await client.rpc("ml_auth_get_secret", { secret_name: name });
      if (error) throw new Error(`failed to read ${name}: ${error.message}`);
      if (typeof data !== "string" || data.length === 0) {
        throw new Error(`no ${name} found in Vault`);
      }
      return data;
    },
    async setSecret(name, value) {
      const { error } = await client.rpc("ml_auth_set_secret", {
        secret_name: name,
        secret_value: value,
      });
      if (error) throw new Error(`failed to persist secret ${name}: ${error.message}`);
    },
  };
}

/** Thin adapter: open a run, loop active trend_categories, pull /trends, write snapshots, close the run. */
async function collect(client: SupabaseClient): Promise<{ runId: string; status: RunStatus }> {
  const clientId = Deno.env.get("ML_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("ML_CLIENT_SECRET") ?? "";
  const vault = createVaultSecretStore(client);

  const accessToken = await getAccessToken({ clientId, clientSecret, vault });

  const { data: categories, error: categoriesError } = await client
    .from("trend_categories")
    .select("id")
    .eq("active", true);

  if (categoriesError) {
    throw new Error(`failed to load active trend_categories: ${categoriesError.message}`);
  }

  const runId = await startRun(client);
  const capturedAt = new Date();
  let hadSuccess = false;
  let hadFailure = false;

  for (const category of categories ?? []) {
    const result = await trends(category.id, accessToken);

    if (result.ok) {
      await saveTrendSnapshot(client, result.entries, {
        runId,
        categoryId: category.id,
        capturedAt,
      });
      hadSuccess = true;
    } else {
      hadFailure = true;
      await logError(client, {
        runId,
        stage: "trends",
        httpStatus: result.status,
        message: `category ${category.id}: ${result.message}`,
      });
    }
  }

  const status: RunStatus = hadFailure ? (hadSuccess ? "partial" : "failed") : "complete";
  await finishRun(client, runId, status);

  return { runId, status };
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const client = createClient(supabaseUrl, serviceRoleKey);

  try {
    const result = await collect(client);
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
