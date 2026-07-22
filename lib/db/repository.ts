import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TrendEntry } from "../ml/client";
import { mapTrendEntryToRow } from "./mappers";

export class RepositoryError extends Error {}

export function createSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new RepositoryError("missing Supabase service-role env vars");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/** Opens a new collection_runs row (status='running') and returns its id. */
export async function startRun(client: SupabaseClient): Promise<string> {
  const { data, error } = await client
    .from("collection_runs")
    .insert({})
    .select("id")
    .single();

  if (error || !data) {
    throw new RepositoryError(`failed to start run: ${error?.message ?? "no row returned"}`);
  }

  return data.id as string;
}

export type RunStatus = "complete" | "partial" | "failed";

/** Closes a collection_runs row with a final status + finished_at timestamp. */
export async function finishRun(
  client: SupabaseClient,
  runId: string,
  status: RunStatus,
): Promise<void> {
  const { error } = await client
    .from("collection_runs")
    .update({ finished_at: new Date().toISOString(), status })
    .eq("id", runId);

  if (error) {
    throw new RepositoryError(`failed to finish run ${runId}: ${error.message}`);
  }
}

export interface SaveTrendSnapshotContext {
  runId: string;
  categoryId: string;
  capturedAt: Date;
}

/** Writes one trend_snapshots row per /trends entry. */
export async function saveTrendSnapshot(
  client: SupabaseClient,
  entries: TrendEntry[],
  context: SaveTrendSnapshotContext,
): Promise<void> {
  if (entries.length === 0) return;

  const rows = entries.map((entry) => mapTrendEntryToRow(entry, context));
  const { error } = await client.from("trend_snapshots").insert(rows);

  if (error) {
    throw new RepositoryError(`failed to save trend snapshots: ${error.message}`);
  }
}

export interface LogErrorParams {
  runId: string;
  stage: "auth" | "search" | "trends" | "write";
  message: string;
  httpStatus?: number;
}

/** Records a collection_errors row for the run; failures here never abort the run. */
export async function logError(client: SupabaseClient, params: LogErrorParams): Promise<void> {
  const { error } = await client.from("collection_errors").insert({
    run_id: params.runId,
    stage: params.stage,
    http_status: params.httpStatus ?? null,
    message: params.message,
  });

  if (error) {
    throw new RepositoryError(`failed to log collection error: ${error.message}`);
  }
}
